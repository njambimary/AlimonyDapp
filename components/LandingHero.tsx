'use client';

import React from 'react';
import { Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { UserRole } from '@/lib/types';

export default function LandingHero() {
  const { connectWallet, isConnecting } = useWallet();

  const handleConnect = async (role: UserRole) => {
    await connectWallet(role);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 mesh-bg relative">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-40 right-20 w-48 h-48 bg-emerald-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-slate-700/50 mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Powered by Stacks Blockchain</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
          Secure Alimony
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-300 bg-clip-text text-transparent">
            Payments On-Chain
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed">
          Transparent, trustless alimony agreements deployed as smart contracts on Stacks.
          Automated payments, auditable history, zero middlemen.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            id="hero-connect-payer"
            onClick={() => handleConnect('payer')}
            disabled={isConnecting}
            className="group flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/25 disabled:opacity-60"
          >
            💼 Connect as Payer
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            id="hero-connect-payee"
            onClick={() => handleConnect('payee')}
            disabled={isConnecting}
            className="group flex items-center justify-center gap-2.5 px-7 py-3.5 glass border border-slate-700/50 hover:border-blue-500/40 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-60"
          >
            🏠 Connect as Payee
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <FeatureCard
            icon={<Shield className="w-5 h-5 text-blue-400" />}
            title="Smart Contract"
            desc="Clarity-powered escrow locks funds on-chain"
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5 text-emerald-400" />}
            title="Automated Claims"
            desc="Periodic payouts enforced by the protocol"
          />
          <FeatureCard
            icon={<Globe className="w-5 h-5 text-indigo-400" />}
            title="Full Transparency"
            desc="Every transaction is publicly auditable"
          />
        </div>

        {/* Wallet compatibility */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <span className="text-xs text-slate-600">Compatible with</span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg glass border border-slate-700/40 text-xs font-medium text-slate-400">Leather</span>
            <span className="px-3 py-1 rounded-lg glass border border-slate-700/40 text-xs font-medium text-slate-400">Xverse</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass rounded-xl p-5 border border-slate-800/60 text-left hover:border-slate-700/60 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
