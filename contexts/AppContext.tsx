'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Agreement, FundRequest, Transaction } from '@/lib/types';
import {
  MOCK_AGREEMENTS,
  MOCK_FUND_REQUESTS,
  MOCK_TRANSACTIONS,
} from '@/lib/mockData';

interface AppContextType {
  agreements: Agreement[];
  fundRequests: FundRequest[];
  transactions: Transaction[];
  addAgreement: (agreement: Omit<Agreement, 'id' | 'totalPaid' | 'lastClaimDate' | 'nextClaimDate' | 'status'>) => void;
  addFundRequest: (request: Omit<FundRequest, 'id' | 'status' | 'createdAt'>) => void;
  approveFundRequest: (id: string) => void;
  rejectFundRequest: (id: string) => void;
  claimPayment: (agreementId: string) => void;
  depositFunds: (agreementId: string, amount: number) => void;
  cancelAgreement: (agreementId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType>({
  agreements: [],
  fundRequests: [],
  transactions: [],
  addAgreement: () => {},
  addFundRequest: () => {},
  approveFundRequest: () => {},
  rejectFundRequest: () => {},
  claimPayment: () => {},
  depositFunds: () => {},
  cancelAgreement: () => {},
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [agreements, setAgreements] = useState<Agreement[]>(MOCK_AGREEMENTS);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>(MOCK_FUND_REQUESTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState('dashboard');

  const addAgreement = (data: Omit<Agreement, 'id' | 'totalPaid' | 'lastClaimDate' | 'nextClaimDate' | 'status'>) => {
    const newAgreement: Agreement = {
      ...data,
      id: `AGR-${String(agreements.length + 1).padStart(3, '0')}`,
      totalPaid: 0,
      lastClaimDate: null,
      nextClaimDate: data.startDate,
      status: 'active',
    };
    setAgreements(prev => [newAgreement, ...prev]);

    const newTx: Transaction = {
      txId: `0x${Math.random().toString(16).slice(2)}`,
      type: 'agreement_created',
      amount: newAgreement.totalAmount,
      from: newAgreement.payerAddress,
      to: newAgreement.payeeAddress,
      timestamp: new Date(),
      status: 'confirmed',
      description: `Agreement ${newAgreement.id} created and funded`,
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const addFundRequest = (data: Omit<FundRequest, 'id' | 'status' | 'createdAt'>) => {
    const newRequest: FundRequest = {
      ...data,
      id: `REQ-${String(fundRequests.length + 1).padStart(3, '0')}`,
      status: 'pending',
      createdAt: new Date(),
    };
    setFundRequests(prev => [newRequest, ...prev]);
  };

  const approveFundRequest = (id: string) => {
    setFundRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'approved', resolvedAt: new Date() } : r)
    );
    const req = fundRequests.find(r => r.id === id);
    if (req) {
      const agreement = agreements.find(a => a.id === req.agreementId);
      const newTx: Transaction = {
        txId: `0x${Math.random().toString(16).slice(2)}`,
        type: 'additional_funds',
        amount: req.amount,
        from: agreement?.payerAddress || '',
        to: req.requesterAddress,
        timestamp: new Date(),
        status: 'confirmed',
        description: `Additional funds approved – ${req.reason.slice(0, 40)}`,
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const rejectFundRequest = (id: string) => {
    setFundRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'rejected', resolvedAt: new Date() } : r)
    );
  };

  const claimPayment = (agreementId: string) => {
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return;

    setAgreements(prev =>
      prev.map(a => {
        if (a.id !== agreementId) return a;
        const newPaid = a.totalPaid + a.amountPerPeriod;
        const nextClaim = new Date();
        nextClaim.setDate(nextClaim.getDate() + a.periodDays);
        return {
          ...a,
          totalPaid: newPaid,
          lastClaimDate: new Date(),
          nextClaimDate: nextClaim,
          status: newPaid >= a.totalAmount ? 'completed' : 'active',
        };
      })
    );

    const newTx: Transaction = {
      txId: `0x${Math.random().toString(16).slice(2)}`,
      type: 'claim',
      amount: agreement.amountPerPeriod,
      from: agreement.payerAddress,
      to: agreement.payeeAddress,
      timestamp: new Date(),
      status: 'confirmed',
      description: `Monthly claim – ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const depositFunds = (agreementId: string, amount: number) => {
    setAgreements(prev =>
      prev.map(a => {
        if (a.id !== agreementId) return a;
        return {
          ...a,
          totalAmount: a.totalAmount + amount,
        };
      })
    );

    const agreement = agreements.find(a => a.id === agreementId);
    if (agreement) {
      const newTx: Transaction = {
        txId: `0x${Math.random().toString(16).slice(2)}`,
        type: 'payment',
        amount: amount,
        from: agreement.payerAddress,
        to: agreement.payeeAddress,
        timestamp: new Date(),
        status: 'confirmed',
        description: `Additional funds deposited to ${agreementId}`,
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const cancelAgreement = (agreementId: string) => {
    setAgreements(prev =>
      prev.map(a => {
        if (a.id !== agreementId) return a;
        return {
          ...a,
          status: 'cancelled',
        };
      })
    );

    const agreement = agreements.find(a => a.id === agreementId);
    if (agreement) {
      const newTx: Transaction = {
        txId: `0x${Math.random().toString(16).slice(2)}`,
        type: 'payment',
        amount: agreement.totalAmount - agreement.totalPaid,
        from: agreement.payeeAddress,
        to: agreement.payerAddress,
        timestamp: new Date(),
        status: 'confirmed',
        description: `Agreement ${agreementId} cancelled – remaining funds returned`,
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  return (
    <AppContext.Provider value={{
      agreements,
      fundRequests,
      transactions,
      addAgreement,
      addFundRequest,
      approveFundRequest,
      rejectFundRequest,
      claimPayment,
      depositFunds,
      cancelAgreement,
      activeTab,
      setActiveTab,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
