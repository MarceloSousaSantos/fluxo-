

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Couple {
  id: string;
  partner1: User;
  partner2?: User;
  inviteCode: string;
  settings: {
    payday: number;
    divisionMode: '50/50' | 'proportional';
    categories: string[];
  };
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  payerId: string;
  date: string;
  description: string;
  isRecurring: boolean;
  isInstallment: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  cycleId: string;
}

export interface FinancialCycle {
  id: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed';
  totalIncome: number;
  totalExpenses: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  consumptionPercentage: number;
  partner1Paid: number;
  partner2Paid: number;
  difference: number;
  categoryDistribution: { name: string; value: number }[];
}
