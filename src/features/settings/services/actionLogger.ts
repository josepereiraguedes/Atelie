import { apiService } from '@/shared/services/api';

// Interface para uma ação registrada
export interface ActionLog {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  description: string;
  details?: any;
  userId?: string;
}

// Serviço para registrar ações do usuário
class ActionLoggerService {
  /**
   * Registra uma nova ação (Fire and forget no backend)
   */
  logAction(
    action: string,
    category: string,
    description: string,
    details?: any
  ): void {
    try {
      // Envia para o backend sem bloquear a UI
      apiService.createLog({
        action,
        category,
        description,
        details
      }).catch(err => console.error('Erro ao salvar log no servidor:', err));
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  }

  /**
   * Obtém o histórico de ações do backend
   */
  async getActionLog(limit?: number, category?: string): Promise<ActionLog[]> {
    try {
      let logs = await apiService.getLogs(limit);

      if (category && category !== 'all') {
        logs = logs.filter(log => log.category === category);
      }

      return logs;
    } catch (error) {
      console.error('Erro ao obter histórico de ações:', error);
      return [];
    }
  }

  /**
   * Limpa o histórico de ações no backend
   */
  async clearActionLog(): Promise<void> {
    try {
      await apiService.deleteLogs();
    } catch (error) {
      console.error('Erro ao limpar histórico de ações:', error);
    }
  }

  /**
   * Obtém estatísticas do histórico de ações dinamicamente
   */
  async getActionStatistics(): Promise<{
    totalActions: number;
    actionsByCategory: Record<string, number>;
    actionsByType: Record<string, number>;
    mostActiveDay: string;
  }> {
    try {
      const logs = await this.getActionLog();

      const stats = {
        totalActions: logs.length,
        actionsByCategory: {} as Record<string, number>,
        actionsByType: {} as Record<string, number>,
        mostActiveDay: ''
      };

      const dayCount: Record<string, number> = {};

      logs.forEach(log => {
        stats.actionsByCategory[log.category] = (stats.actionsByCategory[log.category] || 0) + 1;
        stats.actionsByType[log.action] = (stats.actionsByType[log.action] || 0) + 1;

        const day = log.timestamp.split('T')[0];
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      let maxCount = 0;
      for (const [day, count] of Object.entries(dayCount)) {
        if (count > maxCount) {
          maxCount = count;
          stats.mostActiveDay = day;
        }
      }

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalActions: 0,
        actionsByCategory: {},
        actionsByType: {},
        mostActiveDay: ''
      };
    }
  }
}

// Instância singleton do serviço
export const actionLoggerService = new ActionLoggerService();
