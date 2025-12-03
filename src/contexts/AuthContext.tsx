import React, { createContext, useState, useEffect, useContext } from 'react';
import { localAuthService, LocalUser } from '../services/localAuth';
import { handleError } from '../utils/errorHandler';
import useLocalStorage from '../hooks/useLocalStorage';

interface AuthContextType {
  user: LocalUser | null;
  signIn: (email: string, password: string) => Promise<{ data: { user: LocalUser } | null; error: Error | null }>;
  signOut: () => Promise<void>;
  updateUser: (userId: string, updates: Partial<LocalUser>) => Promise<LocalUser | null>;
  updateUserCredentials: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para verificar se o localStorage está disponível
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test_localstorage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<LocalUser | null>('user', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Verificação de usuário iniciada
      
      // Pequeno atraso para garantir que o localStorage esteja disponível
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Verificar se há um usuário salvo no localStorage
        if (user) {
          // Verificar se há uma versão atualizada do usuário no localStorage
          if (user.id) {
            // Verificando versão atualizada do usuário
            const updatedUser = localAuthService.getUserById(user.id);
            if (updatedUser) {
              // Usuário atualizado encontrado
              setUser(updatedUser);
              // Usuário atualizado salvo (handled by useLocalStorage)
            }
          }
        }
      } catch (error: any) {
        // Em caso de erro, garantir que o usuário seja definido como null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      // Tentando login
      const result = await localAuthService.login(email, password);
      
      if (result) {
        // Login bem-sucedido
        setUser(result);
        return { data: { user: result }, error: null };
      } else {
        // Credenciais inválidas
        return { data: null, error: new Error('Credenciais inválidas') };
      }
    } catch (error: any) {
      // Erro no login
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Realizando logout
      setUser(null);
      // Logout concluído
    } catch (error: any) {
      // Erro no logout
      handleError(error, 'auth', true);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<LocalUser>) => {
    try {
      // Atualizando usuário
      const updatedUser = await localAuthService.updateUserProfile(userId, updates);
      
      // Atualizar o usuário no estado se for o usuário atual
      if (user && user.id === userId && updatedUser) {
        const newUser = {
          ...user,
          ...updates,
          updated_at: updatedUser.updated_at
        };
        setUser(newUser);
      }
      
      return updatedUser;
    } catch (error: any) {
      handleError(error, 'auth', true);
      throw error;
    }
  };

  const updateUserCredentials = async (userId: string, currentPassword: string, newPassword: string) => {
    try {
      // Atualizando credenciais do usuário
      const success = await localAuthService.updateUserCredentials(userId, currentPassword, newPassword);
      
      if (success && user && user.id === userId) {
        // Se a atualização foi bem-sucedida e é o usuário atual, precisamos atualizar o hash da senha
        // Nota: Na prática, não devemos armazenar o hash da senha no localStorage por motivos de segurança
        // Mas para fins de demonstração neste sistema local, vamos atualizar
        console.log('✅ Credenciais atualizadas com sucesso');
      }
      
      return success;
    } catch (error: any) {
      handleError(error, 'auth', true);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser, updateUserCredentials, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};