// Outlet: renderiza a página filha da rota atual (Dashboard, Transações, etc.)
// Navigate: redireciona automaticamente para outra rota
import { Outlet, Navigate } from 'react-router-dom';

// Hook de autenticação — verifica se o usuário está logado
import { useAuth } from '../hooks/useAuth';

// Barra de navegação inferior que aparece em todas as telas autenticadas
import { BottomNav } from './BottomNav';

// Componente Layout — funciona como "moldura" de todas as páginas protegidas
// Responsabilidades:
//  1. Mostra loading enquanto verifica a sessão
//  2. Redireciona para /login se não estiver logado
//  3. Renderiza a página correta com a barra inferior
export function Layout() {
  // Acessa o usuário logado e o estado de carregamento da sessão
  const { user, loading } = useAuth();

  // Enquanto está verificando se há usuário logado, mostra um spinner centralizado
  // Isso evita "flash" da tela de login antes de confirmar a sessão
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        {/* Spinner animado: borda verde girando */}
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não há usuário logado após o carregamento, redireciona para o login
  // "replace" substitui a entrada no histórico (botão Voltar não volta para aqui)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usuário logado: renderiza a estrutura principal do app
  return (
    // Fundo escuro (zinc-950), texto claro, padding inferior para não sobrepor a BottomNav
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">

      {/* Área de conteúdo principal: centralizada, largura máxima (md) e padding lateral/superior */}
      <main className="max-w-md mx-auto px-4 pt-8">
        {/* Outlet renderiza a página filha da rota ativa:
            /dashboard → DashboardPage
            /transacoes → TransactionsPage
            /resumo → SummaryPage
            /configuracoes → SettingsPage */}
        <Outlet />
      </main>

      {/* Barra de navegação inferior — sempre visível nas telas autenticadas */}
      <BottomNav />
    </div>
  );
}
