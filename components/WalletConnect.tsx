'use client';

import React from 'react';
import { Wallet, ChevronDown, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { shortenAddress } from '@/lib/mockData';
import { UserRole } from '@/lib/types';

export default function WalletConnect() {
  const { wallet, role, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showRoleSelect, setShowRoleSelect] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowRoleSelect(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async (selectedRole: UserRole) => {
    setShowRoleSelect(false);
    await connectWallet(selectedRole);
  };

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          id="wallet-connected-btn"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl glass border border-slate-700/50 hover:border-blue-500/40 transition-all duration-200 group"
        >
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-200">{shortenAddress(wallet.address)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium capitalize">
            {role}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 transition-colors" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-52 glass rounded-xl border border-slate-700/50 shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Connected Wallet</p>
              <p className="text-sm text-slate-200 font-mono">{shortenAddress(wallet.address)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Stacks Testnet</p>
            </div>
            <div className="p-1.5">
              <button
                id="disconnect-wallet-btn"
                onClick={() => { disconnectWallet(); setShowDropdown(false); }}
                className="w-full px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="connect-wallet-btn"
        onClick={() => setShowRoleSelect(!showRoleSelect)}
        disabled={isConnecting}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>

      {showRoleSelect && !isConnecting && (
        <div className="absolute right-0 mt-2 w-64 glass rounded-xl border border-slate-700/50 shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-700/40">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Connect as</p>
          </div>
          <div className="p-1.5 space-y-1">
            <button
              id="connect-as-payer-btn"
              onClick={() => handleConnect('payer')}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-blue-500/10 rounded-lg transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500/30 transition-colors">
                <span className="text-base">💼</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Payer</p>
                <p className="text-xs text-slate-400">Create agreements, approve requests</p>
              </div>
            </button>
            <button
              id="connect-as-payee-btn"
              onClick={() => handleConnect('payee')}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-emerald-500/10 rounded-lg transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500/30 transition-colors">
                <span className="text-base">🏠</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Payee</p>
                <p className="text-xs text-slate-400">Claim payments, request funds</p>
              </div>
            </button>
          </div>
          <div className="px-3 pb-3">
            <p className="text-xs text-slate-500 mt-1">Compatible with Leather & Xverse</p>
          </div>
        </div>
      )}
    </div>
  );
}
