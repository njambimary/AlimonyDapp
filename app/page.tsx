'use client';

import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { AppProvider, useApp } from '@/contexts/AppContext';
import Navbar from '@/components/Navbar';
import LandingHero from '@/components/LandingHero';
import Dashboard from '@/components/Dashboard';
import PayerDashboard from '@/components/PayerDashboard';
import PayeeDashboard from '@/components/PayeeDashboard';
import CreateAgreement from '@/components/CreateAgreement';
import AgreementView from '@/components/AgreementView';
import FundRequests from '@/components/FundRequests';
import TransactionHistory from '@/components/TransactionHistory';

function AppContent() {
  const { wallet, role } = useWallet();
  const { activeTab } = useApp();

  if (!wallet.isConnected) {
    return <LandingHero />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return role === 'payer' ? <PayerDashboard /> : <PayeeDashboard />;
      case 'create-agreement':
        return <CreateAgreement />;
      case 'agreement':
        return <AgreementView />;
      case 'fund-requests':
        return <FundRequests />;
      case 'history':
        return <TransactionHistory />;
      default:
        return role === 'payer' ? <PayerDashboard /> : <PayeeDashboard />;
    }
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {renderTab()}
    </main>
  );
}

export default function Home() {
  return (
    <WalletProvider>
      <AppProvider>
        <Navbar />
        <AppContent />

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-xs">⚖️</span>
              </div>
              <span className="text-sm font-semibold text-slate-500">AlimonyPay</span>
            </div>
            <p className="text-xs text-slate-600">
              Built on Stacks · Testnet · Smart contracts in Clarity
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://explorer.hiro.so/?chain=testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Explorer
              </a>
              <a
                href="https://docs.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Docs
              </a>
            </div>
          </div>
        </footer>
      </AppProvider>
    </WalletProvider>
  );
}
