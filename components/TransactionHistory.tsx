'use client';

import React, { useState } from 'react';
import { ExternalLink, Filter, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { microSTXtoSTX, shortenAddress } from '@/lib/mockData';
import { Transaction } from '@/lib/types';
import StatusBadge from './StatusBadge';

const TX_TYPE_CONFIG = {
  claim: {
    label: 'Claim',
    icon: <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />,
    bg: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
  },
  additional_funds: {
    label: 'Extra Funds',
    icon: <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />,
    bg: 'bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  agreement_created: {
    label: 'Agreement',
    icon: <FileText className="w-3.5 h-3.5 text-indigo-400" />,
    bg: 'bg-indigo-500/15',
    textColor: 'text-indigo-400',
  },
  payment: {
    label: 'Payment',
    icon: <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />,
    bg: 'bg-amber-500/15',
    textColor: 'text-amber-400',
  },
};

type FilterType = 'all' | 'claim' | 'additional_funds' | 'agreement_created';

export default function TransactionHistory() {
  const { transactions } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = filter === 'all' ? transactions : transactions.filter(tx => tx.type === filter);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const confirmedCount = transactions.filter(tx => tx.status === 'confirmed').length;

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'claim', label: 'Claims' },
    { value: 'additional_funds', label: 'Extra Funds' },
    { value: 'agreement_created', label: 'Agreements' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Transaction History</h2>
        <p className="text-sm text-slate-400 mt-0.5">{transactions.length} transactions on Stacks Testnet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl border border-slate-800/60 px-4 py-3">
          <p className="text-xs text-slate-400 mb-1">Total Volume</p>
          <p className="text-lg font-bold text-white">{microSTXtoSTX(totalVolume)}</p>
          <p className="text-xs text-slate-500">STX</p>
        </div>
        <div className="glass rounded-xl border border-slate-800/60 px-4 py-3">
          <p className="text-xs text-slate-400 mb-1">Confirmed</p>
          <p className="text-lg font-bold text-emerald-400">{confirmedCount}</p>
          <p className="text-xs text-slate-500">transactions</p>
        </div>
        <div className="glass rounded-xl border border-slate-800/60 px-4 py-3">
          <p className="text-xs text-slate-400 mb-1">Total Txns</p>
          <p className="text-lg font-bold text-white">{transactions.length}</p>
          <p className="text-xs text-slate-500">all time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        {filters.map(f => (
          <button
            key={f.value}
            id={`filter-${f.value}`}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              filter === f.value
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            {f.label}
            <span className="ml-1 text-slate-500">
              ({f.value === 'all' ? transactions.length : transactions.filter(tx => tx.type === f.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-800/60 bg-slate-900/40">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Type</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/40">
          {paginated.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">No transactions found</div>
          ) : (
            paginated.map((tx, i) => <TxRow key={tx.txId + i} tx={tx} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1.5">
              <button
                id="prev-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-lg disabled:opacity-40 hover:bg-slate-800/60 transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  id={`page-btn-${p}`}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    page === p
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                id="next-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-lg disabled:opacity-40 hover:bg-slate-800/60 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.payment;

  return (
    <div id={`tx-${tx.txId.slice(0, 10)}`} className="px-4 md:px-6 py-3.5 hover:bg-slate-800/15 transition-colors">
      {/* Mobile layout */}
      <div className="md:hidden flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium truncate">{tx.description}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{tx.txId.slice(0, 18)}...</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-white">{microSTXtoSTX(tx.amount)} STX</p>
              <StatusBadge status={tx.status} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${config.textColor} font-medium`}>{config.label}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500">{tx.timestamp.toLocaleDateString()}</span>
            <a
              href={`https://explorer.hiro.so/txid/${tx.txId}?chain=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-slate-500 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-200 font-medium truncate">{tx.description}</p>
            <p className="text-xs text-slate-500 font-mono">{tx.txId.slice(0, 20)}...</p>
          </div>
        </div>
        <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
        <span className="text-sm font-bold text-white">{microSTXtoSTX(tx.amount)} STX</span>
        <span className="text-xs text-slate-400">{tx.timestamp.toLocaleDateString()}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={tx.status} size="sm" />
          <a
            href={`https://explorer.hiro.so/txid/${tx.txId}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-400 transition-colors"
            title="View on Stacks Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
