// Hook financeiro: busca dados do resumo, casal, carregamento e erros
import { useFinancialData } from '../hooks/useFinancialData';

// Utilitário de formatação de moeda (R$ X.XXX,XX)
import { formatCurrency } from '../lib/utils';

// Biblioteca de gráficos: PieChart para o gráfico de pizza de categorias
// Pie: fatias do gráfico | Cell: cor de cada fatia
// ResponsiveContainer: faz o gráfico se adaptar ao tamanho da tela
// Tooltip: balão informativo ao passar o mouse/dedo sobre uma fatia
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Animações de entrada do Framer Motion
import { motion } from 'motion/react';

// Ícones da interface
// ArrowDownRight: seta diagonal para o card "vs. mês anterior"
// Users: ícone do card de divisão entre parceiros
// TrendingUp: ícone de tendência positiva
import { ArrowDownRight, Users, TrendingUp } from 'lucide-react';

// Componente da tela de Resumo do ciclo atual
// Exibe: divisão de gastos por parceiro, gráfico de categorias e comparativos
export function SummaryPage() {
  // Desestrutura os dados necessários do hook financeiro
  const { summary, couple, loading, error, refresh } = useFinancialData();

  // Estado de carregamento: exibe esqueleto animado enquanto os dados chegam do banco
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-zinc-900 rounded-3xl" /> {/* Placeholder do card de divisão */}
        <div className="h-48 bg-zinc-900 rounded-3xl" /> {/* Placeholder do gráfico */}
      </div>
    );
  }

  // Exibe mensagem de erro com botão de tentar novamente
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

  // Paleta de cores para as fatias do gráfico de pizza (cicla se houver mais categorias que cores)
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Calcula o percentual que cada parceiro pagou do total de despesas
  // Evita divisão por zero com: totalExpenses > 0 ? ... : 0
  const partner1Percent = summary.totalExpenses > 0 ? (summary.partner1Paid / summary.totalExpenses) * 100 : 0;
  const partner2Percent = summary.totalExpenses > 0 ? (summary.partner2Paid / summary.totalExpenses) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Cabeçalho da página */}
      <div className="px-2">
        <h2 className="text-2xl font-bold text-white">Resumo do Ciclo</h2>
        <p className="text-zinc-500 text-sm">Visão detalhada dos gastos do casal</p>
      </div>

      {/* ── Card de Divisão de Gastos ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} // Começa levemente menor
        animate={{ opacity: 1, scale: 1 }}    // Expande para tamanho normal
        className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
      >
        {/* Cabeçalho do card */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Divisão de Gastos</h3>
        </div>

        <div className="space-y-8">
          {/* ── Barra do Parceiro 1 ── */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                {/* Nome do parceiro 1 em letras maiúsculas */}
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{couple.partner1.name}</p>
                {/* Valor total pago pelo parceiro 1 */}
                <p className="text-xl font-bold text-white">{formatCurrency(summary.partner1Paid)}</p>
              </div>
              {/* Percentual arredondado */}
              <p className="text-xs font-bold text-zinc-400">{Math.round(partner1Percent)}%</p>
            </div>
            {/* Trilha cinza escuro da barra de progresso */}
            <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
              {/* Barra verde animada: cresce do 0% até o percentual real */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${partner1Percent}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          {/* ── Barra do Parceiro 2 (só aparece se o casal tiver 2 parceiros) ── */}
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
                {/* Barra azul para o parceiro 2 */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${partner2Percent}%` }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
          )}

          {/* ── Diferença entre o que cada parceiro pagou ── */}
          {/* Mostra quanto um deve ao outro para equilibrar os gastos */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-zinc-400 font-medium">Diferença</p>
            <p className="text-lg font-bold text-amber-400">{formatCurrency(summary.difference)}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Card Gráfico de Pizza por Categoria ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // Começa 20px abaixo e invisível
        animate={{ opacity: 1, y: 0 }}  // Sobe para a posição correta
        className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
      >
        {/* Cabeçalho do card */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Por Categoria</h3>
        </div>

        {/* Se não há despesas, exibe mensagem. Senão, exibe o gráfico */}
        {summary.categoryDistribution.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">Nenhuma despesa registrada ainda</p>
        ) : (
          <>
            {/* Container do gráfico com altura fixa e largura responsiva */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={summary.categoryDistribution} // Dados: [{name, value}, ...]
                    cx="50%"          // Centro horizontal do gráfico
                    cy="50%"          // Centro vertical do gráfico
                    innerRadius={60}  // Raio interno (faz o donut hole)
                    outerRadius={80}  // Raio externo
                    paddingAngle={5}  // Espaço entre as fatias
                    dataKey="value"   // Campo usado para calcular o tamanho de cada fatia
                  >
                    {/* Renderiza uma Cell (fatia colorida) para cada categoria */}
                    {summary.categoryDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]} // Cicla as cores
                        stroke="none"  // Sem borda entre fatias
                      />
                    ))}
                  </Pie>

                  {/* Tooltip: aparece ao tocar/hover numa fatia */}
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)} // Formata o valor como R$
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda das categorias: grid de 2 colunas com bolinha colorida + nome */}
            <div className="grid grid-cols-2 gap-y-4 mt-4">
              {summary.categoryDistribution.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2">
                  {/* Bolinha com a cor correspondente à fatia no gráfico */}
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {/* Nome da categoria (truncado se muito longo) */}
                  <span className="text-xs text-zinc-400 font-medium truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Cards comparativos (vs. mês anterior e status geral) ── */}
      <div className="grid grid-cols-2 gap-4 px-2 pb-8">
        {/* Card "vs. Mês Anterior" */}
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vs. Mês Anterior</p>
          <div className="flex items-center gap-1 text-emerald-400">
            <ArrowDownRight size={16} /> {/* Seta diagonal = tendência de queda nos gastos */}
            <span className="text-lg font-bold">-12%</span>
          </div>
          <p className="text-[10px] text-zinc-600">Economia real</p>
        </div>

        {/* Card "Status Geral" */}
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Status Geral</p>
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp size={16} /> {/* Seta de tendência positiva */}
            <span className="text-lg font-bold">Saudável</span>
          </div>
          <p className="text-[10px] text-zinc-600">Dentro da meta</p>
        </div>
      </div>
    </div>
  );
}
