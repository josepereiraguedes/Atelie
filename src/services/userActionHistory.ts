import { handleError } from '../utils/errorHandler';

// Interface para uma ação do usuário
export interface UserAction {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Serviço para gerenciamento do histórico de ações do usuário
 */
class UserActionHistoryService {
  private static instance: UserActionHistoryService;
  private readonly STORAGE_KEY = 'user-action-history';
  private readonly MAX_ACTIONS = 100; // Número máximo de ações para manter

  private constructor() {}

  /**
   * Obtém a instância singleton do serviço
   * @returns Instância do UserActionHistoryService
   */
  static getInstance(): UserActionHistoryService {
    if (!UserActionHistoryService.instance) {
      UserActionHistoryService.instance = new UserActionHistoryService();
    }
    return UserActionHistoryService.instance;
  }

  /**
   * Registra uma nova ação do usuário
   * @param userId ID do usuário
   * @param action Tipo de ação
   * @param description Descrição da ação
   * @param metadata Dados adicionais (opcional)
   * @returns ID da ação registrada
   */
  recordAction(userId: string, action: string, description: string, metadata?: Record<string, any>): string {
    try {
      const actionId = this.generateId();
      const userAction: UserAction = {
        id: actionId,
        userId,
        action,
        description,
        timestamp: new Date().toISOString(),
        metadata
      };

      // Obter ações existentes
      const actions = this.getActions(userId);
      
      // Adicionar nova ação no início
      actions.unshift(userAction);
      
      // Limitar o número de ações
      if (actions.length > this.MAX_ACTIONS) {
        actions.splice(this.MAX_ACTIONS);
      }
      
      // Salvar no localStorage
      localStorage.setItem(`${this.STORAGE_KEY}-${userId}`, JSON.stringify(actions));
      
      console.log(`✅ Ação registrada: ${action} - ${description}`);
      return actionId;
    } catch (error) {
      console.error('❌ Erro ao registrar ação:', error);
      handleError(error, 'userActionHistory');
      throw error;
    }
  }

  /**
   * Obtém todas as ações de um usuário
   * @param userId ID do usuário
   * @returns Array de ações do usuário
   */
  getActions(userId: string): UserAction[] {
    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY}-${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao obter ações do usuário:', error);
      return [];
    }
  }

  /**
   * Obtém ações filtradas por tipo
   * @param userId ID do usuário
   * @param action Tipo de ação para filtrar
   * @returns Array de ações filtradas
   */
  getActionsByType(userId: string, action: string): UserAction[] {
    try {
      const actions = this.getActions(userId);
      return actions.filter(a => a.action === action);
    } catch (error) {
      console.error('❌ Erro ao obter ações por tipo:', error);
      return [];
    }
  }

  /**
   * Remove todas as ações de um usuário
   * @param userId ID do usuário
   */
  clearHistory(userId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}-${userId}`);
      console.log(`✅ Histórico de ações do usuário ${userId} limpo com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao limpar histórico de ações:', error);
      handleError(error, 'userActionHistory');
      throw error;
    }
  }

  /**
   * Gera um ID único
   * @returns ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Exportar instância singleton
export const userActionHistoryService = UserActionHistoryService.getInstance();