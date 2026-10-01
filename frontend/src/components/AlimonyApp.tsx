"use client";

import { connect, disconnect, getLocalStorage, isConnected } from "@stacks/connect";
import { Cl, type ClarityValue } from "@stacks/transactions";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CircleAlert,
  Clock3,
  FileCheck2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  useAlimonyAgreement_ApproveExtraRequest,
  useAlimonyAgreement_Claim,
  useAlimonyAgreement_CreateAgreement,
  useAlimonyAgreement_Deposit,
  useAlimonyAgreement_GetAgreement,
  useAlimonyAgreement_GetClaimableAmount,
  useAlimonyAgreement_GetContractBalance,
  useAlimonyAgreement_GetPendingRequests,
  useAlimonyAgreement_RejectExtraRequest,
  useAlimonyAgreement_RequestExtraFunds,
} from "@/generated/hooks";

type AgreementState = {
  payer: string;
  payee: string;
  amountPerPeriod: bigint;
  periodBlocks: bigint;
  totalPeriods: bigint;
  totalAmount: bigint;
  startBlock: bigint;
  totalDeposited: bigint;
  totalClaimed: bigint;
};

type ExtraRequest = {
  id: bigint;
  requester: string;
  amount: bigint;
  documentHash: string;
  reason: string;
  status: string;
  createdAt: bigint;
};

type WriteName = "create" | "deposit" | "claim" | "request" | "approve" | "reject";
type WriteCall = (args?: ClarityValue[]) => Promise<unknown>;
type ActionState = {
  name: WriteName;
  phase: "submitting" | "pending" | "success" | "error";
  summary: string;
  txid?: string;
  message?: string;
  amount?: bigint;
};
type SessionTransaction = { txid: string; name: string; amount?: bigint; confirmedAt: Date };

const MICRO_STX = 1_000_000n;
const BLOCKS_PER_DAY = 43_200n;

function unwrap(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(unwrap);
  if (typeof value !== "object") return value;

  const entry = value as Record<string, unknown>;
  if (entry.type === "none") return null;
  if (entry.type === "some") return unwrap(entry.value);
  if (entry.type === "tuple") return unwrap(entry.value);
  if (entry.type === "list") return unwrap(entry.value);
  if (["uint", "int", "bool", "principal", "string-ascii", "string-utf8"].includes(String(entry.type))) {
    return unwrap(entry.value);
  }
  return Object.fromEntries(Object.entries(entry).map(([key, field]) => [key, unwrap(field)]));
}

function record(value: unknown): Record<string, unknown> {
  const parsed = unwrap(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

function asBigInt(value: unknown): bigint {
  const parsed = unwrap(value);
  if (typeof parsed === "bigint") return parsed;
  if (typeof parsed === "number" || typeof parsed === "string") return BigInt(parsed);
  return 0n;
}

function asText(value: unknown): string {
  const parsed = unwrap(value);
  return typeof parsed === "string" ? parsed : "";
}

function parseAgreement(value: unknown): AgreementState | null {
  const data = record(value);
  if (data["agreement-exists"] !== true) return null;
  return {
    payer: asText(data.payer),
    payee: asText(data.payee),
    amountPerPeriod: asBigInt(data["amount-per-period"]),
    periodBlocks: asBigInt(data["period-blocks"]),
    totalPeriods: asBigInt(data["total-periods"]),
    totalAmount: asBigInt(data["total-amount"]),
    startBlock: asBigInt(data["start-block"]),
    totalDeposited: asBigInt(data["total-deposited"]),
    totalClaimed: asBigInt(data["total-claimed"]),
  };
}

function parsePendingRequest(value: unknown): ExtraRequest | null {
  const list = unwrap(value);
  if (!Array.isArray(list) || list.length === 0) return null;
  const data = record(list[0]);
  return {
    id: asBigInt(data["request-id"]),
    requester: asText(data.requester),
    amount: asBigInt(data.amount),
    documentHash: asText(data["document-hash"]).trimEnd(),
    reason: asText(data.reason),
    status: asText(data.status),
    createdAt: asBigInt(data["created-at"]),
  };
}

function parseStx(value: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(value.trim());
  if (!match) throw new Error("Enter a positive STX amount with at most 6 decimal places.");
  const fraction = (match[2] ?? "").padEnd(6, "0");
  const result = BigInt(match[1]) * MICRO_STX + BigInt(fraction || "0");
  if (result <= 0n) throw new Error("Amount must be greater than zero.");
  return result;
}

function formatStx(value: bigint): string {
  const whole = value / MICRO_STX;
  const fraction = (value % MICRO_STX).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole.toLocaleString()}.${fraction}` : whole.toLocaleString();
}

function formatAddress(value: string): string {
  return value ? `${value.slice(0, 7)}…${value.slice(-5)}` : "—";
}

function getStoredAddress(): string | null {
  if (!isConnected()) return null;
  const addresses = getLocalStorage()?.addresses?.stx ?? [];
  return addresses.find((entry) => entry.symbol === "STX")?.address
    ?? addresses.find((entry) => entry.address.startsWith("S"))?.address
    ?? null;
}

function documentHref(value: string): string | null {
  const normalized = value.trim();
  if (normalized.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${normalized.slice(7)}`;
  if (normalized.startsWith("ar://")) return `https://arweave.net/${normalized.slice(5)}`;
  try {
    const url = new URL(normalized);
    if (url.protocol === "https:" && ["ipfs.io", "gateway.pinata.cloud", "arweave.net"].includes(url.hostname)) return url.href;
  } catch {}
  return null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

export default function AlimonyApp() {
  const agreementRead = useAlimonyAgreement_GetAgreement();
  const claimableRead = useAlimonyAgreement_GetClaimableAmount();
  const balanceRead = useAlimonyAgreement_GetContractBalance();
  const pendingRead = useAlimonyAgreement_GetPendingRequests();
  const createWrite = useAlimonyAgreement_CreateAgreement();
  const depositWrite = useAlimonyAgreement_Deposit();
  const claimWrite = useAlimonyAgreement_Claim();
  const requestWrite = useAlimonyAgreement_RequestExtraFunds();
  const approveWrite = useAlimonyAgreement_ApproveExtraRequest();
  const rejectWrite = useAlimonyAgreement_RejectExtraRequest();

  const [address, setAddress] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<AgreementState | null>(null);
  const [claimable, setClaimable] = useState(0n);
  const [contractBalance, setContractBalance] = useState(0n);
  const [pendingRequest, setPendingRequest] = useState<ExtraRequest | null>(null);
  const [reading, setReading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"agreement" | "requests" | "activity">("agreement");
  const [action, setAction] = useState<ActionState | null>(null);
  const [activity, setActivity] = useState<SessionTransaction[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [payeeInput, setPayeeInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [periodBlocksInput, setPeriodBlocksInput] = useState("43200");
  const [periodsInput, setPeriodsInput] = useState("12");
  const [depositInput, setDepositInput] = useState("");
  const [requestAmountInput, setRequestAmountInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");

  const refresh = useCallback(async () => {
    setReading(true);
    setReadError(null);
    try {
      const [agreementValue, claimableValue, balanceValue, pendingValue] = await Promise.all([
        agreementRead.call([]),
        claimableRead.call([]),
        balanceRead.call([]),
        pendingRead.call([]),
      ]);
      setAgreement(parseAgreement(agreementValue));
      setClaimable(asBigInt(claimableValue));
      setContractBalance(asBigInt(balanceValue));
      setPendingRequest(parsePendingRequest(pendingValue));
    } catch (error) {
      setReadError(errorMessage(error));
    } finally {
      setReading(false);
    }
  }, [agreementRead.call, claimableRead.call, balanceRead.call, pendingRead.call]);

  useEffect(() => {
    try { setAddress(getStoredAddress()); } catch { setAddress(null); }
    setWalletReady(true);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const writeStates = {
    create: createWrite,
    deposit: depositWrite,
    claim: claimWrite,
    request: requestWrite,
    approve: approveWrite,
    reject: rejectWrite,
  };
  const activeWrite = action ? writeStates[action.name] : null;

  useEffect(() => {
    if (!action || action.phase !== "pending" || !activeWrite?.txStatus) return;
    if (activeWrite.txStatus === "success") {
      setAction((current) => current ? { ...current, phase: "success" } : current);
      if (action.txid) {
        setActivity((current) => [
          { txid: action.txid!, name: action.summary, amount: action.amount, confirmedAt: new Date() },
          ...current.filter((item) => item.txid !== action.txid),
        ]);
      }
      void refresh();
    } else if (activeWrite.txStatus === "abort_by_response" || activeWrite.txStatus === "error") {
      setAction((current) => current ? {
        ...current,
        phase: "error",
        message: activeWrite.txStatusError ?? "Transaction failed.",
      } : current);
    }
  }, [action, activeWrite?.txStatus, activeWrite?.txStatusError, refresh]);

  const role = agreement && address
    ? agreement.payer === address ? "payer" : agreement.payee === address ? "payee" : "other"
    : address ? "payer" : null;

  async function handleConnect() {
    setWalletBusy(true);
    setWalletError(null);
    try {
      const response = await connect();
      const selected = response.addresses.find((entry) => entry.symbol === "STX")
        ?? response.addresses.find((entry) => entry.address.startsWith("S"));
      if (!selected?.address) throw new Error("The connected wallet did not return a Stacks address.");
      setAddress(selected.address);
    } catch (error) {
      setWalletError(errorMessage(error));
    } finally {
      setWalletBusy(false);
    }
  }

  function handleDisconnect() {
    disconnect();
    setAddress(null);
    setWalletError(null);
  }

  async function submitWrite(name: WriteName, call: WriteCall, args: ClarityValue[], summary: string, amount?: bigint) {
    setFormError(null);
    setAction({ name, phase: "submitting", summary, amount });
    try {
      const result = await call(args) as { txid?: string; txId?: string } | undefined;
      const txid = result?.txid ?? result?.txId;
      if (!txid) throw new Error("No transaction was returned. Check the connected wallet and network.");
      setAction({ name, phase: "pending", summary, txid, amount });
    } catch (error) {
      setAction({ name, phase: "error", summary, message: errorMessage(error), amount });
    }
  }

  async function createAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!address) throw new Error("Connect the payer wallet first.");
      if (!payeeInput.startsWith("ST")) throw new Error("Enter a Stacks Testnet address beginning with ST.");
      const amount = parseStx(amountInput);
      const periodBlocks = BigInt(periodBlocksInput);
      const totalPeriods = BigInt(periodsInput);
      if (periodBlocks <= 0n || totalPeriods <= 0n) throw new Error("Period blocks and total periods must be positive.");
      if (amount * totalPeriods > (1n << 128n) - 1n) throw new Error("Agreement total exceeds the Clarity uint limit.");
      await submitWrite("create", createWrite.call, [Cl.principal(payeeInput.trim()), Cl.uint(amount), Cl.uint(periodBlocks), Cl.uint(totalPeriods)], "Create agreement");
    } catch (error) { setFormError(errorMessage(error)); }
  }

  async function deposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const amount = parseStx(depositInput);
      await submitWrite("deposit", depositWrite.call, [Cl.uint(amount)], "Deposit STX", amount);
    } catch (error) { setFormError(errorMessage(error)); }
  }

  function claim() {
    void submitWrite("claim", claimWrite.call, [], "Claim vested STX", claimable);
  }

  async function requestFunds(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const amount = parseStx(requestAmountInput);
      const hash = documentInput.trim();
      if (hash.length === 0 || hash.length > 64 || !/^[\x00-\x7F]+$/.test(hash)) throw new Error("Enter a document hash or URL of up to 64 ASCII characters.");
      if (!reasonInput.trim() || new TextEncoder().encode(reasonInput).length > 256) throw new Error("Enter a reason of up to 256 UTF-8 bytes.");
      await submitWrite("request", requestWrite.call, [Cl.uint(amount), Cl.stringAscii(hash.padEnd(64, " ")), Cl.stringUtf8(reasonInput)], "Request extra funds", amount);
    } catch (error) { setFormError(errorMessage(error)); }
  }

  function approveRequest() {
    if (pendingRequest) void submitWrite("approve", approveWrite.call, [Cl.uint(pendingRequest.id)], "Approve extra-funds request", pendingRequest.amount);
  }

  function rejectRequest() {
    if (pendingRequest) void submitWrite("reject", rejectWrite.call, [Cl.uint(pendingRequest.id)], "Reject extra-funds request", pendingRequest.amount);
  }

  const isWorking = action?.phase === "submitting" || action?.phase === "pending";
  const canCreate = Boolean(address) && !agreement && !reading && !readError;
  const documentUrl = pendingRequest ? documentHref(pendingRequest.documentHash) : null;

  return (
    <main className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><ShieldCheck size={19} /></span>
            <div><p className="font-semibold text-white">AlimonyPay</p><p className="text-xs text-slate-400">Stacks Testnet · Clarity 6</p></div>
          </div>
          {address ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:inline">{role === "other" ? "Not a party" : role ?? "Payer"}</span>
              <button onClick={handleDisconnect} className="rounded-lg border border-slate-700 px-3 py-2 font-mono text-xs text-slate-200 hover:border-slate-500" title="Disconnect wallet">{formatAddress(address)} · Disconnect</button>
            </div>
          ) : (
            <button onClick={() => void handleConnect()} disabled={!walletReady || walletBusy} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {walletBusy ? <LoaderCircle className="animate-spin" size={16} /> : <Wallet size={16} />}{walletBusy ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="gradient-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div><p className="mb-2 text-xs font-semibold uppercase text-blue-300">Alimony agreement</p><h1 className="text-2xl font-bold text-white sm:text-3xl">Payments governed on-chain</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Read the deployed agreement, fund it as payer, and claim vested STX or request additional funds as payee.</p></div>
            <button onClick={() => void refresh()} disabled={reading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"><RefreshCw size={15} className={reading ? "animate-spin" : ""} />Refresh state</button>
          </div>
        </section>

        {walletError && <Notice message={walletError} />}
        {readError && <Notice message={`Could not read the Testnet contract: ${readError}`} />}
        {formError && <Notice message={formError} onClose={() => setFormError(null)} />}
        {action && <ActionNotice action={action} />}

        <nav className="flex gap-2 border-b border-slate-800" aria-label="Agreement sections">
          {(["agreement", "requests", "activity"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-3 text-sm capitalize ${tab === item ? "border-blue-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}>{item === "activity" ? "Session Activity" : item === "requests" ? "Fund Requests" : "Agreement"}</button>)}
        </nav>

        {tab === "agreement" && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="glass rounded-xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Agreement state</h2><span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{reading ? "Loading" : agreement ? "Active" : "Not created"}</span></div>
              {reading ? <LoadingState label="Reading contract state…" /> : agreement ? (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DataItem label="Payer" value={formatAddress(agreement.payer)} /><DataItem label="Payee" value={formatAddress(agreement.payee)} />
                  <DataItem label="Amount per period" value={`${formatStx(agreement.amountPerPeriod)} STX`} />
                  <DataItem label="Period" value={`${agreement.periodBlocks.toLocaleString()} blocks · about ${Number(agreement.periodBlocks / BLOCKS_PER_DAY)} days`} />
                  <DataItem label="Total periods" value={agreement.totalPeriods.toString()} /><DataItem label="Agreement ceiling" value={`${formatStx(agreement.totalAmount)} STX`} />
                  <DataItem label="Deposited" value={`${formatStx(agreement.totalDeposited)} STX`} /><DataItem label="Claimed" value={`${formatStx(agreement.totalClaimed)} STX`} />
                  <DataItem label="Start block" value={agreement.startBlock.toLocaleString()} /><DataItem label="Contract balance" value={`${formatStx(contractBalance)} STX`} />
                </dl>
              ) : <p className="text-sm text-slate-400">No agreement has been created on this contract yet.</p>}
            </section>

            <section className="glass rounded-xl p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2"><Clock3 size={17} className="text-emerald-400" /><h2 className="text-lg font-semibold text-white">Claimable now</h2></div>
              <p className="text-3xl font-bold text-white">{formatStx(claimable)} <span className="text-base font-medium text-slate-400">STX</span></p>
              <p className="mt-2 text-xs text-slate-400">Vested amount, limited by deposited balance.</p>
              {role === "payee" && <button onClick={claim} disabled={isWorking || claimable === 0n} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">{action?.name === "claim" && isWorking ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}Claim vested STX</button>}
              {role === "other" && <p className="mt-4 text-xs text-amber-300">This wallet is not listed as payer or payee.</p>}
            </section>
          </div>
        )}

        {tab === "agreement" && canCreate && (
          <section className="glass rounded-xl p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Create agreement</h2><p className="mb-5 text-sm text-slate-400">The connected wallet becomes payer. Funding is a separate transaction.</p>
            <form onSubmit={(event) => void createAgreement(event)} className="grid gap-4 sm:grid-cols-2">
              <Field label="Payee Stacks address"><input value={payeeInput} onChange={(event) => setPayeeInput(event.target.value)} placeholder="ST…" className={inputClass} required /></Field>
              <Field label="Amount per period (STX)"><input type="number" min="0.000001" step="0.000001" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} className={inputClass} required /></Field>
              <Field label="Period length (Stacks blocks)"><input type="number" min="1" step="1" value={periodBlocksInput} onChange={(event) => setPeriodBlocksInput(event.target.value)} className={inputClass} required /><span className="text-xs text-slate-500">About 43,200 Stacks blocks per day.</span></Field>
              <Field label="Total periods"><input type="number" min="1" step="1" value={periodsInput} onChange={(event) => setPeriodsInput(event.target.value)} className={inputClass} required /></Field>
              <div className="sm:col-span-2"><button disabled={isWorking} className={primaryButton}>{action?.name === "create" && isWorking && <LoaderCircle size={16} className="animate-spin" />}Create agreement</button></div>
            </form>
          </section>
        )}

        {tab === "agreement" && role === "payer" && agreement && (
          <section className="glass rounded-xl p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Fund agreement</h2><p className="mb-5 text-sm text-slate-400">Deposits cannot exceed the authorized agreement ceiling.</p>
            <form onSubmit={(event) => void deposit(event)} className="flex flex-col gap-3 sm:flex-row sm:items-end"><Field label="Deposit amount (STX)"><input type="number" min="0.000001" step="0.000001" value={depositInput} onChange={(event) => setDepositInput(event.target.value)} className={inputClass} required /></Field><button disabled={isWorking} className={primaryButton}>{action?.name === "deposit" && isWorking && <LoaderCircle size={16} className="animate-spin" />}Deposit STX</button></form>
          </section>
        )}

        {tab === "requests" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="glass rounded-xl p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2"><FileCheck2 size={17} className="text-blue-300" /><h2 className="text-lg font-semibold text-white">Pending request</h2></div>
              {pendingRequest ? <div className="space-y-4">
                <DataItem label="Request ID" value={pendingRequest.id.toString()} /><DataItem label="Requester" value={formatAddress(pendingRequest.requester)} />
                <DataItem label="Requested amount" value={`${formatStx(pendingRequest.amount)} STX`} /><DataItem label="Reason" value={pendingRequest.reason} />
                <DataItem label="Document" value={pendingRequest.documentHash} href={documentUrl} /><DataItem label="Created at block" value={pendingRequest.createdAt.toLocaleString()} />
                {role === "payer" && <div className="flex gap-3 pt-2"><button onClick={approveRequest} disabled={isWorking} className={primaryButton}><Check size={16} />Approve</button><button onClick={rejectRequest} disabled={isWorking} className={secondaryButton}><X size={16} />Reject</button></div>}
              </div> : <p className="text-sm text-slate-400">There is no pending extra-funds request.</p>}
            </section>

            {role === "payee" && agreement && <section className="glass rounded-xl p-5 sm:p-6">
              <h2 className="mb-1 text-lg font-semibold text-white">Request extra funds</h2><p className="mb-5 text-sm text-slate-400">Only one request can be pending. The deployed contract stores a 64-character ASCII field; shorter values are padded on-chain and trimmed for display.</p>
              <form onSubmit={(event) => void requestFunds(event)} className="space-y-4">
                <Field label="Amount (STX)"><input type="number" min="0.000001" step="0.000001" value={requestAmountInput} onChange={(event) => setRequestAmountInput(event.target.value)} className={inputClass} required /></Field>
                <Field label="Document hash or IPFS/Arweave URL"><input value={documentInput} onChange={(event) => setDocumentInput(event.target.value)} maxLength={64} className={`${inputClass} font-mono`} placeholder="64-character ASCII value" required /></Field>
                <Field label="Reason"><textarea value={reasonInput} onChange={(event) => setReasonInput(event.target.value)} maxLength={256} rows={3} className={inputClass} required /></Field>
                <button disabled={isWorking || Boolean(pendingRequest)} className={primaryButton}>{action?.name === "request" && isWorking && <LoaderCircle size={16} className="animate-spin" />}Submit request</button>
              </form>
            </section>}
          </div>
        )}

        {tab === "activity" && <section className="glass rounded-xl p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><Activity size={17} className="text-blue-300" /><h2 className="text-lg font-semibold text-white">Confirmed activity in this session</h2></div>
          {activity.length === 0 ? <p className="text-sm text-slate-400">No transactions have been confirmed in this browser session.</p> : <ul className="divide-y divide-slate-800">{activity.map((item) => <li key={item.txid} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-white">{item.name}</p><p className="text-xs text-slate-400">{item.confirmedAt.toLocaleString()}{item.amount !== undefined ? ` · ${formatStx(item.amount)} STX` : ""}</p></div><a href={`https://explorer.hiro.so/txid/${item.txid}?chain=testnet`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200">View transaction <ArrowUpRight size={13} /></a></li>)}</ul>}
        </section>}

        <p className="text-xs text-slate-500">Contract: {process.env.NEXT_PUBLIC_ALIMONY_CONTRACT_ID} · <a href="https://explorer.hiro.so/address/ST2T6C1JTXS6AVQ4PTSQNS0MF666191WNC77NC2F.alimony-agreement?chain=testnet" target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">Explorer</a></p>
      </div>
    </main>
  );
}

function Notice({ message, onClose }: { message: string; onClose?: () => void }) {
  return <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"><CircleAlert size={16} className="mt-0.5 shrink-0" /><p className="flex-1">{message}</p>{onClose && <button onClick={onClose} aria-label="Dismiss error"><X size={15} /></button>}</div>;
}

function ActionNotice({ action }: { action: ActionState }) {
  const tone = action.phase === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : action.phase === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-blue-500/30 bg-blue-500/10 text-blue-100";
  const message = action.phase === "submitting" ? `Waiting for wallet approval: ${action.summary}` : action.phase === "pending" ? `Transaction submitted: ${action.summary}. Waiting for Testnet confirmation.` : action.phase === "success" ? `Confirmed: ${action.summary}.` : `${action.summary} failed: ${action.message ?? "Unknown error."}`;
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${tone}`}><div className="flex items-center gap-2">{action.phase === "pending" || action.phase === "submitting" ? <LoaderCircle size={15} className="animate-spin" /> : action.phase === "success" ? <Check size={15} /> : <CircleAlert size={15} />}<span>{message}</span></div>{action.txid && <a href={`https://explorer.hiro.so/txid/${action.txid}?chain=testnet`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs underline">{action.txid} <ArrowUpRight size={12} /></a>}</div>;
}

function LoadingState({ label }: { label: string }) {
  return <p className="flex items-center gap-2 text-sm text-slate-400"><LoaderCircle size={15} className="animate-spin" />{label}</p>;
}

function DataItem({ label, value, href }: { label: string; value: string; href?: string | null }) {
  return <div className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm text-slate-200">{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-300 underline">{value}<ArrowUpRight size={13} /></a> : value}</dd></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-slate-300">{label}{children}</label>;
}

const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-rose-400 hover:text-rose-200 disabled:opacity-50";