import { useFinancialData } from '../hooks/useFinancialData';
import { formatCurrency } from '../lib/utils';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { ArrowDownRight, Users, TrendingUp } from 'lucide-react';

export function SummaryPage() {
  const { summary, couple, loading, error, refresh } = useFinancialData();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-zinc-900 rounded-3xl" />
        <div className="h-48 bg-zinc-900 rounded-3xl" />
      </div>
    );
  }

  if (error || !couple) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-zinc-500 text-sm">{error || 'Não foi possível carregar os dados.'}</p>
        <button onClick={refresh} className="px-6 py-2 bg-emerald-500 text-emerald-950 rounded-xl font-bold text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const partner1Percent = summary.totalExpenses > 0 ? (summary.partner1Paid / summary.totalExpenses) * 100 : 0;
  const partner2Percent = summary.totalExpenses > 0 ? (summary.partner2Paid / summary.totalExpenses) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="px-2">
        <h2 className="text-2xl font-bold text-white">Resumo do Ciclo</h2>
        <p className="text-zinc-500 text-sm">Visão detalhada dos gastos do casal</p>
      </div>

      {/* Division Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Divisão de Gastos</h3>
        </div>

        <div className="space-y-8">
          {/* Partner 1 */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{couple.partner1.name}</p>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.partner1Paid)}</p>
              </div>
              <p className="text-xs font-bold text-zinc-400">{Math.round(partner1Percent)}%</p>
            </div>
            <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${partner1Percent}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          {/* Partner 2 — só mostra se existir */}
          {couple.partner2 && (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{couple.partner2.name}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(summary.partner2Paid)}</p>
                </div>
                <p className="text-xs font-bold text-zinc-400">{Math.round(partner2Percent)}%</p>
              </div>
              <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${partner2Percent}%` }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-zinc-400 font-medium">Diferença</p>
            <p className="text-lg font-bold text-amber-400">{formatCurrency(summary.difference)}</p>
          </div>
        </div>
      </motion.div>

      {/* Category Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Por Categoria</h3>
        </div>

        {summary.categoryDistribution.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">Nenhuma despesa registrada ainda</p>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={summary.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {summary.categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-y-4 mt-4">
              {summary.categoryDistribution.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-zinc-400 font-medium truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4 px-2 pb-8">
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vs. Mês Anterior</p>
          <div className="flex items-center gap-1 text-emerald-400">
            <ArrowDownRight size={16} />
            <span className="text-lg font-bold">-12%</span>
          </div>
          <p className="text-[10px] text-zinc-600">Economia real</p>
        </div>
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Status Geral</p>
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp size={16} />
            <span className="text-lg font-bold">Saudável</span>
          </div>
          <p className="text-[10px] text-zinc-600">Dentro da meta</p>
        </div>
      </div>
    </div>
  );
}
