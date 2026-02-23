// ═══════════════════════════════════════════════════════════
// TIPOS (INTERFACES) — Define a "forma" de cada objeto de dado
// que trafega pela aplicação. TypeScript usa isso para garantir
// que nenhum campo fique faltando ou seja do tipo errado.
// ═══════════════════════════════════════════════════════════

// Representa um usuário do aplicativo
export interface User {
  id: string;      // ID único gerado pelo Supabase Auth
  name: string;    // Nome de exibição do usuário
  email: string;   // E-mail usado para login
  avatar?: string; // URL da foto de perfil (opcional — o "?" indica isso)
}

// Representa um casal cadastrado no sistema
export interface Couple {
  id: string;          // ID único do casal no banco
  partner1: User;      // Dados do primeiro parceiro (quem criou o casal)
  partner2?: User;     // Dados do segundo parceiro (opcional — entra pelo código de convite)
  inviteCode: string;  // Código de 6 letras que o parceiro usa para entrar no casal
  settings: {          // Configurações personalizadas do casal
    payday: number;                          // Dia do mês em que recebem o salário (ex: 10)
    divisionMode: '50/50' | 'proportional'; // Como dividem as despesas: meio a meio ou proporcional
    categories: string[];                   // Lista de categorias de gastos (ex: ['Mercado', 'Aluguel'])
  };
}

// Tipo que representa se uma transação é entrada ou saída
// 'income' = entrada (salário, freelance)
// 'expense' = saída (conta, compra)
export type TransactionType = 'income' | 'expense';

// Representa uma transação financeira (receita ou despesa)
export interface Transaction {
  id: string;                  // ID único da transação
  type: TransactionType;       // 'income' ou 'expense'
  amount: number;              // Valor em reais (ex: 150.50)
  category: string;            // Categoria (ex: 'Alimentação', 'Transporte')
  payerId: string;             // ID do parceiro que pagou esta despesa
  date: string;                // Data da transação (formato ISO: '2024-02-15T...')
  description: string;         // Descrição livre (ex: 'Supermercado Extra')
  isRecurring: boolean;        // true = conta fixa (aparece todo mês automaticamente)
  isInstallment: boolean;      // true = compra parcelada
  totalInstallments?: number;  // Número total de parcelas (ex: 12) — só se isInstallment = true
  currentInstallment?: number; // Parcela atual (ex: 3 de 12) — só se isInstallment = true
  cycleId: string;             // ID do ciclo financeiro ao qual esta transação pertence
}

// Representa um ciclo financeiro (período de um mês)
// O ciclo começa no dia do pagamento e vai até o próximo
export interface FinancialCycle {
  id: string;                        // ID único do ciclo
  month: number;                     // Mês (1 = Janeiro, 12 = Dezembro)
  year: number;                      // Ano (ex: 2024)
  startDate: string;                 // Data de início do ciclo (ex: '2024-02-10')
  endDate: string;                   // Data de término do ciclo (ex: '2024-03-09')
  status: 'active' | 'closed';      // 'active' = mês atual, 'closed' = mês já encerrado
  totalIncome: number;               // Total de entradas do ciclo (calculado)
  totalExpenses: number;             // Total de gastos do ciclo (calculado)
}

// Representa o resumo calculado de um ciclo financeiro
// Usado no Dashboard e na tela de Resumo
export interface FinancialSummary {
  totalIncome: number;       // Soma de todas as entradas do período
  totalExpenses: number;     // Soma de todos os gastos do período
  balance: number;           // Saldo = totalIncome - totalExpenses
  consumptionPercentage: number; // % do orçamento já gasto (ex: 75 = 75% gasto)
  partner1Paid: number;      // Quanto o parceiro 1 pagou no período
  partner2Paid: number;      // Quanto o parceiro 2 pagou no período
  difference: number;        // Diferença entre o que cada um pagou (para acerto)
  categoryDistribution: {    // Lista para o gráfico de pizza
    name: string;            //   Nome da categoria (ex: 'Alimentação')
    value: number;           //   Total gasto nessa categoria
  }[];
}
