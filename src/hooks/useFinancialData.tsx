import { useState, useEffect, useCallback } from 'react';
import { Transaction, FinancialCycle, FinancialSummary, Couple } from '../services/types';
import { financialService } from '../services';

const EMPTY_SUMMARY: FinancialSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  balance: 0,
  consumptionPercentage: 0,
  partner1Paid: 0,
  partner2Paid: 0,
  difference: 0,
  categoryDistribution: [],
};

export function useFinancialData() {
  const [cycle, setCycle] = useState<FinancialCycle | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>(EMPTY_SUMMARY);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Safety timeout — never stay stuck on loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Tempo limite atingido. Verifique sua conexão e tente novamente.');
    }, 8000);

    try {
      const currentCouple = await financialService.getCouple();
      setCouple(currentCouple);

      const currentCycle = await financialService.getCurrentCycle();
      setCycle(currentCycle);

      const [currentTransactions, currentSummary] = await Promise.all([
        financialService.getTransactions(currentCycle.id),
        financialService.getFinancialSummary(currentCycle.id)
      ]);

      setTransactions(currentTransactions);
      setSummary(currentSummary);
    } catch (err: any) {
      console.error('Failed to fetch financial data', err);
      setError(err?.message || 'Erro ao carregar dados');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    cycle,
    transactions,
    summary,
    couple,
    loading,
    error,
    refresh: fetchData
  };
}
