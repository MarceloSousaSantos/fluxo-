import { supabase } from '../lib/supabase';
import {
  User,
  Couple,
  FinancialCycle,
  Transaction,
  FinancialSummary
} from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getMyCouple(): Promise<{ coupleId: string; role: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('couple_members')
    .select('couple_id, role')
    .eq('user_id', user.id)
    .limit(1);

  if (!data || data.length === 0) return null;
  return { coupleId: data[0].couple_id, role: data[0].role };
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function buildUserFromProfile(userId: string): Promise<User> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, avatar')
    .eq('id', userId)
    .maybeSingle();

  if (!data) throw new Error('Profile not found');
  return { id: data.id, name: data.name, email: data.email, avatar: data.avatar };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const supabaseService = {
  async init() {
    // No initialization needed for Supabase — session is restored automatically
  },

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');
    return buildUserFromProfile(data.user.id);
  },

  async register(name: string, email: string, password?: string): Promise<User> {
    const pwd = password || Math.random().toString(36) + 'A1!';

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: { data: { name } },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');
    if (!data.session) throw new Error('Email confirmation required — check your inbox.');

    // Call RPC to create couple (runs with SECURITY DEFINER, bypasses RLS timing issue)
    const { error: rpcError } = await supabase.rpc('finish_registration', { user_name: name });
    if (rpcError) throw new Error(rpcError.message);

    return buildUserFromProfile(data.user.id);
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    try {
      return await buildUserFromProfile(user.id);
    } catch {
      return null;
    }
  },

  // ── Couple ────────────────────────────────────────────────────────────────

  async getCouple(): Promise<Couple> {
    const mine = await getMyCouple();
    if (!mine) throw new Error('No couple found');

    const { data: couple, error } = await supabase
      .from('couples')
      .select('*')
      .eq('id', mine.coupleId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!couple) throw new Error('Couple not found');

    // Get members
    const { data: members } = await supabase
      .from('couple_members')
      .select('user_id, role')
      .eq('couple_id', mine.coupleId);

    const partner1Member = members?.find(m => m.role === 'partner1');
    const partner2Member = members?.find(m => m.role === 'partner2');

    const partner1 = partner1Member ? await buildUserFromProfile(partner1Member.user_id) : { id: '', name: 'Parceiro 1', email: '' };
    const partner2 = partner2Member ? await buildUserFromProfile(partner2Member.user_id) : undefined;

    return {
      id: couple.id,
      partner1,
      partner2,
      inviteCode: couple.invite_code,
      settings: {
        payday: couple.payday,
        divisionMode: couple.division_mode as '50/50' | 'proportional',
        categories: couple.categories as string[],
      },
    };
  },

  async updateCouple(couple: Couple): Promise<Couple> {
    const { error } = await supabase
      .from('couples')
      .update({
        invite_code: couple.inviteCode,
        payday: couple.settings.payday,
        division_mode: couple.settings.divisionMode,
        categories: couple.settings.categories,
      })
      .eq('id', couple.id);

    if (error) throw new Error(error.message);
    return couple;
  },

  async joinCouple(inviteCode: string): Promise<void> {
    // Use SECURITY DEFINER RPC to bypass RLS (which only allows users to see their own couple,
    // making it impossible to look up another couple by invite_code directly)
    const { data, error } = await supabase
      .rpc('join_couple_by_invite', { p_invite_code: inviteCode.trim().toUpperCase() });

    if (error) throw new Error(error.message);

    // RPC with RETURNS TABLE gives back an array; handle both array and single object
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error('Código de convite inválido');
    if (result.out_error_msg) throw new Error(result.out_error_msg);
    if (!result.out_couple_id) throw new Error('Código de convite inválido');
  },

  // ── Financial Cycles ───────────────────────────────────────────────────────

  async getCurrentCycle(): Promise<FinancialCycle> {
    const mine = await getMyCouple();
    if (!mine) throw new Error('No couple found');

    const { data: activeRows, error } = await supabase
      .from('financial_cycles')
      .select('*')
      .eq('couple_id', mine.coupleId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);

    const active = activeRows?.[0] ?? null;

    if (active) {
      // Check if expired
      if (new Date() > new Date(active.end_date)) {
        await this.closeCycle(active.id);
        const nextDate = new Date(active.end_date);
        nextDate.setDate(nextDate.getDate() + 1);
        return this.createNewCycle(nextDate.getMonth() + 1, nextDate.getFullYear());
      }
      return this._mapCycle(active);
    }

    // No active cycle → create one for current month
    const now = new Date();
    return this.createNewCycle(now.getMonth() + 1, now.getFullYear());
  },

  async createNewCycle(month: number, year: number): Promise<FinancialCycle> {
    const mine = await getMyCouple();
    if (!mine) throw new Error('No couple found');

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: insertedCycles, error } = await supabase
      .from('financial_cycles')
      .insert({
        couple_id: mine.coupleId,
        month,
        year,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
      })
      .select();

    if (error) {
      // Unique constraint violation: another cycle was already created concurrently
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('financial_cycles')
          .select('*')
          .eq('couple_id', mine.coupleId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);
        if (existing?.[0]) return this._mapCycle(existing[0]);
      }
      throw new Error(error.message);
    }
    const data = insertedCycles?.[0];
    if (!data) throw new Error('Failed to create cycle');

    // Copy recurring transactions from previous cycle
    const { data: prevCycles } = await supabase
      .from('financial_cycles')
      .select('id')
      .eq('couple_id', mine.coupleId)
      .eq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(1);
    const prevCycle = prevCycles?.[0] ?? null;

    if (prevCycle) {
      const { data: recurring } = await supabase
        .from('transactions')
        .select('*')
        .eq('cycle_id', prevCycle.id)
        .or('is_recurring.eq.true,is_installment.eq.true');

      if (recurring && recurring.length > 0) {
        const newTransactions = recurring
          .filter(t => t.is_recurring || (t.is_installment && (t.current_installment || 0) < (t.total_installments || 0)))
          .map(t => ({
            cycle_id: data.id,
            couple_id: mine.coupleId,
            type: t.type,
            amount: t.amount,
            category: t.category,
            payer_id: t.payer_id,
            date: new Date(year, month - 1, new Date(t.date).getDate()).toISOString(),
            description: t.description,
            is_recurring: t.is_recurring,
            is_installment: t.is_installment,
            total_installments: t.total_installments,
            current_installment: t.is_installment ? (t.current_installment || 0) + 1 : null,
          }));

        if (newTransactions.length > 0) {
          await supabase.from('transactions').insert(newTransactions);
        }
      }
    }

    return this._mapCycle(data);
  },

  async closeCycle(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_cycles')
      .update({ status: 'closed' })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  _mapCycle(row: Record<string, unknown>): FinancialCycle {
    return {
      id: row.id as string,
      month: row.month as number,
      year: row.year as number,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      status: row.status as 'active' | 'closed',
      totalIncome: 0,
      totalExpenses: 0,
    };
  },

  // ── Transactions ──────────────────────────────────────────────────────────

  async getTransactions(cycleId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(this._mapTransaction);
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const mine = await getMyCouple();
    if (!mine) throw new Error('No couple found');

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert({
        cycle_id: transaction.cycleId,
        couple_id: mine.coupleId,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        payer_id: transaction.payerId,
        date: transaction.date,
        description: transaction.description,
        is_recurring: transaction.isRecurring,
        is_installment: transaction.isInstallment,
        total_installments: transaction.totalInstallments,
        current_installment: transaction.currentInstallment,
      })
      .select();

    if (error) throw new Error(error.message);
    if (!inserted?.[0]) throw new Error('Failed to create transaction');
    return this._mapTransaction(inserted[0]);
  },

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    const { data: updated, error } = await supabase
      .from('transactions')
      .update({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        payer_id: transaction.payerId,
        date: transaction.date,
        description: transaction.description,
        is_recurring: transaction.isRecurring,
        is_installment: transaction.isInstallment,
        total_installments: transaction.totalInstallments,
        current_installment: transaction.currentInstallment,
      })
      .eq('id', transaction.id)
      .select();

    if (error) throw new Error(error.message);
    if (!updated?.[0]) throw new Error('Failed to update transaction');
    return this._mapTransaction(updated[0]);
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  _mapTransaction(row: Record<string, unknown>): Transaction {
    return {
      id: row.id as string,
      type: row.type as 'income' | 'expense',
      amount: Number(row.amount),
      category: row.category as string,
      payerId: row.payer_id as string,
      date: row.date as string,
      description: row.description as string,
      isRecurring: row.is_recurring as boolean,
      isInstallment: row.is_installment as boolean,
      totalInstallments: row.total_installments as number | undefined,
      currentInstallment: row.current_installment as number | undefined,
      cycleId: row.cycle_id as string,
    };
  },

  // ── Summary ───────────────────────────────────────────────────────────────

  async getFinancialSummary(cycleId: string): Promise<FinancialSummary> {
    const transactions = await this.getTransactions(cycleId);
    const couple = await this.getCouple();

    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const partner1Paid = transactions.filter(t => t.type === 'expense' && t.payerId === couple.partner1.id).reduce((acc, t) => acc + t.amount, 0);
    const partner2Paid = couple.partner2
      ? transactions.filter(t => t.type === 'expense' && t.payerId === couple.partner2!.id).reduce((acc, t) => acc + t.amount, 0)
      : 0;

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
      categoryDistribution,
    };
  },

  async resetData() {
    const mine = await getMyCouple();
    if (!mine) return;

    // Delete all transactions and cycles for this couple
    await supabase.from('transactions').delete().eq('couple_id', mine.coupleId);
    await supabase.from('financial_cycles').delete().eq('couple_id', mine.coupleId);
  },
};
