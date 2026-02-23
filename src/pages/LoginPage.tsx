// Importa React e o hook useState para controlar os estados locais do formulário
import React, { useState } from 'react';

// Hook de autenticação — fornece as funções login e register
import { useAuth } from '../hooks/useAuth';

// Hook de navegação programática — permite redirecionar após login/cadastro
import { useNavigate } from 'react-router-dom';

// Ícones usados na interface
// Heart: ícone do logo | Mail: campo de e-mail e nome | Lock: campo de senha
// Loader2: spinner de carregamento | Instagram: link do desenvolvedor
// Eye/EyeOff: alternar visibilidade da senha
import { Heart, Mail, Lock, Loader2, Instagram, Eye, EyeOff } from 'lucide-react';

// Utilitário para combinar classes CSS condicionalmente
import { cn } from '../lib/utils';

// Componente da tela de Login/Cadastro
// Alterna entre as duas telas através da variável isLogin
export function LoginPage() {
  // true = modo login | false = modo cadastro
  const [isLogin, setIsLogin] = useState(true);

  // Campo de nome (só aparece no cadastro)
  const [name, setName] = useState('');

  // Campo de e-mail (aparece nos dois modos)
  const [email, setEmail] = useState('');

  // Campo de senha principal
  const [password, setPassword] = useState('');

  // Campo de confirmação de senha (só aparece no cadastro)
  const [confirmPassword, setConfirmPassword] = useState('');

  // Controla se a senha principal está visível (false = oculta com bolinhas)
  const [showPassword, setShowPassword] = useState(false);

  // Controla se a confirmação de senha está visível
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // true enquanto a requisição de login/cadastro está em andamento
  const [loading, setLoading] = useState(false);

  // Extrai as funções de login e cadastro do contexto de autenticação
  const { login, register } = useAuth();

  // Hook para redirecionar o usuário após autenticação
  const navigate = useNavigate();

  // Função chamada quando o formulário é submetido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o comportamento padrão do HTML (recarregar a página)

    // Validação: no modo cadastro, as senhas devem ser iguais
    if (!isLogin && password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return; // Interrompe a execução — não envia o formulário
    }

    setLoading(true); // Ativa o spinner no botão

    try {
      if (isLogin) {
        await login(email, password);      // Chama login no Supabase Auth
      } else {
        await register(name, email, password); // Cria conta nova no Supabase Auth + perfil
      }
      navigate('/dashboard'); // Redireciona para o painel após sucesso
    } catch (error) {
      console.error(error);
      alert('Erro ao processar. Verifique seus dados.'); // Alerta genérico em caso de falha
    } finally {
      setLoading(false); // Desativa o spinner independente do resultado
    }
  };

  return (
    // Fundo escuro, centralizado vertical e horizontalmente, com padding lateral
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8"> {/* Container máximo de 384px com espaçamento */}

        {/* Cabeçalho com logo animado e tagline */}
        <div className="text-center space-y-2">
          {/* Spinner animado: gradiente roxo/ciano girando com aura colorida */}
          <div className="relative w-[90px] h-[90px] mx-auto mb-6">
            {/* Camada do gradiente girando */}
            <div className="login-spinner" />
            {/* Disco escuro que cria o efeito de profundidade */}
            <div className="login-spinner-inner" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fluxo++</h1>
          <p className="text-zinc-500">Seu dinheiro, sob controle!</p>
        </div>

        {/* Alternador entre Login e Cadastro — tab-style */}
        <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5">
          {/* Botão "Entrar" — fica destacado quando isLogin = true */}
          <button
            onClick={() => setIsLogin(true)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
              isLogin ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500"
            )}
          >
            Entrar
          </button>

          {/* Botão "Cadastrar" — fica destacado quando isLogin = false */}
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

        {/* Formulário: chama handleSubmit ao submeter */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo de Nome — só aparece no modo Cadastro */}
          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300"> {/* Animação de entrada */}
              <label className="text-sm font-medium text-zinc-400 ml-1">Nome</label>
              <div className="relative"> {/* relative: permite posicionar o ícone absolutamente */}
                {/* Ícone de envelope posicionado à esquerda dentro do input */}
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  required          // Campo obrigatório
                  value={name}      // Valor controlado pelo estado
                  onChange={(e) => setName(e.target.value)} // Atualiza o estado a cada tecla
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          {/* Campo de E-mail — aparece nos dois modos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="email"    // Valida automaticamente o formato de e-mail
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          {/* Campo de Senha — aparece nos dois modos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                // Se showPassword = true → type text (mostra), senão type password (oculta)
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
              />
              {/* Botão olho: alterna showPassword entre true/false */}
              <button
                type="button"  // type="button" evita enviar o formulário ao clicar
                onClick={() => setShowPassword((v) => !v)} // Inverte o valor atual
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}  // Exclui da navegação por Tab (melhora acessibilidade do fluxo)
              >
                {/* Mostra EyeOff quando a senha está visível, Eye quando oculta */}
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Campo de Confirmação de Senha — só aparece no modo Cadastro */}
          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-zinc-400 ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="••••••••"
                />
                {/* Botão olho para a confirmação de senha */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Botão de submit com borda animada (estilo Google) */}
          {/* disabled={loading} bloqueia o botão durante o processamento */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-full mt-4"
          >
            <span className="btn-inner py-4 text-base">
              {/* Mostra spinner enquanto carrega, ou o texto do botão */}
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar no Painel' : 'Criar Minha Conta')}
            </span>
          </button>
        </form>

        {/* Rodapé com termos e crédito do desenvolvedor */}
        <div className="space-y-4">
          <p className="text-center text-xs text-zinc-600">
            Ao entrar, você concorda com nossos termos de uso.
          </p>
          <p className="text-center text-xs text-zinc-600">
            Desenvolvido por:
          </p>
          <div className="flex justify-center">
            {/* Link para o Instagram do desenvolvedor — abre em nova aba */}
            <a
              href="https://instagram.com/__marcelo_ss"
              target="_blank"           // Abre em nova aba
              rel="noopener noreferrer" // Segurança: impede que a nova aba acesse a aba atual
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
