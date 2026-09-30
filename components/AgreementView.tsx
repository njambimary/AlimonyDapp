'use client';

import React, { useState } from 'react';
import { Clock, DollarSign, TrendingUp, Calendar, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import { microSTXtoSTX, daysUntil, shortenAddress } from '@/lib/mockData';
import StatusBadge from './StatusBadge';

export default function AgreementView() {
  const { role, wallet } = useWallet();
  const { agreements, claimPayment, setActiveTab } = useApp();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedId, setClaimedId] = useState<string | null>(null);

  const myAgreements = agreements.filter(a =>
    role === 'payer' ? a.payerAddress === wallet.address : a.payeeAddress === wallet.address
  );

  const handleClaim = async (agreementId: string) => {
    setClaiming(agreementId);
    await new Promise(r => setTimeout(r, 2000));
    claimPayment(agreementId);
    setClaiming(null);
    setClaimedId(agreementId);
    setTimeout(() => setClaimedId(null), 3000);
  };

  if (myAgreements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-bold text-white mb-2">No Agreements Found</h3>
        <p className="text-slate-400 text-sm mb-6">
          {role === 'payer' ? 'Create your first alimony agreement.' : 'No active agreements assigned to your address.'}
        </p>
        {role === 'payer' && (
          <button
            id="agreement-view-create-btn"
            onClick={() => setActiveTab('create-agreement')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
          >
            + Create Agreement
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Active Agreements</h2>
        {role === 'payer' && (
          <button
            id="agreement-view-new-btn"
            onClick={() => setActiveTab('create-agreement')}
            className="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
          >
            + New Agreement
          </button>
        )}
      </div>

      {myAgreements.map(agreement => {
        const progress = Math.min((agreement.totalPaid / agreement.totalAmount) * 100, 100);
        const remaining = agreement.totalAmount - agreement.totalPaid;
        const days = daysUntil(agreement.nextClaimDate);
        const canClaim = role === 'payee' && agreement.status === 'active' && days === 0;
        const isCancelled = agreement.status === 'cancelled';
        const isClaiming = claiming === agreement.id;
        const justClaimed = claimedId === agreement.id;

        return (
          <div key={agreement.id} id={`agreement-${agreement.id}`} className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800/60 bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-lg">{agreement.id}</h3>
                    <StatusBadge status={agreement.status} />
                  </div>
                  <p className="text-sm text-slate-400">{agreement.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-2xl font-bold text-white">{microSTXtoSTX(agreement.amountPerPeriod)}</p>
                  <p className="text-xs text-slate-400">STX / {agreement.periodDays} days</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="px-6 py-4 border-b border-slate-800/40 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Payer</p>
                <p className="text-sm font-mono text-slate-300">{shortenAddress(agreement.payerAddress)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Payee</p>
                <p className="text-sm font-mono text-slate-300">{shortenAddress(agreement.payeeAddress)}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-800/40">
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-slate-400">Total Value</span>
                </div>
                <p className="text-base font-bold text-white">{microSTXtoSTX(agreement.totalAmount)} <span className="text-xs text-slate-400">STX</span></p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-slate-400">Total Paid</span>
                </div>
                <p className="text-base font-bold text-white">{microSTXtoSTX(agreement.totalPaid)} <span className="text-xs text-slate-400">STX</span></p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-slate-400">Remaining</span>
                </div>
                <p className="text-base font-bold text-white">{microSTXtoSTX(remaining)} <span className="text-xs text-slate-400">STX</span></p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs text-slate-400">Next Claim</span>
                </div>
                <p className="text-base font-bold text-white">
                  {days === 0 ? 'Now' : `${days}d`}
                </p>
                <p className="text-xs text-slate-500">{agreement.nextClaimDate.toLocaleDateString()}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="px-6 py-4 border-t border-slate-800/40 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Disbursement Progress</span>
                <span className="text-slate-300 font-medium">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar-fill"
                  style={{
                    width: `${progress}%`,
                    background: isCancelled
                      ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                      : progress >= 100
                      ? 'linear-gradient(90deg, #10b981, #059669)'
                      : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Started {agreement.startDate.toLocaleDateString()}</span>
                <span>Ends {agreement.endDate.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            {role === 'payee' && (
              <div className="px-6 pb-5 flex gap-3">
                {isCancelled ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 font-semibold text-sm">
                    ❌ Agreement Cancelled
                  </div>
                ) : justClaimed ? (
                  <div id={`claimed-success-${agreement.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold text-sm">
                    ✅ Payment claimed!
                  </div>
                ) : (
                  <button
                    id={`claim-btn-${agreement.id}`}
                    onClick={() => handleClaim(agreement.id)}
                    disabled={!canClaim || isClaiming}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      canClaim
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-700/40'
                    }`}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Claiming...
                      </>
                    ) : canClaim ? (
                      `💸 Claim ${microSTXtoSTX(agreement.amountPerPeriod)} STX`
                    ) : (
                      `⏳ Claim in ${days} day${days !== 1 ? 's' : ''}`
                    )}
                  </button>
                )}

                {!isCancelled && (
                  <button
                    id={`request-funds-btn-${agreement.id}`}
                    onClick={() => setActiveTab('fund-requests')}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                  >
                    Request Extra Funds
                  </button>
                )}
              </div>
            )}

            {role === 'payer' && (
              <div className="px-6 pb-5 flex gap-3">
                <button
                  id={`view-requests-btn-${agreement.id}`}
                  onClick={() => setActiveTab('fund-requests')}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                >
                  View Fund Requests
                </button>
                <a
                  id={`explorer-link-${agreement.id}`}
                  href={`https://explorer.hiro.so/txid/${agreement.id}?chain=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Explorer
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
