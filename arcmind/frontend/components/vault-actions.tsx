"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Loader2, ShieldCheck } from "lucide-react";
import { parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { ARCMIND_VAULT_ADDRESS, USDC_ADDRESS, arcMindVaultAbi, erc20Abi } from "@/lib/contracts";

export function VaultActions() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("100");
  const [message, setMessage] = useState("USDC vault actions are ready when contract addresses are configured.");
  const { writeContractAsync, isPending } = useWriteContract();

  const amountUnits = useMemo(() => {
    try {
      return parseUnits(amount || "0", 6);
    } catch {
      return 0n;
    }
  }, [amount]);

  const configured = Boolean(ARCMIND_VAULT_ADDRESS && USDC_ADDRESS);

  async function approve() {
    if (!isConnected) return setMessage("Connect a wallet before approving USDC.");
    if (!configured || !ARCMIND_VAULT_ADDRESS || !USDC_ADDRESS) return setMessage("Add NEXT_PUBLIC_USDC_ADDRESS and NEXT_PUBLIC_ARCMIND_VAULT_ADDRESS to enable approvals.");
    if (amountUnits <= 0n) return setMessage("Enter a valid USDC amount.");
    const hash = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [ARCMIND_VAULT_ADDRESS, amountUnits]
    });
    setMessage(`Approval submitted: ${hash.slice(0, 10)}...${hash.slice(-6)}`);
  }

  async function deposit() {
    if (!isConnected) return setMessage("Connect a wallet before depositing USDC.");
    if (!configured || !ARCMIND_VAULT_ADDRESS) return setMessage("Add NEXT_PUBLIC_ARCMIND_VAULT_ADDRESS to enable deposits.");
    if (amountUnits <= 0n) return setMessage("Enter a valid USDC amount.");
    const hash = await writeContractAsync({
      address: ARCMIND_VAULT_ADDRESS,
      abi: arcMindVaultAbi,
      functionName: "deposit",
      args: [amountUnits]
    });
    setMessage(`Deposit submitted: ${hash.slice(0, 10)}...${hash.slice(-6)}`);
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Vault Entry</div>
          <div className="text-xs text-slate-500">Approve USDC, then deposit into AI allocation.</div>
        </div>
        <ShieldCheck size={18} className="text-arc-cyan" />
      </div>
      <div className="grid gap-2 sm:grid-cols-[120px_1fr_1fr]">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
          inputMode="decimal"
          aria-label="USDC amount"
        />
        <Button variant="secondary" onClick={approve} disabled={isPending}>
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <CircleDollarSign size={16} />}
          Approve USDC
        </Button>
        <Button onClick={deposit} disabled={isPending}>
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <CircleDollarSign size={16} />}
          Deposit
        </Button>
      </div>
      <div className="mt-3 text-xs text-slate-400">{message}</div>
    </div>
  );
}
