'use client';

import React, { useState } from 'react';
import { FilePlus, Info, Loader2, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import { MOCK_PAYEE_ADDRESS } from '@/lib/mockData';

export default function CreateAgreement() {
  const { wallet } = useWallet();
  const { addAgreement, setActiveTab } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [form, setForm] = useState({
    payeeAddress: '',
    amountPerPeriod: '',
    periodLength: '30',
    periodUnit: 'days',
    totalPeriods: '',
    initialDeposit: '',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const tooltips = {
    payeeAddress: 'The Stacks address of the payee who will receive payments. Must start with SP or ST.',
    amountPerPeriod: 'Amount of STX to be paid to the payee each period. This will be automatically transferred when the payee claims.',
    periodLength: 'Length of time between automatic payments. On Stacks, blocks are produced approximately every 2 seconds.',
    periodUnit: 'Choose between days (simpler) or blocks (more precise blockchain timing). 1 day ≈ 43,200 blocks.',
    totalPeriods: 'Total number of payments to be made. The agreement will automatically complete after this many periods.',
    initialDeposit: 'Optional additional STX to deposit upfront. This can be used for emergency funds or to prefund the agreement.',
    startDate: 'When the agreement becomes active and the first claim period begins.',
    description: 'Reference to legal documents, court orders, or any relevant context for this agreement.',
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.payeeAddress.startsWith('SP') && !form.payeeAddress.startsWith('ST'))
      e.payeeAddress = 'Must be a valid Stacks address (SP... or ST...)';
    if (!form.amountPerPeriod || Number(form.amountPerPeriod) <= 0)
      e.amountPerPeriod = 'Amount per period must be greater than 0';
    if (!form.periodLength || Number(form.periodLength) <= 0)
      e.periodLength = 'Period length must be greater than 0';
    if (!form.totalPeriods || Number(form.totalPeriods) <= 0)
      e.totalPeriods = 'Total periods must be greater than 0';
    if (Number(form.totalPeriods) < 1)
      e.totalPeriods = 'At least 1 period is required';
    if (Number(form.totalPeriods) > 1000)
      e.totalPeriods = 'Total periods cannot exceed 1000';
    if (form.initialDeposit && Number(form.initialDeposit) < 0)
      e.initialDeposit = 'Initial deposit cannot be negative';
    if (!form.description.trim())
      e.description = 'Description is required';
    if (form.description.length > 500)
      e.description = 'Description must be less than 500 characters';
    return e;
  };

  const calculateTotalAmount = () => {
    const perPeriod = Number(form.amountPerPeriod) || 0;
    const periods = Number(form.totalPeriods) || 0;
    const initial = Number(form.initialDeposit) || 0;
    return (perPeriod * periods) + initial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setShowSummary(true);
  };

  const confirmSubmit = async () => {
    setShowSummary(false);
    setIsSubmitting(true);

    await new Promise(r => setTimeout(r, 2000));

    const periodDays = form.periodUnit === 'days' ? Number(form.periodLength) : Math.round(Number(form.periodLength) / 43200);

    addAgreement({
      payerAddress: wallet.address!,
      payeeAddress: form.payeeAddress,
      totalAmount: Math.round(calculateTotalAmount() * 1_000_000),
      amountPerPeriod: Math.round(Number(form.amountPerPeriod) * 1_000_000),
      periodDays: periodDays,
      startDate: new Date(form.startDate),
      endDate: new Date(new Date(form.startDate).getTime() + periodDays * Number(form.totalPeriods) * 24 * 60 * 60 * 1000),
      description: form.description,
    });

    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setActiveTab('agreement'), 2000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 animate-pulse-slow">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Agreement Created!</h3>
        <p className="text-slate-400 text-sm">Transaction confirmed on Stacks Testnet. Redirecting...</p>
      </div>
    );
  }

  if (showSummary) {
    const totalAmount = calculateTotalAmount();
    const periodDays = form.periodUnit === 'days' ? Number(form.periodLength) : Math.round(Number(form.periodLength) / 43200);
    const endDate = new Date(new Date(form.startDate).getTime() + periodDays * Number(form.totalPeriods) * 24 * 60 * 60 * 1000);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Confirm Agreement</h2>
            <p className="text-sm text-slate-400">Review the details before deploying to the blockchain</p>
          </div>
        </div>

        <div className="glass rounded-2xl border border-emerald-500/20 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-emerald-500/5">
            <h3 className="font-semibold text-white text-sm">Agreement Summary</h3>
          </div>
          <div className="p-6 space-y-4">
            <SummarySection label="Parties">
              <SummaryRow label="Payer" value={wallet.address || ''} truncate />
              <SummaryRow label="Payee" value={form.payeeAddress} truncate />
            </SummarySection>

            <SummarySection label="Payment Schedule">
              <SummaryRow label="Amount per period" value={`${Number(form.amountPerPeriod).toLocaleString()} STX`} />
              <SummaryRow label="Period length" value={`${form.periodLength} ${form.periodUnit}`} />
              <SummaryRow label="Total periods" value={form.totalPeriods} />
              <SummaryRow label="Start date" value={new Date(form.startDate).toLocaleDateString()} />
              <SummaryRow label="End date" value={endDate.toLocaleDateString()} />
            </SummarySection>

            <SummarySection label="Financials">
              <SummaryRow label="Payment total" value={`${(Number(form.amountPerPeriod) * Number(form.totalPeriods)).toLocaleString()} STX`} />
              {form.initialDeposit && (
                <SummaryRow label="Initial deposit" value={`${Number(form.initialDeposit).toLocaleString()} STX`} />
              )}
              <SummaryRow label="Total to lock" value={`${totalAmount.toLocaleString()} STX`} highlight />
            </SummarySection>

            <SummarySection label="Details">
              <SummaryRow label="Description" value={form.description} full />
            </SummarySection>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowSummary(false)}
            className="flex-1 py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition-colors border border-slate-700/60"
          >
            Back to Edit
          </button>
          <button
            onClick={confirmSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              '🔐 Confirm & Deploy'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <FilePlus className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Create Agreement</h2>
          <p className="text-sm text-slate-400">Deploy a new alimony agreement to the Stacks blockchain</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="create-agreement-form">
        {/* Info banner */}
        <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300 leading-relaxed">
            The total agreement amount will be locked in a Clarity smart contract on Stacks Testnet.
            Funds are only claimable by the payee address after each period elapses.
          </p>
        </div>

        <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Parties</h3>

          {/* Payer (readonly) */}
          <FormField label="Payer Address (You)" id="payer-address" tooltip={tooltips.payeeAddress}>
            <input
              id="payer-address-input"
              readOnly
              value={wallet.address || ''}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-sm font-mono cursor-not-allowed"
            />
          </FormField>

          {/* Payee address */}
          <FormField label="Payee Address" id="payee-address" error={errors.payeeAddress} tooltip={tooltips.payeeAddress}>
            <div className="flex gap-2">
              <input
                id="payee-address-input"
                type="text"
                placeholder="SP... or ST... address"
                value={form.payeeAddress}
                onChange={e => setForm(f => ({ ...f, payeeAddress: e.target.value }))}
                className={`flex-1 px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm font-mono transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.payeeAddress ? 'border-rose-500/60' : 'border-slate-700/60'}`}
              />
              <button
                type="button"
                id="use-demo-payee-btn"
                onClick={() => setForm(f => ({ ...f, payeeAddress: MOCK_PAYEE_ADDRESS }))}
                className="px-3 py-2 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition-colors whitespace-nowrap"
              >
                Use demo
              </button>
            </div>
          </FormField>
        </div>

        <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Payment Terms</h3>

          <FormField label="Amount per Period (STX)" id="amount-per-period" error={errors.amountPerPeriod} tooltip={tooltips.amountPerPeriod}>
            <input
              id="amount-per-period-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="3000"
              value={form.amountPerPeriod}
              onChange={e => setForm(f => ({ ...f, amountPerPeriod: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.amountPerPeriod ? 'border-rose-500/60' : 'border-slate-700/60'}`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Period Length" id="period-length" error={errors.periodLength} tooltip={tooltips.periodLength}>
              <input
                id="period-length-input"
                type="number"
                min="1"
                placeholder="30"
                value={form.periodLength}
                onChange={e => setForm(f => ({ ...f, periodLength: e.target.value }))}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.periodLength ? 'border-rose-500/60' : 'border-slate-700/60'}`}
              />
            </FormField>

            <FormField label="Unit" id="period-unit" tooltip={tooltips.periodUnit}>
              <select
                id="period-unit-select"
                value={form.periodUnit}
                onChange={e => setForm(f => ({ ...f, periodUnit: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="days">Days</option>
                <option value="blocks">Blocks</option>
              </select>
            </FormField>
          </div>

          <FormField label="Total Number of Periods" id="total-periods" error={errors.totalPeriods} tooltip={tooltips.totalPeriods}>
            <input
              id="total-periods-input"
              type="number"
              min="1"
              max="1000"
              placeholder="12"
              value={form.totalPeriods}
              onChange={e => setForm(f => ({ ...f, totalPeriods: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.totalPeriods ? 'border-rose-500/60' : 'border-slate-700/60'}`}
            />
          </FormField>

          <FormField label="Initial Deposit (STX - Optional)" id="initial-deposit" error={errors.initialDeposit} tooltip={tooltips.initialDeposit}>
            <input
              id="initial-deposit-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.initialDeposit}
              onChange={e => setForm(f => ({ ...f, initialDeposit: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 ${errors.initialDeposit ? 'border-rose-500/60' : 'border-slate-700/60'}`}
            />
          </FormField>

          <FormField label="Start Date" id="start-date" tooltip={tooltips.startDate}>
            <input
              id="start-date-input"
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </FormField>
        </div>

        <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Details</h3>

          <FormField label="Description / Legal Reference" id="description" error={errors.description} tooltip={tooltips.description}>
            <textarea
              id="description-input"
              rows={3}
              placeholder="e.g. Monthly alimony per court order #2024-CV-1138"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={500}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border text-slate-200 text-sm transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600 resize-none ${errors.description ? 'border-rose-500/60' : 'border-slate-700/60'}`}
            />
            <p className="text-xs text-slate-500 mt-1">{form.description.length}/500 characters</p>
          </FormField>
        </div>

        {/* Live Preview */}
        {form.amountPerPeriod && form.totalPeriods && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Live Preview</p>
            <SummaryRow label="Per payment" value={`${Number(form.amountPerPeriod).toLocaleString()} STX`} />
            <SummaryRow label="Total periods" value={form.totalPeriods} />
            <SummaryRow label="Period length" value={`${form.periodLength} ${form.periodUnit}`} />
            {form.initialDeposit && (
              <SummaryRow label="Initial deposit" value={`${Number(form.initialDeposit).toLocaleString()} STX`} />
            )}
            <SummaryRow label="Total to lock" value={`${calculateTotalAmount().toLocaleString()} STX`} highlight />
          </div>
        )}

        <button
          type="submit"
          id="submit-agreement-btn"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Broadcasting to Stacks Testnet...
            </>
          ) : (
            '📋 Review Agreement'
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, id, error, tooltip, children }: { label: string; id: string; error?: string; tooltip?: string; children: React.ReactNode }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div id={id} className="space-y-1.5 relative">
      <div className="flex items-center gap-1.5">
        <label htmlFor={`${id}-input`} className="block text-xs font-medium text-slate-400">
          {label}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg bg-slate-900 border border-slate-700/60 text-xs text-slate-300 leading-relaxed z-10 shadow-xl">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
      {error && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, truncate, full, highlight }: { label: string; value: string; truncate?: boolean; full?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${full ? 'flex-col gap-1' : ''}`}>
      <span className={`text-xs ${highlight ? 'text-slate-300 font-semibold' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-emerald-400 text-base' : 'text-slate-300'} ${truncate ? 'font-mono' : ''} ${full ? 'text-slate-200' : ''}`}>
        {truncate && value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value}
      </span>
    </div>
  );
}

function SummarySection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pb-3 border-b border-slate-700/40 last:border-0 last:pb-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
