// Hook financeiro — fornece dados do casal, ciclo atual e função refresh
import { useFinancialData } from '../hooks/useFinancialData';

// Serviço para operações no banco: atualizar casal, encerrar ciclo, etc.
import { financialService } from '../services';

// Hook de autenticação — fornece a função de logout
import { useAuth } from '../hooks/useAuth';

// Hook de navegação — redireciona após logout
import { useNavigate } from 'react-router-dom';

// Hook de estado local
import { useState } from 'react';

// Ícones da interface
import {
  LogOut,       // Sair da conta
  Trash2,       // Resetar dados
  Calendar,     // Dia do pagamento
  Users,        // Modo de divisão
  ChevronRight, // Seta ">" ao lado das opções
  ShieldCheck,  // (reservado)
  Bell,         // Notificações
  Moon,         // Modo escuro
  Loader2,      // Spinner de carregamento
  RefreshCw,    // Encerrar ciclo
  Tags,         // (reservado)
  Plus,         // Adicionar categoria
  X,            // Remover categoria
  UserPlus,     // (reservado)
  Copy,         // Copiar código de convite
  Check         // Confirmação de cópia
} from 'lucide-react';

// Animação de entrada do Framer Motion
import { motion } from 'motion/react';

// Utilitário de classes CSS condicionais
import { cn } from '../lib/utils';

// Componente da tela de Configurações
// Permite: gerenciar parceiro, categorias, ciclo, preferências e logout
export function SettingsPage() {
  // Desestrutura os dados necessários do hook financeiro
  const { couple, refresh, cycle } = useFinancialData();

  // Função de logout do contexto de autenticação
  const { logout } = useAuth();

  // Hook para redirecionar após logout
  const navigate = useNavigate();

  // true durante operações assíncronas (reset, encerrar ciclo, entrar no casal)
  const [loading, setLoading] = useState(false);

  // Valor digitado para nova categoria
  const [newCategory, setNewCategory] = useState('');

  // Código de convite digitado pelo parceiro para entrar no casal
  const [inviteCode, setInviteCode] = useState('');

  // true por 2 segundos após copiar o código de convite (mostra ícone de check)
  const [copied, setCopied] = useState(false);

  // Faz logout e redireciona para a tela de login
  const handleLogout = async () => {
    await logout();       // Encerra a sessão no Supabase
    navigate('/login');   // Redireciona para a tela de login
  };

  // Reseta todos os dados financeiros do casal (irreversível)
  const handleReset = async () => {
    if (!confirm('Isso apagará todos os seus dados permanentemente. Continuar?')) return;
    setLoading(true);
    await financialService.resetData(); // Apaga tudo no banco
    await refresh();                    // Recarrega os dados (agora vazio)
    setLoading(false);
    alert('Dados resetados com sucesso.');
  };

  // Encerra o ciclo financeiro atual e inicia o próximo mês
  const handleCloseCycle = async () => {
    if (!cycle) return;
    if (!confirm('Deseja encerrar o ciclo atual e iniciar o próximo?')) return;
    setLoading(true);
    await financialService.closeCycle(cycle.id); // Marca o ciclo como 'closed' e cria o novo
    await refresh();
    setLoading(false);
  };

  // Atualiza as configurações do casal no banco
  // Recebe um objeto parcial e mescla com as configurações existentes
  const updateSettings = async (updates: any) => {
    if (!couple) return;
    const newCouple = {
      ...couple,          // Copia todos os dados do casal
      settings: {
        ...couple.settings, // Mantém as configurações existentes
        ...updates          // Sobrescreve apenas o que foi passado
      }
    };
    await financialService.updateCouple(newCouple); // Salva no banco
    await refresh();                                // Atualiza o estado local
  };

  // Adiciona uma nova categoria à lista de categorias do casal
  const addCategory = async () => {
    // Validações: categoria não pode estar vazia ou já existir na lista
    if (!newCategory.trim() || !couple || !couple.settings.categories) return;
    if (couple.settings.categories.includes(newCategory.trim())) {
      alert('Categoria já existe');
      return;
    }
    // Atualiza as configurações adicionando a nova categoria ao array
    await updateSettings({
      categories: [...couple.settings.categories, newCategory.trim()]
    });
    setNewCategory(''); // Limpa o campo após adicionar
  };

  // Remove uma categoria da lista após confirmação
  const removeCategory = async (cat: string) => {
    if (!couple || !couple.settings.categories) return;
    if (confirm(`Deseja remover a categoria "${cat}"?`)) {
      // Filtra a lista removendo a categoria selecionada
      await updateSettings({
        categories: couple.settings.categories.filter(c => c !== cat)
      });
    }
  };

  // Faz o parceiro atual entrar num casal existente usando o código de convite
  const handleJoinCouple = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      await financialService.joinCouple(inviteCode.trim()); // Vincula os dois usuários
      alert('Você entrou no casal com sucesso! A página será recarregada.');
      window.location.reload(); // Recarrega para refletir os novos dados do casal
    } catch (error: any) {
      alert(error.message); // Exibe o erro (ex: código inválido)
      setLoading(false);
    }
  };

  // Copia o código de convite para a área de transferência
  const copyInviteCode = () => {
    if (!couple) return;
    navigator.clipboard.writeText(couple.inviteCode); // API nativa do navegador
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Volta ao ícone original após 2s
  };

  // Segurança: não renderiza nada se o casal não tiver carregado ainda
  if (!couple) return null;

  return (
    <div className="space-y-8 pb-12"> {/* pb-12: padding inferior extra para não sobrepor BottomNav */}

      {/* Cabeçalho da página */}
      <div className="px-2">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>
        <p className="text-zinc-500 text-sm">Gerencie sua conta e preferências</p>
      </div>

      {/* ── Card de Perfil do Casal ── */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex items-center gap-4">
        {/* Avatar: iniciais dos dois parceiros */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-2xl font-bold">
          {/* Primeira letra do nome de cada parceiro. "?" se parceiro 2 ainda não entrou */}
          {couple.partner1.name[0]}{couple.partner2?.name?.[0] || '?'}
        </div>
        <div>
          {/* Nome dos parceiros — "& NomeParceiro2" ou "(Aguardando parceiro)" */}
          <h3 className="text-lg font-bold text-white">
            {couple.partner1.name} {couple.partner2 ? `& ${couple.partner2.name}` : '(Aguardando parceiro)'}
          </h3>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Casal Premium</p>
        </div>
      </div>

      {/* ── Seção de Convite de Parceiro ── */}
      <div className="space-y-3">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Convidar Parceiro</p>
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Compartilhe este código com seu parceiro para que ele possa acessar os mesmos dados.</p>
            {/* Exibição do código com botão de copiar */}
            <div className="flex items-center gap-2 bg-zinc-950 border border-white/5 rounded-xl p-1 pl-4">
              {/* Código em fonte mono e cor verde para destaque */}
              <span className="flex-1 font-mono font-bold text-emerald-400 tracking-widest">{couple.inviteCode}</span>
              {/* Botão de copiar: alterna entre ícone Copy e Check após copiar */}
              <button
                onClick={copyInviteCode}
                className="p-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Opção de entrar num casal existente — só aparece se o parceiro 2 ainda não entrou */}
          {!couple.partner2 && (
            <div className="pt-4 border-t border-white/5 space-y-4">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Ou entre em um casal existente</p>
              <div className="flex gap-2">
                {/* Campo para digitar o código do parceiro — converte para maiúsculas automaticamente */}
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())} // Força maiúsculas
                  placeholder="Código do parceiro..."
                  className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                {/* Botão "Entrar" com borda animada */}
                <button
                  onClick={handleJoinCouple}
                  disabled={loading}
                  className="btn-primary btn-sm"
                >
                  <span className="btn-inner uppercase tracking-widest text-xs">Entrar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Grupos de Configurações ── */}
      <div className="space-y-6">

        {/* ── Seção Financeiro ── */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Financeiro</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">

            {/* Opção: Dia do Recebimento */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Dia do Recebimento</p>
                  <p className="text-xs text-zinc-500">Dia {couple.settings.payday} de cada mês</p>
                </div>
              </div>
              {/* Select nativo transparente para selecionar o dia */}
              <select
                value={couple.settings.payday}
                onChange={(e) => updateSettings({ payday: parseInt(e.target.value) })} // Atualiza no banco ao mudar
                className="bg-transparent text-emerald-500 font-bold text-sm focus:outline-none"
              >
                {/* Opções de dias disponíveis */}
                {[1, 5, 10, 15, 20, 25].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Opção: Modo de Divisão */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Modo de Divisão</p>
                  {/* Exibe o modo atual de forma amigável */}
                  <p className="text-xs text-zinc-500">{couple.settings.divisionMode === '50/50' ? 'Meio a meio' : 'Proporcional'}</p>
                </div>
              </div>
              {/* Select para alterar o modo de divisão */}
              <select
                value={couple.settings.divisionMode}
                onChange={(e) => updateSettings({ divisionMode: e.target.value })}
                className="bg-transparent text-emerald-500 font-bold text-sm focus:outline-none"
              >
                <option value="50/50">50/50</option>
                <option value="proportional">Proporcional</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Seção Categorias ── */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Categorias</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-4 space-y-4">

            {/* Campo para adicionar nova categoria */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria..."
                className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              {/* Botão "+" com borda animada para adicionar a categoria */}
              <button
                onClick={addCategory}
                className="btn-primary btn-icon"
              >
                <span className="btn-inner"><Plus size={18} /></span>
              </button>
            </div>

            {/* Lista de categorias existentes como chips (pílulas) */}
            <div className="flex flex-wrap gap-2">
              {couple?.settings?.categories?.map(cat => (
                <div
                  key={cat}
                  className="bg-zinc-950 border border-white/5 rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2 group"
                >
                  <span className="text-xs font-medium text-zinc-300">{cat}</span>
                  {/* Botão X para remover a categoria */}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Seção Ações do Ciclo ── */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Ações do Ciclo</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            {/* Botão de encerrar o ciclo atual e iniciar o próximo */}
            <button
              onClick={handleCloseCycle}
              disabled={loading}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  {/* Ícone gira quando está carregando */}
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Encerrar Ciclo Atual</p>
                  <p className="text-xs text-zinc-500">Inicia o próximo mês agora</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>
          </div>
        </div>

        {/* ── Seção Preferências ── */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Preferências</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            {/* Toggle de Notificações (visual apenas — funcionalidade futura) */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Bell size={18} />
                </div>
                <p className="text-sm font-bold text-white">Notificações</p>
              </div>
              {/* Switch visual: bola branca à direita = ativado */}
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>

            {/* Toggle de Modo Escuro (visual apenas — o app já usa modo escuro fixo) */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Moon size={18} />
                </div>
                <p className="text-sm font-bold text-white">Modo Escuro</p>
              </div>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção Sistema ── */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Sistema</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">

            {/* Botão de resetar todos os dados (ação destrutiva e irreversível) */}
            <button
              onClick={handleReset}
              disabled={loading}
              // group: permite que filhos usem group-hover para mudar ao hover do pai
              className="w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                {/* Ícone vermelho que fica mais intenso ao hover */}
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-red-500/50 group-hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">Resetar Todos os Dados</p>
                  <p className="text-xs text-zinc-500">Cuidado: Ação irreversível</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            {/* Botão de sair da conta */}
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <LogOut size={18} />
                </div>
                <p className="text-sm font-bold text-white">Sair da Conta</p>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé com informações do app */}
      <div className="text-center space-y-1">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Controle Financeiro Casal</p>
        <p className="text-[10px] text-zinc-700">Versão 1.0.0 • Mock Mode</p>
      </div>
    </div>
  );
}
