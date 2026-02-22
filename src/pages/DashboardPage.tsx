import { Plus, ArrowUpCircle, ArrowDownCircle, Calendar, ChevronRight } from 'lucide-react';
import { useFinancialData } from '../hooks/useFinancialData';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { cycle, transactions, summary, loading, error, refresh } = useFinancialData();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-zinc-900 rounded-3xl" />
        <div className="h-24 bg-zinc-900 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl" />)}
        </div>
      </div>
    );
  }

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

  const statusColor = summary.balance < 0
    ? 'text-red-400'
    : summary.consumptionPercentage > 80
      ? 'text-amber-400'
      : 'text-emerald-400';

  const progressColor = summary.balance < 0
    ? 'bg-red-500'
    : summary.consumptionPercentage > 80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const daysRemaining = Math.max(0, Math.ceil((new Date(cycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-8">
      {/* Header Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

        <div className="space-y-1 relative z-10">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Saldo Disponível</p>
          <h2 className={cn("text-4xl font-bold tracking-tighter", statusColor)}>
            {formatCurrency(summary.balance)}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ArrowUpCircle size={14} className="text-emerald-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Renda</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ArrowDownCircle size={14} className="text-red-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Gastos</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>

        <div className="mt-8 space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
            <span className="text-zinc-500">Consumo do Orçamento</span>
            <span className={statusColor}>{Math.round(summary.consumptionPercentage)}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, summary.consumptionPercentage)}%` }}
              className={cn("h-full transition-all duration-1000", progressColor)}
            />
          </div>
        </div>
      </motion.div>

      {/* Cycle Info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 border border-white/5">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Ciclo Atual</p>
            <p className="text-sm font-semibold text-white">
              {new Date(cycle.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Restam</p>
          <p className="text-sm font-bold text-emerald-400">{daysRemaining} dias</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-white">Últimas Transações</h3>
          <Link to="/transacoes" className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            Ver Tudo <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {transactions.slice(0, 5).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border border-white/5",
                  t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  {t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.description}</p>
                  <p className="text-xs text-zinc-500">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
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

      {/* Floating Action Button */}
      <Link
        to="/transacoes?new=true"
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-emerald-950 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus size={32} strokeWidth={3} />
      </Link>
    </div>
  );
}
