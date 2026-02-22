import { useFinancialData } from '../hooks/useFinancialData';
import { financialService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LogOut,
  Trash2,
  Calendar,
  Users,
  ChevronRight,
  ShieldCheck,
  Bell,
  Moon,
  Loader2,
  RefreshCw,
  Tags,
  Plus,
  X,
  UserPlus,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const { couple, refresh, cycle } = useFinancialData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleReset = async () => {
    if (!confirm('Isso apagará todos os seus dados permanentemente. Continuar?')) return;
    setLoading(true);
    await financialService.resetData();
    await refresh();
    setLoading(false);
    alert('Dados resetados com sucesso.');
  };

  const handleCloseCycle = async () => {
    if (!cycle) return;
    if (!confirm('Deseja encerrar o ciclo atual e iniciar o próximo?')) return;
    setLoading(true);
    await financialService.closeCycle(cycle.id);
    await refresh();
    setLoading(false);
  };

  const updateSettings = async (updates: any) => {
    if (!couple) return;
    const newCouple = {
      ...couple,
      settings: {
        ...couple.settings,
        ...updates
      }
    };
    await financialService.updateCouple(newCouple);
    await refresh();
  };

  const addCategory = async () => {
    if (!newCategory.trim() || !couple || !couple.settings.categories) return;
    if (couple.settings.categories.includes(newCategory.trim())) {
      alert('Categoria já existe');
      return;
    }
    await updateSettings({
      categories: [...couple.settings.categories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const removeCategory = async (cat: string) => {
    if (!couple || !couple.settings.categories) return;
    if (confirm(`Deseja remover a categoria "${cat}"?`)) {
      await updateSettings({
        categories: couple.settings.categories.filter(c => c !== cat)
      });
    }
  };

  const handleJoinCouple = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      await financialService.joinCouple(inviteCode.trim());
      alert('Você entrou no casal com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (!couple) return;
    navigator.clipboard.writeText(couple.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!couple) return null;

  return (
    <div className="space-y-8 pb-12">
      <div className="px-2">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>
        <p className="text-zinc-500 text-sm">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile Section */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-2xl font-bold">
          {couple.partner1.name[0]}{couple.partner2?.name?.[0] || '?'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {couple.partner1.name} {couple.partner2 ? `& ${couple.partner2.name}` : '(Aguardando parceiro)'}
          </h3>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Casal Premium</p>
        </div>
      </div>

      {/* Invite Section */}
      <div className="space-y-3">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Convidar Parceiro</p>
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Compartilhe este código com seu parceiro para que ele possa acessar os mesmos dados.</p>
            <div className="flex items-center gap-2 bg-zinc-950 border border-white/5 rounded-xl p-1 pl-4">
              <span className="flex-1 font-mono font-bold text-emerald-400 tracking-widest">{couple.inviteCode}</span>
              <button
                onClick={copyInviteCode}
                className="p-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {!couple.partner2 && (
            <div className="pt-4 border-t border-white/5 space-y-4">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Ou entre em um casal existente</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Código do parceiro..."
                  className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <button
                  onClick={handleJoinCouple}
                  disabled={loading}
                  className="px-4 bg-emerald-500 text-emerald-950 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
                >
                  Entrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Financeiro</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
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
              <select
                value={couple.settings.payday}
                onChange={(e) => updateSettings({ payday: parseInt(e.target.value) })}
                className="bg-transparent text-emerald-500 font-bold text-sm focus:outline-none"
              >
                {[1, 5, 10, 15, 20, 25].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Modo de Divisão</p>
                  <p className="text-xs text-zinc-500">{couple.settings.divisionMode === '50/50' ? 'Meio a meio' : 'Proporcional'}</p>
                </div>
              </div>
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

        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Categorias</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria..."
                className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <button
                onClick={addCategory}
                className="w-10 h-10 bg-emerald-500 text-emerald-950 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {couple?.settings?.categories?.map(cat => (
                <div
                  key={cat}
                  className="bg-zinc-950 border border-white/5 rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2 group"
                >
                  <span className="text-xs font-medium text-zinc-300">{cat}</span>
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

        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Ações do Ciclo</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            <button
              onClick={handleCloseCycle}
              disabled={loading}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
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

        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Preferências</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Bell size={18} />
                </div>
                <p className="text-sm font-bold text-white">Notificações</p>
              </div>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
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

        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Sistema</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
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

      <div className="text-center space-y-1">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Controle Financeiro Casal</p>
        <p className="text-[10px] text-zinc-700">Versão 1.0.0 • Mock Mode</p>
      </div>
    </div>
  );
}
