import { useState, useEffect, useCallback } from 'react';
import { userActionHistoryService, UserAction } from '../services/userActionHistory';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para gerenciar o histórico de ações do usuário
 */
export const useUserActionHistory = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar ações ao montar o componente ou quando o usuário mudar
  useEffect(() => {
    loadActions();
  }, [user?.id]);

  const loadActions = useCallback(() => {
    if (!user?.id) {
      setActions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userActions = userActionHistoryService.getActions(user.id);
      setActions(userActions);
    } catch (error) {
      console.error('Erro ao carregar ações do usuário:', error);
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const recordAction = useCallback((
    action: string, 
    description: string, 
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return;

    try {
      userActionHistoryService.recordAction(
        user.id,
        action,
        description,
        metadata
      );
      // Recarregar ações após registrar uma nova
      loadActions();
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  }, [user?.id, loadActions]);

  const getActionsByType = useCallback((actionType: string) => {
    if (!user?.id) return [];
    return userActionHistoryService.getActionsByType(user.id, actionType);
  }, [user?.id]);

  const clearHistory = useCallback(() => {
    if (!user?.id) return;

    try {
      userActionHistoryService.clearHistory(user.id);
      setActions([]);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, [user?.id]);

  return {
    actions,
    loading,
    recordAction,
    getActionsByType,
    clearHistory,
    refresh: loadActions
  };
};