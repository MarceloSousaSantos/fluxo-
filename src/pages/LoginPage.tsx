import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, Loader2, Instagram } from 'lucide-react';
import { cn } from '../lib/utils';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Erro ao processar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <Heart size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fluxo+</h1>
          <p className="text-zinc-500">Seu dinheiro, sob controle!</p>
        </div>

        <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5">
          <button
            onClick={() => setIsLogin(true)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
              isLogin ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500"
            )}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
              !isLogin ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500"
            )}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-zinc-400 ml-1">Nome</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar no Painel' : 'Criar Minha Conta')}
          </button>
        </form>

        <div className="space-y-4">
          <p className="text-center text-xs text-zinc-600">
            Ao entrar, você concorda com nossos termos de uso.
          </p>
          <p className="text-center text-xs text-zinc-600">
            Desenvolvido por:
          </p>
          <div className="flex justify-center">
            <a
              href="https://instagram.com/__marcelo_ss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-emerald-500 transition-colors"
            >
              <Instagram size={14} />
              <span>@__marcelo_ss</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
