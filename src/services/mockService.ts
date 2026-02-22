import { 
  User, 
  Couple, 
  FinancialCycle, 
  Transaction, 
  FinancialSummary 
} from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEYS = {
  USER: 'cfc_user',
  COUPLE: 'cfc_couple',
  CYCLES: 'cfc_cycles',
  TRANSACTIONS: 'cfc_transactions',
};

// Seed Data
const INITIAL_COUPLE: Couple = {
  id: 'couple-1',
  partner1: { id: 'u1', name: 'Pessoa A', email: 'pessoa.a@example.com' },
  partner2: { id: 'u2', name: 'Pessoa B', email: 'pessoa.b@example.com' },
  inviteCode: 'LOVE-123',
  settings: {
    payday: 5,
    divisionMode: '50/50',
    categories: ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Cartões', 'Outros'],
  }
};

const INITIAL_CYCLES: FinancialCycle[] = [
  {
    id: 'cycle-1',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    status: 'active',
    totalIncome: 0,
    totalExpenses: 0,
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'income',
    amount: 5000,
    category: 'Salário',
    payerId: 'u1',
    date: new Date().toISOString(),
    description: 'Salário Pessoa A',
    isRecurring: true,
    isInstallment: false,
    cycleId: 'cycle-1'
  },
  {
    id: 't2',
    type: 'income',
    amount: 4500,
    category: 'Salário',
    payerId: 'u2',
    date: new Date().toISOString(),
    description: 'Salário Pessoa B',
    isRecurring: true,
    isInstallment: false,
    cycleId: 'cycle-1'
  },
  {
    id: 't3',
    type: 'expense',
    amount: 1200,
    category: 'Aluguel',
    payerId: 'u1',
    date: new Date().toISOString(),
    description: 'Aluguel Mensal',
    isRecurring: true,
    isInstallment: false,
    cycleId: 'cycle-1'
  },
  {
    id: 't4',
    type: 'expense',
    amount: 250,
    category: 'Internet',
    payerId: 'u2',
    date: new Date().toISOString(),
    description: 'Vivo Fibra',
    isRecurring: true,
    isInstallment: false,
    cycleId: 'cycle-1'
  },
  {
    id: 't5',
    type: 'expense',
    amount: 150,
    category: 'Lazer',
    payerId: 'u1',
    date: new Date().toISOString(),
    description: 'Cinema',
    isRecurring: false,
    isInstallment: false,
    cycleId: 'cycle-1'
  },
  {
    id: 't6',
    type: 'expense',
    amount: 300,
    category: 'Mercado',
    payerId: 'u2',
    date: new Date().toISOString(),
    description: 'Compras semanais',
    isRecurring: false,
    isInstallment: false,
    cycleId: 'cycle-1'
  },
  {
    id: 't7',
    type: 'expense',
    amount: 200,
    category: 'Eletrônicos',
    payerId: 'u1',
    date: new Date().toISOString(),
    description: 'Fone de ouvido (1/5)',
    isRecurring: false,
    isInstallment: true,
    totalInstallments: 5,
    currentInstallment: 1,
    cycleId: 'cycle-1'
  },
  {
    id: 't8',
    type: 'expense',
    amount: 400,
    category: 'Saúde',
    payerId: 'u2',
    date: new Date().toISOString(),
    description: 'Farmácia',
    isRecurring: false,
    isInstallment: false,
    cycleId: 'cycle-1'
  }
];

export const mockService = {
  async init() {
    if (!localStorage.getItem(STORAGE_KEYS.COUPLE)) {
      localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(INITIAL_COUPLE));
      localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(INITIAL_CYCLES));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    } else {
      // Migration: Ensure categories exist in existing data
      const couple = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPLE) || '{}') as Couple;
      if (couple.settings && !couple.settings.categories) {
        couple.settings.categories = INITIAL_COUPLE.settings.categories;
        localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(couple));
      }
    }
  },

  // Auth
  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const couple = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPLE) || '{}') as Couple;
    const user = couple.partner1.email === email ? couple.partner1 : couple.partner2;
    if (!user) throw new Error('Usuário não encontrado');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  async register(name: string, email: string): Promise<User> {
    await delay(600);
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
    };
    
    // Create a new couple for this user
    const newCouple: Couple = {
      id: `c-${Date.now()}`,
      partner1: newUser,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      settings: INITIAL_COUPLE.settings
    };
    
    localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(newCouple));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return newUser;
  },

  async joinCouple(inviteCode: string): Promise<void> {
    await delay(600);
    const couple = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPLE) || '{}') as Couple;
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}') as User;
    
    if (couple.inviteCode === inviteCode) {
      couple.partner2 = currentUser;
      localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(couple));
    } else {
      throw new Error('Código de convite inválido');
    }
  },

  async logout() {
    await delay(300);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  async getCurrentUser(): Promise<User | null> {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  // Couple
  async getCouple(): Promise<Couple> {
    await delay(400);
    const couple = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPLE) || '{}') as Couple;
    // Safety check for categories
    if (couple.settings && !couple.settings.categories) {
      couple.settings.categories = INITIAL_COUPLE.settings.categories;
    }
    return couple;
  },

  async updateCouple(couple: Couple): Promise<Couple> {
    await delay(500);
    localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(couple));
    return couple;
  },

  // Cycle
  async getCurrentCycle(): Promise<FinancialCycle> {
    await delay(400);
    const cycles = JSON.parse(localStorage.getItem(STORAGE_KEYS.CYCLES) || '[]') as FinancialCycle[];
    let activeCycle = cycles.find(c => c.status === 'active');
    
    if (!activeCycle) {
      // Create new cycle if none active
      const now = new Date();
      activeCycle = await this.createNewCycle(now.getMonth() + 1, now.getFullYear());
    }

    // Check if current date is past end date
    if (new Date() > new Date(activeCycle.endDate)) {
      await this.closeCycle(activeCycle.id);
      const nextDate = new Date(activeCycle.endDate);
      nextDate.setDate(nextDate.getDate() + 1);
      activeCycle = await this.createNewCycle(nextDate.getMonth() + 1, nextDate.getFullYear());
    }

    return activeCycle;
  },

  async createNewCycle(month: number, year: number): Promise<FinancialCycle> {
    await delay(600);
    const cycles = JSON.parse(localStorage.getItem(STORAGE_KEYS.CYCLES) || '[]') as FinancialCycle[];
    
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();
    
    const newCycle: FinancialCycle = {
      id: `cycle-${Date.now()}`,
      month,
      year,
      startDate,
      endDate,
      status: 'active',
      totalIncome: 0,
      totalExpenses: 0,
    };

    // Handle recurring transactions from previous cycle
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]') as Transaction[];
    const activeCycle = cycles.find(c => c.status === 'active');
    
    if (activeCycle) {
      const recurring = transactions.filter(t => t.cycleId === activeCycle.id && (t.isRecurring || (t.isInstallment && (t.currentInstallment || 0) < (t.totalInstallments || 0))));
      
      const newTransactions = recurring.map(t => ({
        ...t,
        id: `t-${Date.now()}-${Math.random()}`,
        cycleId: newCycle.id,
        date: new Date(year, month - 1, new Date(t.date).getDate()).toISOString(),
        currentInstallment: t.isInstallment ? (t.currentInstallment || 0) + 1 : undefined
      }));
      
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...transactions, ...newTransactions]));
    }

    cycles.push(newCycle);
    localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(cycles));
    return newCycle;
  },

  async closeCycle(id: string): Promise<void> {
    await delay(500);
    const cycles = JSON.parse(localStorage.getItem(STORAGE_KEYS.CYCLES) || '[]') as FinancialCycle[];
    const index = cycles.findIndex(c => c.id === id);
    if (index !== -1) {
      cycles[index].status = 'closed';
      localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(cycles));
    }
  },

  // Transactions
  async getTransactions(cycleId: string): Promise<Transaction[]> {
    await delay(400);
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]') as Transaction[];
    return transactions.filter(t => t.cycleId === cycleId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    await delay(500);
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]') as Transaction[];
    const newTransaction = { ...transaction, id: `t-${Date.now()}` };
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  },

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    await delay(500);
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]') as Transaction[];
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      transactions[index] = transaction;
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
    return transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await delay(400);
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]') as Transaction[];
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
  },

  // Summary
  async getFinancialSummary(cycleId: string): Promise<FinancialSummary> {
    await delay(600);
    const transactions = await this.getTransactions(cycleId);
    const couple = await this.getCouple();

    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const partner1Paid = transactions.filter(t => t.type === 'expense' && t.payerId === couple.partner1.id).reduce((acc, t) => acc + t.amount, 0);
    const partner2Paid = transactions.filter(t => t.type === 'expense' && t.payerId === couple.partner2.id).reduce((acc, t) => acc + t.amount, 0);

    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const categoryDistribution = Object.entries(categories).map(([name, value]) => ({ name, value }));

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      consumptionPercentage: income > 0 ? (expenses / income) * 100 : 0,
      partner1Paid,
      partner2Paid,
      difference: Math.abs(partner1Paid - partner2Paid),
      categoryDistribution
    };
  },

  async resetData() {
    localStorage.clear();
    await this.init();
  }
};
