'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WalletState, UserRole } from '@/lib/types';
import { MOCK_PAYER_ADDRESS, MOCK_PAYEE_ADDRESS } from '@/lib/mockData';

interface WalletContextType {
  wallet: WalletState;
  role: UserRole;
  connectWallet: (asRole?: UserRole) => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const defaultWallet: WalletState = {
  address: null,
  isConnected: false,
  network: 'testnet',
};

const WalletContext = createContext<WalletContextType>({
  wallet: defaultWallet,
  role: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnecting: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [role, setRole] = useState<UserRole>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async (asRole?: UserRole) => {
    setIsConnecting(true);

    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // In production, this would call @stacks/connect's `connect()` function
    // For demo, we connect as mock payer or payee based on role choice
    const address = asRole === 'payee' ? MOCK_PAYEE_ADDRESS : MOCK_PAYER_ADDRESS;
    const connectedRole = asRole || 'payer';

    setWallet({
      address,
      isConnected: true,
      network: 'testnet',
    });
    setRole(connectedRole);
    setIsConnecting(false);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(defaultWallet);
    setRole(null);
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, role, connectWallet, disconnectWallet, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
