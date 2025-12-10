// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthApi, User, LoginRequest, RegisterRequest } from '../api/auth';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mock-api-studio-token';
const USER_KEY = 'mock-api-studio-user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar token y usuario desde localStorage al montar
  useEffect(() => {
    const loadAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Configurar header de autorización
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

          // Opcional: verificar que el token sigue siendo válido
          try {
            const profile = await AuthApi.getProfile();
            setUser(profile);
            localStorage.setItem(USER_KEY, JSON.stringify(profile));
          } catch (error) {
            // Token inválido, limpiar
            console.error('Token inválido:', error);
            logout();
          }
        } catch (error) {
          console.error('Error cargando auth:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    loadAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await AuthApi.login(data);
    
    setToken(response.token);
    setUser(response.user);
    
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
  };

  const register = async (data: RegisterRequest) => {
    const response = await AuthApi.register(data);
    
    setToken(response.token);
    setUser(response.user);
    
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const refreshProfile = async () => {
    if (token) {
      const profile = await AuthApi.getProfile();
      setUser(profile);
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

