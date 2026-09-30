'use client';

import React from 'react';
import { TrendingUp, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import { microSTXtoSTX, daysUntil, shortenAddress } from '@/lib/mockData';
import StatusBadge from './StatusBadge';

export default function Dashboard() {
  const { role, wallet } = useWallet();
  const { agreements, fundRequests, transactions, setActiveTab } = useApp();

  const myAgreements = agreements.filter(a =>
    role === 'payer' ? a.payerAddress === wallet.address : a.payeeAddress === wallet.address
  );
  const activeAgreements = myAgreements.filter(a => a.status === 'active');
  const cancelledAgreements = myAgreements.filter(a => a.status === 'cancelled');
  const pendingRequests = fundRequests.filter(r => r.status === 'pending');
  const recentTxs = transactions.slice(0, 5);

  const totalPaid = myAgreements.reduce((sum, a) => sum + a.totalPaid, 0);
  const totalAgreementValue = myAgreements.reduce((sum, a) => sum + a.totalAmount, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="gradient-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">
                {role === 'payer' ? '💼 Payer Dashboard' : '🏠 Payee Dashboard'}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {role === 'payer' ? 'Manage Your Agreements' : 'Your Payments & Claims'}
              </h2>
              <p className="text-slate-400 text-sm max-w-xl">
                {role === 'payer'
                  ? 'Track all alimony agreements, review fund requests, and maintain full transparency on the Stacks blockchain.'
                  : 'View your active agreements, claim periodic payments, and request additional funds with full auditability.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-total-agreements"
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          label="Active Agreements"
          value={String(activeAgreements.length)}
          sub={`${cancelledAgreements.length} cancelled`}
          color="blue"
        />
        <StatCard
          id="stat-total-paid"
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          label={role === 'payer' ? 'Total Disbursed' : 'Total Received'}
          value={`${microSTXtoSTX(totalPaid)} STX`}
          sub={`of ${microSTXtoSTX(totalAgreementValue)} STX`}
          color="emerald"
        />
        <StatCard
          id="stat-next-claim"
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          label="Next Payment"
          value={activeAgreements.length > 0 ? `${daysUntil(activeAgreements[0].nextClaimDate)} days` : '—'}
          sub={activeAgreements[0] ? activeAgreements[0].nextClaimDate.toLocaleDateString() : 'No active agreement'}
          color="amber"
        />
        <StatCard
          id="stat-pending-requests"
          icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
          label="Pending Requests"
          value={String(pendingRequests.length)}
          sub="awaiting review"
          color="rose"
        />
      </div>

      {/* Active Agreements Overview */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="font-semibold text-white">Active Agreements</h3>
          {role === 'payer' && (
            <button
              id="dashboard-create-btn"
              onClick={() => setActiveTab('create-agreement')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10"
            >
              + New Agreement
            </button>
          )}
        </div>

        {myAgreements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-400 text-sm">No agreements yet</p>
            {role === 'payer' && (
              <button
                id="empty-create-btn"
                onClick={() => setActiveTab('create-agreement')}
                className="mt-4 px-4 py-2 text-sm bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30"
              >
                Create First Agreement
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {myAgreements.map(agreement => {
              const progress = (agreement.totalPaid / agreement.totalAmount) * 100;
              return (
                <div
                  key={agreement.id}
                  className="px-6 py-4 hover:bg-slate-800/20 transition-colors cursor-pointer group"
                  onClick={() => setActiveTab('agreement')}
                  id={`agreement-row-${agreement.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{agreement.id}</span>
                        <StatusBadge status={agreement.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 max-w-xs">{agreement.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-white">{microSTXtoSTX(agreement.amountPerPeriod)} STX</p>
                      <p className="text-xs text-slate-400">per {agreement.periodDays} days</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>{microSTXtoSTX(agreement.totalPaid)} / {microSTXtoSTX(agreement.totalAmount)} STX</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full progress-bar-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{progress.toFixed(1)}% disbursed</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="font-semibold text-white">Recent Transactions</h3>
          <button
            id="dashboard-history-btn"
            onClick={() => setActiveTab('history')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="divide-y divide-slate-800/40">
          {recentTxs.slice(0, 4).map(tx => (
            <div key={tx.txId} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'claim' ? 'bg-emerald-500/15' :
                  tx.type === 'additional_funds' ? 'bg-blue-500/15' :
                  tx.type === 'agreement_created' ? 'bg-indigo-500/15' :
                  'bg-slate-800/60'
                }`}>
                  {tx.type === 'claim' ? '💸' :
                   tx.type === 'additional_funds' ? '➕' :
                   tx.type === 'agreement_created' ? '📝' : '🔄'}
                </div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">{tx.description}</p>
                  <p className="text-xs text-slate-500">{tx.timestamp.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-semibold text-white">{microSTXtoSTX(tx.amount)} STX</p>
                <StatusBadge status={tx.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  id, icon, label, value, sub, color
}: {
  id: string;
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
    <div id={id} className={`rounded-2xl p-5 ${c.bg} border ${c.border}`}>
      <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
