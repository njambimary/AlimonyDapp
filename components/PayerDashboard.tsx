'use client';

import React, { useState } from 'react';
import { Wallet, Plus, ExternalLink, Loader2, Check, X, AlertCircle, FileText, DollarSign, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import { microSTXtoSTX, daysUntil, shortenAddress } from '@/lib/mockData';
import StatusBadge from './StatusBadge';

export default function PayerDashboard() {
  const { wallet } = useWallet();
  const { agreements, fundRequests, depositFunds, cancelAgreement, approveFundRequest, rejectFundRequest } = useApp();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);

  const myAgreements = agreements.filter(a => a.payerAddress === wallet.address);
  const activeAgreements = myAgreements.filter(a => a.status === 'active');
  const cancelledAgreements = myAgreements.filter(a => a.status === 'cancelled');
  const pendingRequests = fundRequests.filter(r => r.status === 'pending' && myAgreements.some(a => a.id === r.agreementId));

  const handleDeposit = async (agreementId: string) => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setDepositing(true);
    await new Promise(r => setTimeout(r, 2000));
    depositFunds(agreementId, Math.round(Number(depositAmount) * 1_000_000));
    setDepositing(false);
    setDepositAmount('');
    setShowDepositModal(false);
  };

  const handleCancel = async (agreementId: string) => {
    setCancelling(agreementId);
    await new Promise(r => setTimeout(r, 1500));
    cancelAgreement(agreementId);
    setCancelling(null);
  };

  const handleApprove = async (id: string) => {
    setProcessing(id + '-approve');
    await new Promise(r => setTimeout(r, 1500));
    approveFundRequest(id);
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id + '-reject');
    await new Promise(r => setTimeout(r, 1000));
    rejectFundRequest(id);
    setProcessing(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="gradient-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">💼 Payer Dashboard</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Manage Your Agreements</h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Track all alimony agreements, review fund requests, and maintain full transparency on the Stacks blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          label="Active Agreements"
          value={String(activeAgreements.length)}
          sub={`${cancelledAgreements.length} cancelled`}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          label="Total Locked"
          value={`${microSTXtoSTX(myAgreements.reduce((sum, a) => sum + a.totalAmount, 0))} STX`}
          sub="in smart contracts"
          color="emerald"
        />
        <StatCard
          icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
          label="Total Claimed"
          value={`${microSTXtoSTX(myAgreements.reduce((sum, a) => sum + a.totalPaid, 0))} STX`}
          sub="by payees"
          color="amber"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
          label="Pending Requests"
          value={String(pendingRequests.length)}
          sub="awaiting review"
          color="rose"
        />
      </div>

      {/* Pending Fund Requests */}
      {pendingRequests.length > 0 && (
        <div className="glass rounded-2xl border border-amber-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-amber-500/5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Pending Fund Requests</h3>
            <span className="ml-auto px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full font-medium">
              {pendingRequests.length}
            </span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {pendingRequests.map(req => (
              <FundRequestCard
                key={req.id}
                request={req}
                processing={processing}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Agreements */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="font-semibold text-white">Active Agreements</h3>
        </div>

        {activeAgreements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-400 text-sm">No active agreements</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {activeAgreements.map(agreement => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                onDeposit={() => { setSelectedAgreement(agreement.id); setShowDepositModal(true); }}
                onCancel={() => handleCancel(agreement.id)}
                cancelling={cancelling === agreement.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancelled Agreements */}
      {cancelledAgreements.length > 0 && (
        <div className="glass rounded-2xl border border-rose-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-rose-500/5 flex items-center gap-2">
            <X className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-white text-sm">Cancelled Agreements</h3>
            <span className="ml-auto px-2 py-0.5 text-xs bg-rose-500/20 text-rose-400 rounded-full font-medium">
              {cancelledAgreements.length}
            </span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {cancelledAgreements.map(agreement => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                onDeposit={() => {}}
                onCancel={() => {}}
                cancelling={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl border border-slate-700/50 w-full max-w-md p-6 relative">
            <button
              onClick={() => { setShowDepositModal(false); setDepositAmount(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Deposit Additional Funds</h3>
            <p className="text-sm text-slate-400 mb-6">Add more STX to the agreement contract</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (STX)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="1000"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600"
                />
              </div>

              <button
                onClick={() => selectedAgreement && handleDeposit(selectedAgreement)}
                disabled={depositing || !depositAmount || Number(depositAmount) <= 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {depositing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Deposit Funds
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const colorClasses = {
    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'bg-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'bg-emerald-500/20' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'bg-amber-500/20' },
    rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: 'bg-rose-500/20' },
  };
  const c = colorClasses[color];
  return (
    <div className={`rounded-2xl p-5 ${c.bg} border ${c.border}`}>
      <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function AgreementCard({
  agreement,
  onDeposit,
  onCancel,
  cancelling,
}: {
  agreement: import('@/lib/types').Agreement;
  onDeposit: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const progress = agreement.status === 'cancelled' ? 100 : Math.min((agreement.totalPaid / agreement.totalAmount) * 100, 100);
  const remaining = agreement.totalAmount - agreement.totalPaid;
  const periodsCompleted = Math.floor(agreement.totalPaid / agreement.amountPerPeriod);
  const totalPeriods = Math.floor(agreement.totalAmount / agreement.amountPerPeriod);

  return (
    <div className="px-6 py-5 hover:bg-slate-800/15 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">{agreement.id}</span>
            <StatusBadge status={agreement.status} size="sm" />
          </div>
          <p className="text-xs text-slate-400 max-w-sm">{agreement.description}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-sm font-bold text-white">{microSTXtoSTX(agreement.amountPerPeriod)} STX</p>
          <p className="text-xs text-slate-400">per {agreement.periodDays} days</p>
        </div>
      </div>

      {/* Payee Info */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500">Payee</p>
          <p className="text-sm font-mono text-slate-300">{shortenAddress(agreement.payeeAddress)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-xs text-slate-500 mb-1">Total Locked</p>
          <p className="text-sm font-bold text-white">{microSTXtoSTX(agreement.totalAmount)} STX</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-xs text-slate-500 mb-1">Total Claimed</p>
          <p className="text-sm font-bold text-emerald-400">{microSTXtoSTX(agreement.totalPaid)} STX</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-xs text-slate-500 mb-1">Remaining</p>
          <p className="text-sm font-bold text-amber-400">{microSTXtoSTX(remaining)} STX</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-xs text-slate-500 mb-1">Next Claim</p>
          <p className="text-sm font-bold text-white">{daysUntil(agreement.nextClaimDate)} days</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Progress: {periodsCompleted} / {totalPeriods} periods</span>
          <span className="text-slate-300 font-medium">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full progress-bar-fill"
            style={{
              width: `${progress}%`,
              background: agreement.status === 'cancelled'
                ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      {agreement.status === 'active' ? (
        <div className="flex gap-2">
          <button
            onClick={onDeposit}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Deposit More
          </button>
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {cancelling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5" />
                Cancel Agreement
              </>
            )}
          </button>
          <a
            href={`https://explorer.hiro.so/txid/${agreement.id}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Explorer
          </a>
        </div>
      ) : agreement.status === 'cancelled' ? (
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-400">
            <X className="w-3.5 h-3.5" />
            Cancelled
          </div>
          <a
            href={`https://explorer.hiro.so/txid/${agreement.id}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Explorer
          </a>
        </div>
      ) : null}
    </div>
  );
}

function FundRequestCard({
  request,
  processing,
  onApprove,
  onReject,
}: {
  request: import('@/lib/types').FundRequest;
  processing: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="px-6 py-4 hover:bg-slate-800/15 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-300">{request.id}</span>
            <StatusBadge status={request.status} size="sm" />
          </div>
          <p className="text-sm text-slate-200 mb-2 leading-relaxed">{request.reason}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{request.createdAt.toLocaleDateString()}</span>
            <span className="font-mono truncate max-w-[100px]">{request.documentHash}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-white">{microSTXtoSTX(request.amount)}</p>
          <p className="text-xs text-slate-400">STX</p>
        </div>
      </div>

      {/* Document Links */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">{request.documentHash.slice(0, 12)}...</span>
        </div>
        {request.documentLink && (
          <a
            href={request.documentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Document
          </a>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(request.id)}
          disabled={processing !== null}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {processing === request.id + '-approve'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Check className="w-3.5 h-3.5" />
          }
          Approve
        </button>
        <button
          onClick={() => onReject(request.id)}
          disabled={processing !== null}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {processing === request.id + '-reject'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <X className="w-3.5 h-3.5" />
          }
          Reject
        </button>
      </div>
    </div>
  );
}
