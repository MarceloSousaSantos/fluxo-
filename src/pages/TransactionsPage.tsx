import React, { useState, useEffect } from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import { financialService } from '../services';
import { Transaction, TransactionType } from '../services/types';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Search, Filter, Trash2, Edit2, X, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

export function TransactionsPage() {
  const { cycle, transactions, refresh, couple, loading: dataLoading } = useFinancialData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(false);

  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('1');

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (couple && !payerId) {
      setPayerId(couple.partner1.id);
    }
  }, [couple, payerId]);

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('');
    setDescription('');
    setPayerId(couple?.partner1.id || '');
    setIsRecurring(false);
    setIsInstallment(false);
    setTotalInstallments('1');
    setEditingTransaction(null);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setType(t.type);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setDescription(t.description);
    setPayerId(t.payerId);
    setIsRecurring(t.isRecurring);
    setIsInstallment(t.isInstallment);
    setTotalInstallments(t.totalInstallments?.toString() || '1');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta transação?')) return;
    setLoading(true);
    try {
      await financialService.deleteTransaction(id);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle) return;
    setLoading(true);

    const data = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      payerId,
      date: new Date().toISOString(),
      isRecurring,
      isInstallment,
      totalInstallments: isInstallment ? parseInt(totalInstallments) : undefined,
      currentInstallment: isInstallment ? 1 : undefined,
      cycleId: cycle.id
    };

    try {
      if (editingTransaction) {
        await financialService.updateTransaction({ ...data, id: editingTransaction.id });
      } else {
        await financialService.createTransaction(data);
      }
      setIsModalOpen(false);
      resetForm();
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-white">Transações</h2>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-10 h-10 rounded-xl bg-emerald-500 text-emerald-950 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-2 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
              filter === f
                ? "bg-white text-zinc-950 border-white"
                : "bg-zinc-900 text-zinc-500 border-white/5"
            )}
          >
            {f === 'all' ? 'Tudo' : f === 'income' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {dataLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-2xl animate-pulse" />)
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-zinc-500">Nenhuma transação encontrada</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5",
                  t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{t.description}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mt-0.5">
                    {t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold tracking-tight",
                    t.type === 'income' ? "text-emerald-400" : "text-zinc-100"
                  )}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </p>
                  {t.isInstallment && (
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                      Parc. {t.currentInstallment}/{t.totalInstallments}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(t)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border-t border-white/10 sm:border border-white/5"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex p-1 bg-zinc-950 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      type === 'expense' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500"
                    )}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      type === 'income' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500"
                    )}
                  >
                    Entrada
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Descrição</label>
                    <input
                      type="text"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ex: Mercado, Aluguel..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Categoria</label>
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                      >
                        <option value="">Selecionar</option>
                        {couple?.settings?.categories?.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Quem pagou?</label>
                      <select
                        required
                        value={payerId}
                        onChange={(e) => setPayerId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                      >
                        <option value={couple?.partner1.id}>{couple?.partner1.name}</option>
                        {couple?.partner2 && (
                          <option value={couple?.partner2?.id}>{couple?.partner2?.name}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        isRecurring ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 group-hover:border-zinc-500"
                      )}>
                        {isRecurring && <Plus size={14} className="text-emerald-950" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recorrente</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        isInstallment ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 group-hover:border-zinc-500"
                      )}>
                        {isInstallment && <Plus size={14} className="text-emerald-950" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={isInstallment} onChange={() => setIsInstallment(!isInstallment)} />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Parcelado</span>
                    </label>
                  </div>

                  {isInstallment && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Total de Parcelas</label>
                      <input
                        type="number"
                        min="2"
                        required
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (editingTransaction ? 'Salvar Alterações' : 'Confirmar Transação')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
