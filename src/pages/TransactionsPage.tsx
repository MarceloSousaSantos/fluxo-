// Importa React e hooks necessários
import React, { useState, useEffect } from 'react';

// Hook financeiro: fornece ciclo, transações, casal e função de atualização
import { useFinancialData } from '../hooks/useFinancialData';

// Serviço de operações financeiras: criar, editar, excluir transações
import { financialService } from '../services';

// Tipos TypeScript das entidades de domínio
import { Transaction, TransactionType } from '../services/types';

// Utilitários de formatação e classes CSS
import { formatCurrency, cn } from '../lib/utils';

// Ícones da interface
// Plus: botão de adicionar | Search/Filter: busca e filtros (reservados para uso futuro)
// Trash2: excluir | Edit2: editar | X: fechar modal
// ArrowUpCircle/ArrowDownCircle: ícones de tipo de transação
// Loader2: spinner de carregamento
import { Plus, Search, Filter, Trash2, Edit2, X, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';

// motion: componentes com animação | AnimatePresence: anima entrada/saída de elementos do DOM
import { motion, AnimatePresence } from 'motion/react';

// Hook para ler/escrever parâmetros da URL (ex: ?new=true)
import { useSearchParams } from 'react-router-dom';

// Componente da tela de Transações
// Funcionalidades: listar, filtrar, criar, editar e excluir transações
export function TransactionsPage() {
  // Desestrutura os dados do hook financeiro
  const { cycle, transactions, refresh, couple, loading: dataLoading } = useFinancialData();

  // Hook para ler os parâmetros da URL (ex: ?new=true para abrir modal automaticamente)
  const [searchParams, setSearchParams] = useSearchParams();

  // Controla se o modal de criação/edição está aberto
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Guarda a transação sendo editada (null = modo criação)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filtro ativo: 'all' = todas, 'income' = entradas, 'expense' = saídas
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // true durante operações de salvar/excluir (mostra spinner)
  const [loading, setLoading] = useState(false);

  // ── Estados do formulário do modal ──
  const [type, setType] = useState<TransactionType>('expense');      // Tipo: entrada ou saída
  const [amount, setAmount] = useState('');                           // Valor em texto
  const [category, setCategory] = useState('');                       // Categoria selecionada
  const [description, setDescription] = useState('');                 // Descrição livre
  const [payerId, setPayerId] = useState('');                         // ID de quem pagou
  const [isRecurring, setIsRecurring] = useState(false);              // Conta recorrente?
  const [isInstallment, setIsInstallment] = useState(false);          // Compra parcelada?
  const [totalInstallments, setTotalInstallments] = useState('1');   // Número de parcelas

  // Verifica a URL ao montar: se ?new=true, abre o modal imediatamente
  // Isso permite que o botão FAB do Dashboard abra o modal diretamente
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('new');     // Remove o parâmetro da URL
      setSearchParams(searchParams);  // Atualiza a URL sem recarregar
    }
  }, [searchParams, setSearchParams]);

  // Quando o casal carrega, define o parceiro 1 como pagador padrão no formulário
  useEffect(() => {
    if (couple && !payerId) {
      setPayerId(couple.partner1.id);
    }
  }, [couple, payerId]);

  // Reseta todos os campos do formulário para os valores iniciais (modo criação limpo)
  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('');
    setDescription('');
    setPayerId(couple?.partner1.id || ''); // Volta ao pagador padrão
    setIsRecurring(false);
    setIsInstallment(false);
    setTotalInstallments('1');
    setEditingTransaction(null); // Sai do modo edição
  };

  // Preenche o formulário com os dados da transação a ser editada e abre o modal
  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);              // Marca a transação em edição
    setType(t.type);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setDescription(t.description);
    setPayerId(t.payerId);
    setIsRecurring(t.isRecurring);
    setIsInstallment(t.isInstallment);
    setTotalInstallments(t.totalInstallments?.toString() || '1');
    setIsModalOpen(true);                  // Abre o modal em modo edição
  };

  // Exclui uma transação após confirmação do usuário
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta transação?')) return; // confirm() = caixa de diálogo nativa
    setLoading(true);
    try {
      await financialService.deleteTransaction(id); // Remove do banco
      await refresh(); // Recarrega a lista atualizada
    } finally {
      setLoading(false);
    }
  };

  // Salva uma nova transação ou atualiza uma existente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede recarregar a página
    if (!cycle) return; // Segurança: não faz nada sem ciclo ativo
    setLoading(true);

    // Monta o objeto da transação com os dados do formulário
    const data = {
      type,
      amount: parseFloat(amount),    // Converte string para número
      category,
      description,
      payerId,
      date: new Date().toISOString(), // Data/hora atual no formato ISO
      isRecurring,
      isInstallment,
      // Só inclui parcelas se isInstallment = true
      totalInstallments: isInstallment ? parseInt(totalInstallments) : undefined,
      currentInstallment: isInstallment ? 1 : undefined, // Começa sempre na parcela 1
      cycleId: cycle.id // Vincula ao ciclo financeiro atual
    };

    try {
      if (editingTransaction) {
        // Modo edição: atualiza a transação existente (mantém o ID original)
        await financialService.updateTransaction({ ...data, id: editingTransaction.id });
      } else {
        // Modo criação: cria uma nova transação
        await financialService.createTransaction(data);
      }
      setIsModalOpen(false); // Fecha o modal
      resetForm();            // Limpa o formulário
      await refresh();        // Atualiza a lista
    } finally {
      setLoading(false);
    }
  };

  // Filtra as transações conforme o filtro ativo ('all', 'income', 'expense')
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;  // Sem filtro: mostra tudo
    return t.type === filter;           // Filtra pelo tipo da transação
  });

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho com título e botão de adicionar ── */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-white">Transações</h2>
        {/* Botão "+" com borda animada — abre o modal em modo criação */}
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary btn-icon"
        >
          <span className="btn-inner"><Plus size={20} /></span>
        </button>
      </div>

      {/* ── Botões de filtro (Tudo / Entradas / Saídas) ── */}
      <div className="flex gap-2 px-2 overflow-x-auto pb-2 no-scrollbar"> {/* no-scrollbar: esconde a barra de rolagem */}
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)} // Muda o filtro ativo ao clicar
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
              // Filtro ativo: fundo branco | Inativo: fundo escuro cinza
              filter === f
                ? "bg-white text-zinc-950 border-white"
                : "bg-zinc-900 text-zinc-500 border-white/5"
            )}
          >
            {/* Traduz o valor do filtro para o label exibido */}
            {f === 'all' ? 'Tudo' : f === 'income' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {/* ── Lista de Transações ── */}
      <div className="space-y-3">
        {dataLoading ? (
          // Placeholders animados enquanto carrega
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-2xl animate-pulse" />)
        ) : filteredTransactions.length === 0 ? (
          // Mensagem de lista vazia
          <div className="text-center py-12 space-y-2">
            <p className="text-zinc-500">Nenhuma transação encontrada</p>
          </div>
        ) : (
          // Renderiza cada transação filtrada
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              // group: permite estilizar filhos com group-hover (botões de editar/excluir)
              className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                {/* Ícone colorido: verde para entrada, vermelho para saída */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5",
                  t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{t.description}</p>
                  {/* Categoria e data em texto pequeno */}
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mt-0.5">
                    {t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Valor e info de parcela (se aplicável) */}
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold tracking-tight",
                    t.type === 'income' ? "text-emerald-400" : "text-zinc-100"
                  )}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </p>
                  {/* Exibe "Parc. X/Y" somente para compras parceladas */}
                  {t.isInstallment && (
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                      Parc. {t.currentInstallment}/{t.totalInstallments}
                    </p>
                  )}
                </div>

                {/* Botões de ação: ficam invisíveis por padrão, aparecem ao hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Botão Editar */}
                  <button onClick={() => handleEdit(t)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  {/* Botão Excluir */}
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal de Criar/Editar Transação ── */}
      {/* AnimatePresence: permite animação de saída quando o modal fecha */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Fundo escuro semitransparente com desfoque — fecha o modal ao clicar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} // Fecha ao clicar fora
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Painel do modal — sobe de baixo (mobile) ou aparece ao centro (desktop) */}
            <motion.div
              initial={{ y: '100%' }}   // Começa fora da tela (abaixo)
              animate={{ y: 0 }}        // Sobe para a posição visível
              exit={{ y: '100%' }}      // Volta para baixo ao fechar
              transition={{ type: 'spring', damping: 25, stiffness: 300 }} // Animação de mola
              className="relative w-full max-w-md bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border-t border-white/10 sm:border border-white/5"
            >
              {/* Cabeçalho do modal */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">
                  {/* Muda o título dependendo se está editando ou criando */}
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </h3>
                {/* Botão X para fechar o modal */}
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alternador Despesa / Entrada */}
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
                  {/* Campo Valor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"    // Aceita centavos
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0,00"
                    />
                  </div>

                  {/* Campo Descrição */}
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

                  {/* Grade 2 colunas: Categoria e Quem Pagou */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Seletor de Categoria */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Categoria</label>
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                      >
                        <option value="">Selecionar</option>
                        {/* Opções dinâmicas baseadas nas categorias cadastradas pelo casal */}
                        {couple?.settings?.categories?.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Seletor de Quem Pagou */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Quem pagou?</label>
                      <select
                        required
                        value={payerId}
                        onChange={(e) => setPayerId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                      >
                        {/* Opção do parceiro 1 (sempre existe) */}
                        <option value={couple?.partner1.id}>{couple?.partner1.name}</option>
                        {/* Opção do parceiro 2 (só existe se o casal estiver completo) */}
                        {couple?.partner2 && (
                          <option value={couple?.partner2?.id}>{couple?.partner2?.name}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Checkboxes de Recorrente e Parcelado */}
                  <div className="flex items-center gap-6 py-2">
                    {/* Toggle Recorrente — marca como conta fixa mensal */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      {/* Caixa visual personalizada (substitui o checkbox padrão) */}
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        isRecurring ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 group-hover:border-zinc-500"
                      )}>
                        {/* Checkmark: aparece quando isRecurring = true */}
                        {isRecurring && <Plus size={14} className="text-emerald-950" />}
                      </div>
                      {/* Input real oculto — o clique é capturado pelo label acima */}
                      <input type="checkbox" className="hidden" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recorrente</span>
                    </label>

                    {/* Toggle Parcelado — marca como compra parcelada */}
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

                  {/* Campo de Total de Parcelas — só aparece quando isInstallment = true */}
                  {isInstallment && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300"> {/* Animação de entrada */}
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Total de Parcelas</label>
                      <input
                        type="number"
                        min="2"         // Mínimo de 2 parcelas (se fosse 1, não seria parcelado)
                        required
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  )}
                </div>

                {/* Botão de submissão do formulário com borda animada */}
                <button
                  type="submit"
                  disabled={loading} // Desabilitado enquanto salva
                  className="btn-primary btn-full"
                >
                  <span className="btn-inner py-4 text-base">
                    {/* Spinner durante o salvamento, ou texto do botão */}
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (editingTransaction ? 'Salvar Alterações' : 'Confirmar Transação')}
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
