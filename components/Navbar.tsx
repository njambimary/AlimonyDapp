'use client';

import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  History,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useApp } from '@/contexts/AppContext';
import WalletConnect from './WalletConnect';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: ('payer' | 'payee' | null)[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['payer', 'payee'] },
  { id: 'create-agreement', label: 'New Agreement', icon: <FilePlus className="w-4 h-4" />, roles: ['payer'] },
  { id: 'agreement', label: 'Agreement', icon: <FileText className="w-4 h-4" />, roles: ['payer', 'payee'] },
  { id: 'fund-requests', label: 'Fund Requests', icon: <Shield className="w-4 h-4" />, roles: ['payer', 'payee'] },
  { id: 'history', label: 'History', icon: <History className="w-4 h-4" />, roles: ['payer', 'payee'] },
];

export default function Navbar() {
  const { wallet, role } = useWallet();
  const { activeTab, setActiveTab } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const visibleItems = navItems.filter(item =>
    !wallet.isConnected || item.roles.includes(role as 'payer' | 'payee')
  );

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-lg">⚖️</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">AlimonyPay</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Stacks Protocol</p>
            </div>
          </div>

          {/* Desktop nav */}
          {wallet.isConnected && (
            <nav className="hidden md:flex items-center gap-1">
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            <WalletConnect />

            {/* Mobile hamburger */}
            {wallet.isConnected && (
              <button
                id="mobile-menu-btn"
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && wallet.isConnected && (
          <div className="md:hidden border-t border-slate-800/60 py-3 space-y-1">
            {visibleItems.map(item => (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
