import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// ===== INTERFACES =====
export interface AllocationPreview {
  bu: string;
  percentage: number;
  amount: number;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Transaction {
  id: string;
  transactionCode: string;
  transactionDate: string;
  transactionType: 'income' | 'expense' | 'loan';
  category: string;
  project?: string;
  objectType: 'partner' | 'employee';
  objectName: string;
  paymentMethod: string;
  businessUnit: string;
  amount: number;
  costAllocation: 'direct' | 'indirect';
  allocationRule?: string;
  allocationPreview?: AllocationPreview[];
  attachments: number;
  attachedFiles?: AttachedFile[];
  paymentStatus: 'paid' | 'unpaid';
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  description: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ===== CONTEXT INTERFACE =====
interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByBU: (buId: string, includeIndirect?: boolean) => Transaction[];
  getApprovedTransactions: () => Transaction[];
  refreshTransactions: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// ===== MOCK DATA =====
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    transactionCode: 'T0125_01',
    transactionDate: '15/01/2025',
    transactionType: 'income',
    category: 'Doanh thu dịch vụ',
    project: 'PRJ-2024-001',
    objectType: 'partner',
    objectName: 'Công ty TNHH ABC',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Software',
    amount: 50000000,
    costAllocation: 'direct',
    attachments: 2,
    attachedFiles: [
      { id: '1', name: 'hop_dong.pdf', size: 1024000, type: 'application/pdf', url: '#' },
      { id: '2', name: 'bien_ban.jpg', size: 512000, type: 'image/jpeg', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Thanh toán dự án phần mềm'
  },
  {
    id: '2',
    transactionCode: 'C0125_01',
    transactionDate: '16/01/2025',
    transactionType: 'expense',
    category: 'Chi phí văn phòng',
    objectType: 'partner',
    objectName: 'Nhà cung cấp JKL',
    paymentMethod: 'Tiền mặt',
    businessUnit: 'BlueBolt G&A',
    amount: 5000000,
    costAllocation: 'indirect',
    allocationRule: 'Theo tỷ lệ doanh thu',
    allocationPreview: [
      { bu: 'BlueBolt G&A', percentage: 17, amount: 850000 },
      { bu: 'BlueBolt R&D', percentage: 14, amount: 700000 },
      { bu: 'BlueBolt Academy', percentage: 13, amount: 650000 },
      { bu: 'BlueBolt Services', percentage: 19, amount: 950000 },
      { bu: 'BlueBolt Software', percentage: 37, amount: 1850000 }
    ],
    attachments: 1,
    attachedFiles: [
      { id: '3', name: 'hoa_don.pdf', size: 800000, type: 'application/pdf', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Mua văn phòng phẩm'
  },
  {
    id: '3',
    transactionCode: 'V0125_01',
    transactionDate: '17/01/2025',
    transactionType: 'loan',
    category: 'Tạm ứng nhân viên',
    project: 'PRJ-2024-002',
    objectType: 'employee',
    objectName: 'Nguyễn Văn An',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Software',
    amount: 10000000,
    costAllocation: 'direct',
    attachments: 0,
    attachedFiles: [],
    paymentStatus: 'unpaid',
    approvalStatus: 'pending',
    description: 'Tạm ứng công tác phí'
  },
  {
    id: '4',
    transactionCode: 'T0125_02',
    transactionDate: '18/01/2025',
    transactionType: 'income',
    category: 'Doanh thu đào tạo',
    objectType: 'partner',
    objectName: 'Tập đoàn DEF',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Academy',
    amount: 30000000,
    costAllocation: 'direct',
    attachments: 3,
    attachedFiles: [
      { id: '4', name: 'contract_signed.pdf', size: 1500000, type: 'application/pdf', url: '#' },
      { id: '5', name: 'invoice_001.pdf', size: 900000, type: 'application/pdf', url: '#' },
      { id: '6', name: 'payment_proof.jpg', size: 600000, type: 'image/jpeg', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Khóa đào tạo doanh nghiệp'
  },
  {
    id: '5',
    transactionCode: 'C0125_02',
    transactionDate: '19/01/2025',
    transactionType: 'expense',
    category: 'Lương, thưởng, phụ cấp',
    objectType: 'employee',
    objectName: 'Toàn bộ nhân viên',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Software',
    amount: 120000000,
    costAllocation: 'direct',
    attachments: 1,
    attachedFiles: [
      { id: '7', name: 'bang_luong_01_2025.xlsx', size: 256000, type: 'application/vnd.ms-excel', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Lương tháng 01/2025'
  },
  {
    id: '6',
    transactionCode: 'C0125_03',
    transactionDate: '20/01/2025',
    transactionType: 'expense',
    category: 'Chi phí marketing',
    project: 'PRJ-2024-003',
    objectType: 'partner',
    objectName: 'Agency GHI',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Services',
    amount: 25000000,
    costAllocation: 'direct',
    attachments: 2,
    attachedFiles: [
      { id: '8', name: 'proposal.pdf', size: 2048000, type: 'application/pdf', url: '#' },
      { id: '9', name: 'invoice.pdf', size: 512000, type: 'application/pdf', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Chiến dịch marketing Q1'
  },
  {
    id: '7',
    transactionCode: 'T0226_01',
    transactionDate: '05/02/2026',
    transactionType: 'income',
    category: 'Doanh thu dự án',
    project: 'PRJ-2026-001',
    objectType: 'partner',
    objectName: 'Corporation XYZ',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Software',
    amount: 80000000,
    costAllocation: 'direct',
    attachments: 1,
    attachedFiles: [
      { id: '10', name: 'milestone_1_acceptance.pdf', size: 1800000, type: 'application/pdf', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Project A - Milestone 1'
  },
  {
    id: '8',
    transactionCode: 'C0226_01',
    transactionDate: '10/02/2026',
    transactionType: 'expense',
    category: 'Chi phí khác',
    objectType: 'partner',
    objectName: 'Nhà cung cấp MNO',
    paymentMethod: 'Tiền mặt',
    businessUnit: 'BlueBolt R&D',
    amount: 8000000,
    costAllocation: 'indirect',
    allocationRule: 'Theo số lượng nhân sự',
    allocationPreview: [
      { bu: 'BlueBolt Software', percentage: 35, amount: 2800000 },
      { bu: 'BlueBolt R&D', percentage: 25, amount: 2000000 },
      { bu: 'BlueBolt Services', percentage: 20, amount: 1600000 },
      { bu: 'BlueBolt Academy', percentage: 15, amount: 1200000 },
      { bu: 'BlueBolt G&A', percentage: 5, amount: 400000 }
    ],
    attachments: 0,
    attachedFiles: [],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Chi phí hỗ trợ'
  },
  {
    id: '9',
    transactionCode: 'T0326_01',
    transactionDate: '12/03/2026',
    transactionType: 'income',
    category: 'Doanh thu bảo hành',
    objectType: 'partner',
    objectName: 'Client PQR',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Software',
    amount: 30000000,
    costAllocation: 'direct',
    attachments: 1,
    attachedFiles: [
      { id: '11', name: 'support_package.pdf', size: 680000, type: 'application/pdf', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Support Package'
  },
  {
    id: '10',
    transactionCode: 'C0326_01',
    transactionDate: '15/03/2026',
    transactionType: 'expense',
    category: 'Lương, thưởng, phụ cấp',
    objectType: 'employee',
    objectName: 'Toàn bộ nhân viên',
    paymentMethod: 'Chuyển khoản',
    businessUnit: 'BlueBolt Academy',
    amount: 45000000,
    costAllocation: 'direct',
    attachments: 1,
    attachedFiles: [
      { id: '12', name: 'bang_luong_03_2026.xlsx', size: 280000, type: 'application/vnd.ms-excel', url: '#' }
    ],
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    description: 'Lương tháng 03/2026'
  }
];

// ===== PROVIDER =====
interface TransactionProviderProps {
  children: ReactNode;
}

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Add transaction
  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  }, []);

  // Update transaction
  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(txn => txn.id === id ? { ...txn, ...updates } : txn)
    );
  }, []);

  // Delete transaction
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(txn => txn.id !== id));
  }, []);

  // Get transaction by ID
  const getTransactionById = useCallback((id: string) => {
    return transactions.find(txn => txn.id === id);
  }, [transactions]);

  // Get transactions by BU (with option to include indirect allocations)
  const getTransactionsByBU = useCallback((buId: string, includeIndirect: boolean = false) => {
    return transactions.filter(txn => {
      // Direct allocation
      if (txn.businessUnit === buId) {
        return true;
      }
      
      // Indirect allocation
      if (includeIndirect && txn.costAllocation === 'indirect' && txn.allocationPreview) {
        return txn.allocationPreview.some(alloc => alloc.bu === buId);
      }
      
      return false;
    });
  }, [transactions]);

  // Get only approved transactions
  const getApprovedTransactions = useCallback(() => {
    return transactions.filter(txn => txn.approvalStatus === 'approved');
  }, [transactions]);

  // Refresh transactions (for future API integration)
  const refreshTransactions = useCallback(() => {
    // In production, this would fetch from API
    console.log('Refreshing transactions...');
  }, []);

  const value: TransactionContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionsByBU,
    getApprovedTransactions,
    refreshTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

// ===== CUSTOM HOOK =====
export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
