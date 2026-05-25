"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ARCMIND_VAULT_ADDRESS } from "@/lib/contracts";

const totalAssetsAbi = [
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

export function LiveVaultValue({ fallback }: { fallback: number }) {
  const { data } = useReadContract({
    address: ARCMIND_VAULT_ADDRESS,
    abi: totalAssetsAbi,
    functionName: "totalAssets",
    query: { refetchInterval: 5000 }
  });
  const value = data === undefined ? fallback : Number(formatUnits(data, 6));
  return <div className="text-3xl font-semibold text-white">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>;
}
