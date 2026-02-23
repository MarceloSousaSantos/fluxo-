// Importa os componentes de roteamento do React Router
// BrowserRouter: usa a URL do navegador para navegação
// Routes: container que agrupa todas as rotas
// Route: define uma rota específica (URL → componente)
// Navigate: redireciona automaticamente para outra rota
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importa o provedor de autenticação (controla login/logout/usuário atual)
import { AuthProvider } from './hooks/useAuth';

// Importa o Layout padrão das páginas autenticadas (tem a barra de navegação inferior)
import { Layout } from './components/Layout';

// Importa todas as páginas do aplicativo
import { LoginPage } from './pages/LoginPage';           // Tela de login e cadastro
import { DashboardPage } from './pages/DashboardPage';   // Tela principal com saldo e resumo
import { TransactionsPage } from './pages/TransactionsPage'; // Tela de transações
import { SummaryPage } from './pages/SummaryPage';       // Tela de resumo/gráficos
import { SettingsPage } from './pages/SettingsPage';     // Tela de configurações

// Componente raiz da aplicação — define toda a estrutura de rotas
export default function App() {
  return (
    // AuthProvider envolve tudo: disponibiliza o usuário logado para qualquer componente filho
    <AuthProvider>
      {/* Router ativa o sistema de navegação por URL */}
      <Router>
        <Routes>
          {/* Rota pública: qualquer pessoa pode acessar /login sem estar logada */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rota protegida: Layout verifica se o usuário está logado antes de mostrar as páginas */}
          {/* Se não estiver logado, redireciona para /login automaticamente */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />     {/* Página inicial */}
            <Route path="/transacoes" element={<TransactionsPage />} />  {/* Lista de transações */}
            <Route path="/resumo" element={<SummaryPage />} />       {/* Gráficos e resumo */}
            <Route path="/configuracoes" element={<SettingsPage />} />      {/* Configurações */}

            {/* Rota raiz "/" redireciona para o dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Qualquer rota desconhecida (* = curinga) redireciona para o dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
