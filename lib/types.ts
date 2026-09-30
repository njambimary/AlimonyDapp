export type UserRole = 'payer' | 'payee' | null;

export interface Agreement {
  id: string;
  payerAddress: string;
  payeeAddress: string;
  totalAmount: number;       // in microSTX
  amountPerPeriod: number;   // in microSTX
  periodDays: number;
  startDate: Date;
  endDate: Date;
  totalPaid: number;         // in microSTX
  lastClaimDate: Date | null;
  nextClaimDate: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  description: string;
}

export interface FundRequest {
  id: string;
  agreementId: string;
  requesterAddress: string;
  amount: number;            // in microSTX
  reason: string;
  documentHash: string;
  documentLink?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Transaction {
  txId: string;
  type: 'payment' | 'claim' | 'additional_funds' | 'agreement_created';
  amount: number;            // in microSTX
  from: string;
  to: string;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
  description: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: 'mainnet' | 'testnet';
}
