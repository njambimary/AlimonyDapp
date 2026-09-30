'use client';

import React, { useState } from 'react';
import { Plus, ExternalLink, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import { microSTXtoSTX, shortenAddress } from '@/lib/mockData';
import StatusBadge from './StatusBadge';

export default function FundRequests() {
  const { role, wallet } = useWallet();
  const { agreements, fundRequests, addFundRequest, approveFundRequest, rejectFundRequest } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', reason: '', documentHash: '', documentLink: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const myAgreements = agreements.filter(a =>
    role === 'payer' ? a.payerAddress === wallet.address : a.payeeAddress === wallet.address
  );
  const activeAgreement = myAgreements.find(a => a.status === 'active');

  const relevantRequests = fundRequests.filter(r =>
    myAgreements.some(a => a.id === r.agreementId)
  );
  const pendingRequests = relevantRequests.filter(r => r.status === 'pending');
  const resolvedRequests = relevantRequests.filter(r => r.status !== 'pending');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    if (!form.documentHash.trim()) e.documentHash = 'Document hash is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    addFundRequest({
      agreementId: activeAgreement?.id || 'AGR-001',
      requesterAddress: wallet.address!,
      amount: Math.round(Number(form.amount) * 1_000_000),
      reason: form.reason,
      documentHash: form.documentHash,
      documentLink: form.documentLink,
    });
    setSubmitting(false);
    setSubmitted(true);
    setForm({ amount: '', reason: '', documentHash: '', documentLink: '' });
    setTimeout(() => { setSubmitted(false); setShowForm(false); }, 2500);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Fund Requests</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {role === 'payer' ? `${pendingRequests.length} request${pendingRequests.length !== 1 ? 's' : ''} awaiting review` : 'Request additional funds from the payer'}
          </p>
        </div>
        {role === 'payee' && activeAgreement && !showForm && (
          <button
            id="new-request-btn"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Request Funds
          </button>
        )}
      </div>

      {/* Request Form (Payee) */}
      {role === 'payee' && showForm && (
        <div className="glass rounded-2xl border border-blue-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-blue-500/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">New Fund Request</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="p-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-semibold text-white">Request Submitted!</p>
              <p className="text-sm text-slate-400 mt-1">The payer has been notified.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4" id="fund-request-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">Amount (STX)</label>
                  <input
                    id="request-amount-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="500"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.amount ? 'border-rose-500/60' : 'border-slate-700/60'}`}
                  />
                  {errors.amount && <p className="text-xs text-rose-400">{errors.amount}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">Agreement</label>
                  <input
                    id="request-agreement-input"
                    readOnly
                    value={activeAgreement?.id || 'N/A'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Reason <span className="text-slate-600 font-normal">(be specific)</span></label>
                <textarea
                  id="request-reason-input"
                  rows={3}
                  placeholder="e.g. Emergency medical bill for dental surgery on Aug 15..."
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 resize-none ${errors.reason ? 'border-rose-500/60' : 'border-slate-700/60'}`}
                />
                {errors.reason && <p className="text-xs text-rose-400">{errors.reason}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Document Hash <span className="text-slate-600 font-normal">(IPFS/SHA-256)</span></label>
                <input
                  id="request-doc-hash-input"
                  type="text"
                  placeholder="0x3a7d4f8b... or Qm..."
                  value={form.documentHash}
                  onChange={e => setForm(f => ({ ...f, documentHash: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.documentHash ? 'border-rose-500/60' : 'border-slate-700/60'}`}
                />
                {errors.documentHash && <p className="text-xs text-rose-400">{errors.documentHash}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Document Link <span className="text-slate-600 font-normal">(optional)</span></label>
                <input
                  id="request-doc-link-input"
                  type="url"
                  placeholder="https://ipfs.io/ipfs/..."
                  value={form.documentLink}
                  onChange={e => setForm(f => ({ ...f, documentLink: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  id="submit-request-btn"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-xl hover:bg-slate-800/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="glass rounded-2xl border border-amber-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-amber-500/5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Pending Requests</h3>
            <span className="ml-auto px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full font-medium">{pendingRequests.length}</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {pendingRequests.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                role={role}
                processing={processing}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Requests */}
      {resolvedRequests.length > 0 && (
        <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60">
            <h3 className="font-semibold text-white text-sm">Request History</h3>
          </div>
          <div className="divide-y divide-slate-800/40">
            {resolvedRequests.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                role={role}
                processing={processing}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {relevantRequests.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-slate-400 text-sm">No fund requests yet</p>
          {role === 'payee' && activeAgreement && (
            <button
              id="empty-request-btn"
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 text-sm bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30"
            >
              Make First Request
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type RequestCardProps = {
  request: import('@/lib/types').FundRequest;
  role: import('@/lib/types').UserRole;
  processing: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

function RequestCard({ request, role, processing, onApprove, onReject }: RequestCardProps) {
  return (
    <div id={`request-${request.id}`} className="px-6 py-4 hover:bg-slate-800/15 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-300">{request.id}</span>
            <StatusBadge status={request.status} size="sm" />
          </div>
          <p className="text-sm text-slate-200 mb-1 leading-relaxed">{request.reason}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{request.createdAt.toLocaleDateString()}</span>
            {request.documentHash && (
              <span className="font-mono truncate max-w-[120px]">{request.documentHash}</span>
            )}
            {request.documentLink && (
              <a
                id={`doc-link-${request.id}`}
                href={request.documentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View doc
              </a>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-white">{microSTXtoSTX(request.amount)}</p>
          <p className="text-xs text-slate-400">STX</p>
        </div>
      </div>

      {role === 'payer' && request.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button
            id={`approve-btn-${request.id}`}
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
            id={`reject-btn-${request.id}`}
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
      )}
    </div>
  );
}
