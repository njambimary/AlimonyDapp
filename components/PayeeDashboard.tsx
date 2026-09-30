'use client';

import React, { useState } from 'react';
import { DollarSign, Plus, Loader2, FileText, ExternalLink, Calendar, TrendingUp, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import { microSTXtoSTX, daysUntil, shortenAddress } from '@/lib/mockData';
import StatusBadge from './StatusBadge';

export default function PayeeDashboard() {
  const { wallet } = useWallet();
  const { agreements, fundRequests, transactions, claimPayment, addFundRequest } = useApp();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestForm, setRequestForm] = useState({ amount: '', reason: '', documentHash: '', documentLink: '', agreementId: '' });
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

  const myAgreements = agreements.filter(a => a.payeeAddress === wallet.address && a.status === 'active');
  const myRequests = fundRequests.filter(r => r.requesterAddress === wallet.address);
  const myClaims = transactions.filter(t => t.type === 'claim' && t.to === wallet.address);

  // Check if any agreement has claimable funds
  const claimableAgreements = myAgreements.filter(a => daysUntil(a.nextClaimDate) === 0);

  const handleClaim = async (agreementId: string) => {
    setClaiming(agreementId);
    await new Promise(r => setTimeout(r, 2000));
    claimPayment(agreementId);
    setClaiming(null);
    setClaimedId(agreementId);
    setTimeout(() => setClaimedId(null), 3000);
  };

  const validateRequestForm = () => {
    const errors: Record<string, string> = {};
    if (!requestForm.amount || Number(requestForm.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    if (!requestForm.reason.trim()) errors.reason = 'Reason is required';
    if (!requestForm.documentHash.trim()) errors.documentHash = 'Document hash or link is required';
    return errors;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateRequestForm();
    if (Object.keys(errors).length > 0) {
      setRequestErrors(errors);
      return;
    }
    setRequestErrors({});
    setSubmittingRequest(true);
    await new Promise(r => setTimeout(r, 1500));
    addFundRequest({
      agreementId: requestForm.agreementId || myAgreements[0]?.id || 'AGR-001',
      requesterAddress: wallet.address!,
      amount: Math.round(Number(requestForm.amount) * 1_000_000),
      reason: requestForm.reason,
      documentHash: requestForm.documentHash,
      documentLink: requestForm.documentLink,
    });
    setSubmittingRequest(false);
    setRequestSubmitted(true);
    setRequestForm({ amount: '', reason: '', documentHash: '', documentLink: '', agreementId: '' });
    setTimeout(() => { setRequestSubmitted(false); setShowRequestForm(false); }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="gradient-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-1">🏠 Payee Dashboard</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Your Payments & Claims</h2>
              <p className="text-slate-400 text-sm max-w-xl">
                View your active agreements, claim periodic payments, and request additional funds with full auditability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          label="Total Received"
          value={`${microSTXtoSTX(myClaims.reduce((sum, t) => sum + t.amount, 0))} STX`}
          sub="all time"
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          label="Active Agreements"
          value={String(myAgreements.length)}
          sub="payable agreements"
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          label="Pending Requests"
          value={String(myRequests.filter(r => r.status === 'pending').length)}
          sub="awaiting approval"
          color="amber"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-indigo-400" />}
          label="Total Claims"
          value={String(myClaims.length)}
          sub="successful claims"
          color="indigo"
        />
      </div>

      {/* Claim Available Card */}
      {claimableAgreements.length > 0 && (
        <div className="glass rounded-2xl border border-emerald-500/20 overflow-hidden glow-emerald">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-emerald-500/5 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Claim Available</h3>
          </div>
          <div className="p-6">
            {claimableAgreements.map(agreement => {
              const isClaiming = claiming === agreement.id;
              const justClaimed = claimedId === agreement.id;

              return (
                <div key={agreement.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{agreement.id}</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {microSTXtoSTX(agreement.amountPerPeriod)} <span className="text-lg text-slate-400">STX</span>
                    </p>
                    <p className="text-xs text-slate-500">Ready to claim now</p>
                  </div>
                  {justClaimed ? (
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Claimed!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaim(agreement.id)}
                      disabled={isClaiming}
                      className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5" />
                          Claim Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Claims */}
      {myAgreements.filter(a => daysUntil(a.nextClaimDate) > 0).length > 0 && (
        <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Upcoming Claims</h3>
          </div>
          <div className="p-6">
            {myAgreements.filter(a => daysUntil(a.nextClaimDate) > 0).map(agreement => {
              const days = daysUntil(agreement.nextClaimDate);
              return (
                <div key={agreement.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{agreement.id}</p>
                    <p className="text-2xl font-bold text-white mb-1">
                      {microSTXtoSTX(agreement.amountPerPeriod)} <span className="text-base text-slate-400">STX</span>
                    </p>
                    <p className="text-xs text-slate-500">Available in {days} day{days !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {days}d
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Request Additional Funds */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="font-semibold text-white">Request Additional Funds</h3>
          {!showRequestForm && myAgreements.length > 0 && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          )}
        </div>

        {showRequestForm ? (
          <div className="p-6">
            {requestSubmitted ? (
              <div className="p-12 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="font-semibold text-white text-lg">Request Submitted!</p>
                <p className="text-sm text-slate-400 mt-1">The payer has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">Amount (STX)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="500"
                      value={requestForm.amount}
                      onChange={e => setRequestForm(f => ({ ...f, amount: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${requestErrors.amount ? 'border-rose-500/60' : 'border-slate-700/60'}`}
                    />
                    {requestErrors.amount && <p className="text-xs text-rose-400">{requestErrors.amount}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">Agreement</label>
                    <select
                      value={requestForm.agreementId || myAgreements[0]?.id || ''}
                      onChange={e => setRequestForm(f => ({ ...f, agreementId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                    >
                      {myAgreements.map(a => (
                        <option key={a.id} value={a.id}>{a.id} – {microSTXtoSTX(a.amountPerPeriod)} STX/period</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">Reason <span className="text-slate-600 font-normal">(be specific)</span></label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Emergency medical bill for dental surgery..."
                    value={requestForm.reason}
                    onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 resize-none ${requestErrors.reason ? 'border-rose-500/60' : 'border-slate-700/60'}`}
                  />
                  {requestErrors.reason && <p className="text-xs text-rose-400">{requestErrors.reason}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">Document Hash or IPFS/Arweave Link</label>
                  <input
                    type="text"
                    placeholder="0x3a7d4f8b... or Qm... or https://arweave.net/..."
                    value={requestForm.documentHash}
                    onChange={e => setRequestForm(f => ({ ...f, documentHash: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${requestErrors.documentHash ? 'border-rose-500/60' : 'border-slate-700/60'}`}
                  />
                  {requestErrors.documentHash && <p className="text-xs text-rose-400">{requestErrors.documentHash}</p>}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submittingRequest ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRequestForm(false); setRequestForm({ amount: '', reason: '', documentHash: '', documentLink: '', agreementId: '' }); setRequestErrors({}); }}
                    className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-slate-400 text-sm">No active fund request</p>
            {myAgreements.length > 0 && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="mt-4 px-4 py-2 text-sm bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30"
              >
                Create Request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Previous Requests */}
      {myRequests.length > 0 && (
        <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <h3 className="font-semibold text-white">Previous Requests</h3>
            <span className="text-xs text-slate-500">{myRequests.length} total</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {myRequests.map(req => (
              <RequestRow key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}

      {/* Claims History */}
      {myClaims.length > 0 && (
        <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <h3 className="font-semibold text-white">Claims History</h3>
            <span className="text-xs text-slate-500">{myClaims.length} claims</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {myClaims.map((claim, i) => (
              <ClaimRow key={claim.txId + i} claim={claim} />
            ))}
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
  color: 'emerald' | 'blue' | 'amber' | 'indigo';
}) {
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'bg-emerald-500/20' },
    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'bg-blue-500/20' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'bg-amber-500/20' },
    indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  icon: 'bg-indigo-500/20' },
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

function RequestRow({ request }: { request: import('@/lib/types').FundRequest }) {
  const statusConfig = {
    pending: { icon: <Clock className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/15', border: 'border-amber-500/20' },
    approved: { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
    rejected: { icon: <XCircle className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-500/15', border: 'border-rose-500/20' },
  };
  const config = statusConfig[request.status];

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
            {request.resolvedAt && <span>Resolved {request.resolvedAt.toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-white">{microSTXtoSTX(request.amount)}</p>
          <p className="text-xs text-slate-400">STX</p>
        </div>
      </div>

      {/* Document */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bg} border ${config.border}`}>
          {config.icon}
          <span className="text-xs text-slate-300 font-mono">{request.documentHash.slice(0, 16)}...</span>
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
    </div>
  );
}

function ClaimRow({ claim }: { claim: import('@/lib/types').Transaction }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-800/15 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-200 font-medium">{claim.description}</p>
            <p className="text-xs text-slate-500">{claim.timestamp.toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-white">{microSTXtoSTX(claim.amount)} STX</p>
          <StatusBadge status={claim.status} size="sm" />
        </div>
      </div>
    </div>
  );
}
