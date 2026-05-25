from web3 import Web3
from eth_abi import decode

from app.config import get_settings


def _hex(value) -> str:
    text = value.hex() if hasattr(value, "hex") else str(value)
    return text if text.startswith("0x") else f"0x{text}"


ARCMIND_VAULT_ABI = [
    {
        "inputs": [],
        "name": "totalAssets",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "latestDecisionHash",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "traderId", "type": "bytes32"},
                    {"internalType": "uint16", "name": "weightBps", "type": "uint16"},
                    {"internalType": "int256", "name": "expectedEdgeBps", "type": "int256"},
                    {"internalType": "uint256", "name": "riskScore", "type": "uint256"},
                    {"internalType": "string", "name": "thesis", "type": "string"},
                ],
                "internalType": "struct ArcMindVault.Allocation[]",
                "name": "nextAllocations",
                "type": "tuple[]",
            },
            {"internalType": "bytes32", "name": "decisionHash", "type": "bytes32"},
            {"internalType": "string", "name": "rationale", "type": "string"},
        ],
        "name": "publishRebalance",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


class ArcChainService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.web3 = Web3(Web3.HTTPProvider(self.settings.arc_rpc_url))
        self.vault_address = self.settings.vault_address

    def vault_summary(self) -> dict:
        if not self.vault_address or not self.web3.is_connected():
            return {"connected": False, "tvl_usdc": 0.0, "latest_decision_hash": None}
        vault = self.web3.eth.contract(address=Web3.to_checksum_address(self.vault_address), abi=ARCMIND_VAULT_ABI)
        assets = vault.functions.totalAssets().call()
        latest_hash = vault.functions.latestDecisionHash().call().hex()
        return {"connected": True, "tvl_usdc": assets / 1e6, "latest_decision_hash": latest_hash}

    def vault_activity(self, from_block_window: int = 50_000) -> list[dict]:
        if not self.vault_address or not self.web3.is_connected():
            return []
        latest = self.web3.eth.block_number
        from_block = max(self.settings.arcmind_vault_deploy_block, latest - from_block_window)
        vault = Web3.to_checksum_address(self.vault_address)
        deposit_topic = _hex(Web3.keccak(text="Deposit(address,uint256,uint256)"))
        rebalance_topic = _hex(Web3.keccak(text="RebalancePublished(address,bytes32,uint256,uint256,string)"))
        logs = []
        current = from_block
        while current <= latest:
            to_block = min(latest, current + self.settings.arc_log_chunk_size)
            try:
                logs.extend(
                    self.web3.eth.get_logs(
                        {"fromBlock": current, "toBlock": to_block, "address": vault, "topics": [[deposit_topic, rebalance_topic]]}
                    )
                )
            except Exception:
                pass
            current = to_block + 1
        activity: list[dict] = []
        for log in reversed(logs[-20:]):
            topic0 = _hex(log["topics"][0])
            if topic0 == deposit_topic:
                user = Web3.to_checksum_address("0x" + _hex(log["topics"][1])[-40:])
                assets, shares = decode(["uint256", "uint256"], bytes(log["data"]))
                activity.append(
                    {
                        "type": "deposit",
                        "title": "USDC deposited",
                        "detail": f"{assets / 1e6:.2f} USDC · {shares / 1e6:.2f} shares",
                        "wallet": user,
                        "tx_hash": _hex(log["transactionHash"]),
                        "block": log["blockNumber"],
                    }
                )
            elif topic0 == rebalance_topic:
                agent = Web3.to_checksum_address("0x" + _hex(log["topics"][1])[-40:])
                decision_hash = _hex(log["topics"][2])
                activity.append(
                    {
                        "type": "rebalance",
                        "title": "AI rebalance anchored on Arc",
                        "detail": f"Decision {decision_hash[:12]}... published by agent",
                        "wallet": agent,
                        "tx_hash": _hex(log["transactionHash"]),
                        "block": log["blockNumber"],
                    }
                )
        return activity

    def publish_rebalance(self, decision) -> dict:
        settings = get_settings()
        if not self.vault_address:
            return {"submitted": False, "message": "ARCMIND_VAULT_ADDRESS is not configured."}
        if not settings.agent_private_key:
            return {"submitted": False, "message": "AGENT_PRIVATE_KEY is not configured."}
        if not self.web3.is_connected():
            return {"submitted": False, "message": "Arc RPC is not reachable."}

        account = self.web3.eth.account.from_key(settings.agent_private_key)
        vault = self.web3.eth.contract(address=Web3.to_checksum_address(self.vault_address), abi=ARCMIND_VAULT_ABI)
        allocations = [
            (
                Web3.keccak(text=allocation.trader_id),
                allocation.weight_bps,
                allocation.expected_edge_bps,
                allocation.risk_score,
                allocation.thesis,
            )
            for allocation in decision.allocations
        ]
        tx = vault.functions.publishRebalance(
            allocations,
            bytes.fromhex(decision.decision_hash.replace("0x", "")),
            decision.rationale,
        ).build_transaction(
            {
                "from": account.address,
                "nonce": self.web3.eth.get_transaction_count(account.address),
                "gas": 700_000,
                "gasPrice": self.web3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed.raw_transaction)
        return {"submitted": True, "tx_hash": _hex(tx_hash), "message": "Rebalance transaction submitted."}
