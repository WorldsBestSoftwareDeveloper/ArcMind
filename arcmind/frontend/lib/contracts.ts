import { parseUnits } from "viem";

export const ARCMIND_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_ARCMIND_VAULT_ADDRESS ?? process.env.NEXT_PUBLIC_COPY_VAULT_ADDRESS) as `0x${string}` | undefined;
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined;
export const DEFAULT_DEPOSIT = parseUnits("100", 6);

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const arcMindVaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "shares", type: "uint256" }]
  }
] as const;
