import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario, LoginResponse } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  isDono: boolean;
  login: (email: string, pass: string) => Promise<LoginResponse>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    const savedUser = localStorage.getItem('makinsthal_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('makinsthal_token');
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('makinsthal_token');
      localStorage.removeItem('makinsthal_user');
    };

    window.addEventListener('auth_logout', handleAuthLogout);

    // Valida o token com o backend se existir
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('makinsthal_user', JSON.stringify(userData));
        })
        .catch(() => {
          handleAuthLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('auth_logout', handleAuthLogout);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<LoginResponse> => {
    const res = await api.login({ email, senha: pass });
    setToken(res.token);
    const usuarioObj: Usuario = {
      id: res.id,
      nome: res.nome,
      email: res.email,
      role: res.role,
      ativo: true,
      dataCriacao: new Date().toISOString()
    };
    setUser(usuarioObj);
    localStorage.setItem('makinsthal_token', res.token);
    localStorage.setItem('makinsthal_user', JSON.stringify(usuarioObj));
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('makinsthal_token');
    localStorage.removeItem('makinsthal_user');
  };

  const isDono = user?.role === 'DONO';

  return (
    <AuthContext.Provider value={{ user, token, loading, isDono, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
