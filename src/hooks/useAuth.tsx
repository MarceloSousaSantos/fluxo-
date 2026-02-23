// Importa React e os hooks necessários para criar o contexto de autenticação
import React, { createContext, useContext, useEffect, useState } from 'react';

// Importa o tipo User (estrutura do usuário: id, name, email, avatar)
import { User } from '../services/types';

// Importa o serviço financeiro que contém as funções de login, logout, etc.
import { financialService } from '../services';

// Define a "forma" (tipagem TypeScript) do contexto de autenticação
// Qualquer componente que usar useAuth() terá acesso a estes campos
interface AuthContextType {
  user: User | null;                                              // Usuário logado (ou null se não logado)
  loading: boolean;                                              // true enquanto verifica se há sessão ativa
  login: (email: string, password: string) => Promise<void>;    // Função para fazer login
  register: (name: string, email: string, password: string) => Promise<void>; // Função para cadastrar
  logout: () => Promise<void>;                                   // Função para sair da conta
}

// Cria o contexto de autenticação — começa como undefined (sem valor)
// O contexto é um canal pelo qual dados são compartilhados sem precisar passar props
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente provedor — envolve a aplicação inteira e disponibiliza a autenticação
// children = todos os componentes filhos que estão dentro de <AuthProvider>
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado do usuário: começa null (ninguém logado)
  const [user, setUser] = useState<User | null>(null);

  // Estado de carregamento: começa true porque precisa verificar a sessão primeiro
  const [loading, setLoading] = useState(true);

  // useEffect roda uma vez quando o componente monta (carregamento inicial)
  // Verifica se já existe um usuário com sessão ativa (ex: voltou ao app)
  useEffect(() => {
    async function checkUser() {
      try {
        await financialService.init(); // Inicializa o serviço (conecta ao banco)
        const currentUser = await financialService.getCurrentUser(); // Busca o usuário logado
        setUser(currentUser); // Salva o usuário no estado
      } catch (error) {
        console.error('Failed to check user', error); // Loga o erro sem quebrar o app
      } finally {
        setLoading(false); // Independente de sucesso ou erro, para de "carregar"
      }
    }
    checkUser(); // Executa a verificação
  }, []); // [] = roda só uma vez (quando monta)

  // Função de login: chama o serviço, salva o usuário retornado no estado
  const login = async (email: string, password: string) => {
    const loggedUser = await financialService.login(email, password);
    setUser(loggedUser); // Atualiza o usuário globalmente
  };

  // Função de cadastro: chama o serviço, salva o novo usuário no estado
  const register = async (name: string, email: string, password: string) => {
    // "as any" usado para contornar tipagem — o método register existe no serviço impl
    const newUser = await (financialService as any).register(name, email, password);
    setUser(newUser); // Atualiza o usuário globalmente após cadastro
  };

  // Função de logout: chama o serviço para encerrar a sessão e limpa o usuário do estado
  const logout = async () => {
    await financialService.logout(); // Remove a sessão do Supabase
    setUser(null); // Limpa o usuário — a aplicação vai redirecionar para /login
  };

  return (
    // Provider disponibiliza todos os valores para os componentes filhos
    // Qualquer componente pode usar useAuth() para acessar: user, loading, login, register, logout
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children} {/* Renderiza tudo que estiver dentro de <AuthProvider> */}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir o contexto de autenticação
// Uso: const { user, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext); // Acessa o contexto criado acima

  // Garante que useAuth só seja usado dentro de <AuthProvider>
  // Se alguém usar fora, lança um erro explicativo
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context; // Retorna: { user, loading, login, register, logout }
}
