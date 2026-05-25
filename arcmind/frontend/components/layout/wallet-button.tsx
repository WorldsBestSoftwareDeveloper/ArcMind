"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { arcTestnet } from "@/lib/wagmi";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];
  const [hasProvider, setHasProvider] = useState(true);

  useEffect(() => {
    setHasProvider(typeof window !== "undefined" && Boolean(window.ethereum));
  }, []);

  async function connectWallet() {
    const ethereum = window.ethereum as EthereumProvider | undefined;
    if (!connector || !ethereum) return;
    await connect({ connector });
    const hexChainId = `0x${arcTestnet.id.toString(16)}`;
    try {
      await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexChainId }] });
    } catch {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexChainId,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            blockExplorerUrls: arcTestnet.blockExplorers?.default ? [arcTestnet.blockExplorers.default.url] : undefined
          }
        ]
      });
    }
  }

  if (isConnected) {
    return (
      <Button variant="secondary" onClick={() => disconnect()} title="Disconnect wallet">
        <Wallet size={16} />
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    );
  }

  if (!hasProvider) {
    return (
      <Button variant="secondary" disabled title="Open in a browser with MetaMask or Rabby installed">
        <AlertCircle size={16} />
        No wallet
      </Button>
    );
  }

  return (
    <Button onClick={connectWallet} disabled={!connector || isPending} title="Connect real wallet">
      <Wallet size={16} />
      Connect
    </Button>
  );
}
