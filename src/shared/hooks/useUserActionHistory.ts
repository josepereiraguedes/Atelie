import { useState, useEffect, useCallback } from 'react';
import { actionLoggerService, ActionLog as UserAction } from '@/services/actionLogger';
import { useAuth } from '@/core/contexts/AuthContext';

/**
 * Hook personalizado para gerenciar o histórico de ações do usuário
 * Agora utiliza o actionLoggerService (backend) em vez do localStorage local
 */
export const useUserActionHistory = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar ações ao montar o componente ou quando o usuário mudar
  useEffect(() => {
    loadActions();
  }, [user?.id]);

  const loadActions = useCallback(async () => {
    if (!user?.id) {
      setActions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const logs = await actionLoggerService.getActionLog();

      // Mapear ActionLog do servidor para o formato esperado pela UI (compatibilidade)
      const mappedActions = logs.map(log => ({
        id: log.id,
        action: log.category, // Na UI 'action' é o tipo (product, client, etc)
        description: log.description,
        timestamp: log.timestamp,
        metadata: log.details || {} // Na UI 'metadata' são os detalhes
      }));

      setActions(mappedActions);
    } catch (error) {
      console.error('Erro ao carregar ações do usuário:', error);
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const recordAction = useCallback((
    category: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return;

    try {
      // No novo serviço, o primeiro parâmetro é o nome da ação específica
      // O segundo é a categoria (que era o 'action' no serviço antigo)
      actionLoggerService.logAction(
        category, // Usando a categoria como nome da ação para simplificar
        category,
        description,
        metadata
      );

      // O logAction é fire-and-forget, mas podemos recarregar as ações localmente após um tempo
      // ou assumir que o usuário verá a atualização na próxima carga
      setTimeout(loadActions, 500);
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  }, [user?.id, loadActions]);

  const getActionsByType = useCallback((actionType: string) => {
    return actions.filter(a => a.action === actionType);
  }, [actions]);

  const clearHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      await actionLoggerService.clearActionLog();
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

