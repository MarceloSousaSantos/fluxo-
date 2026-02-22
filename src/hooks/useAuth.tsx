import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../services/types';
import { financialService } from '../services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        await financialService.init();
        const currentUser = await financialService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to check user', error);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedUser = await financialService.login(email, password);
    setUser(loggedUser);
  };

  const register = async (name: string, email: string, password: string) => {
    const newUser = await (financialService as any).register(name, email, password);
    setUser(newUser);
  };

  const logout = async () => {
    await financialService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
