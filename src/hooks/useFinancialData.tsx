// Importa os hooks do React necessários para este hook personalizado
import { useState, useEffect, useCallback } from 'react';

// Importa os tipos das entidades usadas nos estados
import { Transaction, FinancialCycle, FinancialSummary, Couple } from '../services/types';

// Importa o serviço que faz as chamadas ao banco de dados
import { financialService } from '../services';

// Valor inicial do resumo financeiro: todos os campos zerados
// Usado como estado inicial para evitar valores undefined
const EMPTY_SUMMARY: FinancialSummary = {
  totalIncome: 0,          // Total de entradas
  totalExpenses: 0,        // Total de despesas
  balance: 0,              // Saldo (entradas - despesas)
  consumptionPercentage: 0, // % do orçamento consumido
  partner1Paid: 0,         // Quanto o parceiro 1 pagou
  partner2Paid: 0,         // Quanto o parceiro 2 pagou
  difference: 0,           // Diferença entre o que cada um pagou
  categoryDistribution: [], // Lista de gastos por categoria (para gráfico)
};

// Hook personalizado para buscar e gerenciar todos os dados financeiros
// Usado em DashboardPage, TransactionsPage, SummaryPage, SettingsPage
export function useFinancialData() {
  // Estado do ciclo financeiro atual (mês vigente)
  const [cycle, setCycle] = useState<FinancialCycle | null>(null);

  // Estado com a lista de transações do ciclo atual
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Estado com o resumo calculado (saldo, totais, divisão por parceiro)
  const [summary, setSummary] = useState<FinancialSummary>(EMPTY_SUMMARY);

  // Estado com os dados do casal (parceiros, convite, configurações)
  const [couple, setCouple] = useState<Couple | null>(null);

  // true enquanto os dados estão sendo carregados do banco
  const [loading, setLoading] = useState(true);

  // Mensagem de erro caso algo dê errado ao buscar os dados
  const [error, setError] = useState<string | null>(null);

  // useCallback memoriza a função para evitar que ela seja recriada a cada render
  // Isso é importante porque a passamos como dependência do useEffect abaixo
  const fetchData = useCallback(async () => {
    setLoading(true); // Ativa o indicador de carregamento
    setError(null);   // Limpa erros anteriores

    // Cria um timeout de segurança: se demorar mais de 8 segundos, mostra erro
    // Evita que a tela fique travada em loading infinito se o banco falhar
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Tempo limite atingido. Verifique sua conexão e tente novamente.');
    }, 8000);

    try {
      // Busca os dados do casal no banco (parceiros, código de convite, configurações)
      const currentCouple = await financialService.getCouple();
      setCouple(currentCouple);

      // Busca o ciclo financeiro ativo (mês atual)
      const currentCycle = await financialService.getCurrentCycle();
      setCycle(currentCycle);

      // Busca transações e resumo financeiro ao mesmo tempo (em paralelo com Promise.all)
      // Isso é mais rápido do que buscar um de cada vez
      const [currentTransactions, currentSummary] = await Promise.all([
        financialService.getTransactions(currentCycle.id),     // Lista de transações do ciclo
        financialService.getFinancialSummary(currentCycle.id)  // Resumo calculado do ciclo
      ]);

      setTransactions(currentTransactions); // Salva as transações no estado
      setSummary(currentSummary);           // Salva o resumo no estado
    } catch (err: any) {
      console.error('Failed to fetch financial data', err);
      setError(err?.message || 'Erro ao carregar dados'); // Exibe mensagem de erro na tela
    } finally {
      clearTimeout(timeout); // Cancela o timeout de segurança (pois já terminou)
      setLoading(false);     // Para o indicador de carregamento
    }
  }, []); // [] = a função não muda entre renders

  // Executa fetchData automaticamente quando o componente monta (carregamento inicial)
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Re-executa se fetchData mudar (na prática, nunca muda)

  // Retorna todos os dados e funções para as páginas que usarem este hook
  return {
    cycle,           // Ciclo financeiro atual
    transactions,    // Lista de transações
    summary,         // Resumo calculado (saldo, totais, etc.)
    couple,          // Dados do casal
    loading,         // true enquanto carrega
    error,           // Mensagem de erro (se houver)
    refresh: fetchData // Função para recarregar tudo manualmente
  };
}
