// Importa os ícones usados no Dashboard
// Plus: botão flutuante de nova transação
// ArrowUpCircle/ArrowDownCircle: ícones de entrada e saída
// Calendar: exibe informações do ciclo atual
// ChevronRight: seta "Ver Tudo" na lista de transações
import { Plus, ArrowUpCircle, ArrowDownCircle, Calendar, ChevronRight } from 'lucide-react';

// Hook que busca todos os dados financeiros do banco (ciclo, transações, resumo, casal)
import { useFinancialData } from '../hooks/useFinancialData';

// Funções utilitárias: formatCurrency formata valores em R$, cn combina classes CSS
import { formatCurrency, cn } from '../lib/utils';

// motion: componente animado da biblioteca Framer Motion (animações de entrada/saída)
import { motion } from 'motion/react';

// Link: componente de navegação sem recarregar a página
import { Link } from 'react-router-dom';

// Componente da tela inicial (Dashboard) do aplicativo
// Exibe: saldo atual, renda vs gastos, barra de consumo, transações recentes e botão FAB
export function DashboardPage() {
  // Desestrutura os dados e estados retornados pelo hook financeiro
  const { cycle, transactions, summary, loading, error, refresh } = useFinancialData();

  // Enquanto os dados estão sendo carregados do banco, exibe um esqueleto animado
  // animate-pulse: pisca suavemente indicando carregamento
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-zinc-900 rounded-3xl" />  {/* Placeholder do card de saldo */}
        <div className="h-24 bg-zinc-900 rounded-2xl" />  {/* Placeholder das informações do ciclo */}
        <div className="space-y-3">
          {/* 3 placeholders de linhas de transação */}
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Se houve erro ou não há ciclo ativo, exibe mensagem de erro com botão para tentar novamente
  if (error || !cycle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-zinc-500 text-sm">{error || 'Não foi possível carregar os dados.'}</p>
        <button onClick={refresh} className="px-6 py-2 bg-emerald-500 text-emerald-950 rounded-xl font-bold text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  // Define a cor do saldo baseada na situação financeira:
  // vermelho = saldo negativo | âmbar = mais de 80% gasto | verde = saudável
  const statusColor = summary.balance < 0
    ? 'text-red-400'
    : summary.consumptionPercentage > 80
      ? 'text-amber-400'
      : 'text-emerald-400';

  // Define a cor da barra de progresso de consumo (mesma lógica do saldo)
  const progressColor = summary.balance < 0
    ? 'bg-red-500'
    : summary.consumptionPercentage > 80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  // Calcula quantos dias faltam para o fim do ciclo atual
  // Math.max(0,...) garante que nunca retorna número negativo (caso o ciclo tenha passado)
  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(cycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="space-y-8">

      {/* ── Card principal: Saldo disponível ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}   // Começa invisível e 20px abaixo
        animate={{ opacity: 1, y: 0 }}    // Anima para visível na posição original
        className="bg-zinc-900 border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Blur decorativo no canto superior direito */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

        {/* Saldo disponível */}
        <div className="space-y-1 relative z-10"> {/* z-10: fica na frente do blur decorativo */}
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Saldo Disponível</p>
          {/* Cor do saldo muda de acordo com statusColor calculado acima */}
          <h2 className={cn("text-4xl font-bold tracking-tighter", statusColor)}>
            {formatCurrency(summary.balance)}
          </h2>
        </div>

        {/* Grid 2 colunas: Renda e Gastos lado a lado */}
        <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
          {/* Coluna Renda (total de entradas) */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ArrowUpCircle size={14} className="text-emerald-500" /> {/* Seta verde para cima */}
              <span className="text-xs font-medium uppercase tracking-wider">Renda</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(summary.totalIncome)}</p>
          </div>

          {/* Coluna Gastos (total de despesas) */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ArrowDownCircle size={14} className="text-red-500" /> {/* Seta vermelha para baixo */}
              <span className="text-xs font-medium uppercase tracking-wider">Gastos</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>

        {/* Barra de progresso do consumo do orçamento */}
        <div className="mt-8 space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
            <span className="text-zinc-500">Consumo do Orçamento</span>
            {/* Percentual colorido conforme o statusColor */}
            <span className={statusColor}>{Math.round(summary.consumptionPercentage)}%</span>
          </div>
          {/* Trilha cinza da barra */}
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            {/* Barra animada: começa em 0% e anima até o percentual real */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, summary.consumptionPercentage)}%` }} // Máximo 100%
              className={cn("h-full transition-all duration-1000", progressColor)}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Informações do ciclo atual ── */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          {/* Ícone de calendário */}
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 border border-white/5">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Ciclo Atual</p>
            {/* Formata a data de início no formato "fevereiro de 2024" */}
            <p className="text-sm font-semibold text-white">
              {new Date(cycle.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Dias restantes no ciclo atual */}
        <div className="text-right">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Restam</p>
          <p className="text-sm font-bold text-emerald-400">{daysRemaining} dias</p>
        </div>
      </div>

      {/* ── Lista das últimas transações ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-white">Últimas Transações</h3>
          {/* Link para ver todas as transações */}
          <Link to="/transacoes" className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            Ver Tudo <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {/* Mostra no máximo 5 transações, com animação escalonada */}
          {transactions.slice(0, 5).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}          // Começa invisível e 20px à esquerda
              animate={{ opacity: 1, x: 0 }}            // Anima para visível na posição
              transition={{ delay: idx * 0.1 }}         // Cada item aparece 0.1s depois do anterior
              className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-4">
                {/* Ícone colorido: verde para entrada, vermelho para saída */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border border-white/5",
                  t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  {t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.description}</p>
                  {/* Categoria e data separadas por "•" */}
                  <p className="text-xs text-zinc-500">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Valor: positivo em verde para entrada, neutro para saída */}
              <p className={cn(
                "font-bold tracking-tight",
                t.type === 'income' ? "text-emerald-400" : "text-zinc-100"
              )}>
                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Botão Flutuante (FAB) — abre a tela de nova transação ── */}
      {/* Link navega para /transacoes com ?new=true que dispara o modal automaticamente */}
      <Link to="/transacoes?new=true" className="fab-animated">
        <span className="fab-inner">
          <Plus size={26} strokeWidth={2.5} /> {/* Ícone de "+" */}
        </span>
      </Link>
    </div>
  );
}
