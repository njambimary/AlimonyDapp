import { Agreement, FundRequest, Transaction } from './types';

const MOCK_PAYER = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ';
const MOCK_PAYEE = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';

// Helper to get a date X days from now
const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Helper to get a date X days ago
const getPastDate = (days: number) => {
  const date = new Date();
  if (days > 0) {
    date.setDate(date.getDate() - days);
  }
  return date;
};

export const MOCK_AGREEMENTS: Agreement[] = [
  {
    id: 'AGR-001',
    payerAddress: MOCK_PAYER,
    payeeAddress: MOCK_PAYEE,
    totalAmount: 36_000_000_000,     // 36,000 STX
    amountPerPeriod: 3_000_000_000,  // 3,000 STX/month
    periodDays: 30,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    totalPaid: 21_000_000_000,       // 21,000 STX paid
    lastClaimDate: getPastDate(30),
    nextClaimDate: new Date(),
    status: 'active',
    description: 'Monthly alimony agreement per court order #2024-CV-1138',
  },
  {
    id: 'AGR-002',
    payerAddress: MOCK_PAYER,
    payeeAddress: MOCK_PAYEE,
    totalAmount: 12_000_000_000,     // 12,000 STX
    amountPerPeriod: 1_000_000_000,  // 1,000 STX/month
    periodDays: 30,
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    totalPaid: 6_000_000_000,       // 6,000 STX paid
    lastClaimDate: new Date('2023-06-01'),
    nextClaimDate: new Date('2023-07-01'),
    status: 'cancelled',
    description: 'Previous agreement – cancelled by mutual consent',
  },
];

export const MOCK_FUND_REQUESTS: FundRequest[] = [
  {
    id: 'REQ-001',
    agreementId: 'AGR-001',
    requesterAddress: MOCK_PAYEE,
    amount: 1_500_000_000,  // 1,500 STX
    reason: 'Medical emergency – urgent dental surgery required.',
    documentHash: '0x3a7d4f8b...',
    documentLink: 'https://ipfs.io/ipfs/QmHash123',
    status: 'pending',
    createdAt: new Date('2024-09-20'),
  },
  {
    id: 'REQ-002',
    agreementId: 'AGR-001',
    requesterAddress: MOCK_PAYEE,
    amount: 800_000_000,   // 800 STX
    reason: 'School fees for September semester.',
    documentHash: '0x9c2e1a5f...',
    documentLink: 'https://ipfs.io/ipfs/QmHash456',
    status: 'approved',
    createdAt: new Date('2024-06-20'),
    resolvedAt: new Date('2024-06-22'),
  },
  {
    id: 'REQ-003',
    agreementId: 'AGR-001',
    requesterAddress: MOCK_PAYEE,
    amount: 2_000_000_000,  // 2,000 STX
    reason: 'Home repair – roof damage from storm.',
    documentHash: '0x7b3c9d2e...',
    status: 'rejected',
    createdAt: new Date('2024-05-10'),
    resolvedAt: new Date('2024-05-12'),
  },
  {
    id: 'REQ-004',
    agreementId: 'AGR-001',
    requesterAddress: MOCK_PAYEE,
    amount: 500_000_000,   // 500 STX
    reason: 'Car repair – brake replacement needed.',
    documentHash: 'QmXyZ123abc456def789',
    documentLink: 'https://arweave.net/abc123',
    status: 'pending',
    createdAt: new Date('2024-09-25'),
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    txId: '0xabc123def456...',
    type: 'claim',
    amount: 3_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: getPastDate(30),
    status: 'confirmed',
    description: 'Monthly claim – September 2024',
  },
  {
    txId: '0xdef456ghi789...',
    type: 'additional_funds',
    amount: 800_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-06-22'),
    status: 'confirmed',
    description: 'Additional funds – School fees (REQ-002)',
  },
  {
    txId: '0xghi789jkl012...',
    type: 'claim',
    amount: 3_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-08-15'),
    status: 'confirmed',
    description: 'Monthly claim – August 2024',
  },
  {
    txId: '0xjkl012mno345...',
    type: 'claim',
    amount: 3_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-07-15'),
    status: 'confirmed',
    description: 'Monthly claim – July 2024',
  },
  {
    txId: '0xmno345pqr678...',
    type: 'claim',
    amount: 3_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-06-15'),
    status: 'confirmed',
    description: 'Monthly claim – June 2024',
  },
  {
    txId: '0xpqr678stu901...',
    type: 'claim',
    amount: 3_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-05-15'),
    status: 'confirmed',
    description: 'Monthly claim – May 2024',
  },
  {
    txId: '0xstu901vwx234...',
    type: 'claim',
    amount: 3_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-04-15'),
    status: 'confirmed',
    description: 'Monthly claim – April 2024',
  },
  {
    txId: '0xvwx234yza567...',
    type: 'agreement_created',
    amount: 36_000_000_000,
    from: MOCK_PAYER,
    to: MOCK_PAYEE,
    timestamp: new Date('2024-01-01'),
    status: 'confirmed',
    description: 'Agreement AGR-001 created and funded',
  },
  {
    txId: '0xcancelled123...',
    type: 'payment',
    amount: 6_000_000_000,
    from: MOCK_PAYEE,
    to: MOCK_PAYER,
    timestamp: new Date('2023-06-15'),
    status: 'confirmed',
    description: 'Agreement AGR-002 cancelled – remaining funds returned',
  },
];

// Helper: convert microSTX to STX display string
export function microSTXtoSTX(microSTX: number): string {
  return (microSTX / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Helper: shorten address
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper: days until next claim
export function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export const MOCK_PAYER_ADDRESS = MOCK_PAYER;
export const MOCK_PAYEE_ADDRESS = MOCK_PAYEE;
