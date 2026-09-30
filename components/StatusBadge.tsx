'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'pending' | 'approved' | 'rejected' | 'confirmed' | 'failed';
  size?: 'sm' | 'md';
}

const statusConfig = {
  active:    { dot: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Active', pulse: true },
  completed: { dot: 'bg-blue-400',    bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30',    label: 'Completed', pulse: false },
  paused:    { dot: 'bg-amber-400',   bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   label: 'Paused', pulse: false },
  cancelled: { dot: 'bg-rose-400',    bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    label: 'Cancelled', pulse: false },
  pending:   { dot: 'bg-amber-400',   bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   label: 'Pending', pulse: true },
  approved:  { dot: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Approved', pulse: false },
  rejected:  { dot: 'bg-rose-400',    bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    label: 'Rejected', pulse: false },
  confirmed: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Confirmed', pulse: false },
  failed:    { dot: 'bg-rose-400',    bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    label: 'Failed', pulse: false },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';
  const dotSize = 'w-1.5 h-1.5';

  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${config.bg} ${config.text} ${textSize} font-semibold border ${config.border}`}>
      <span className={`${dotSize} rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}
