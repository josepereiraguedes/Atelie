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
  private readonly STORAGE_KEY = 'user-action-log';
  private readonly MAX_LOGS = 1000; // Limite máximo de registros

  /**
   * Registra uma nova ação
   * @param action Tipo de ação (ex: 'create', 'update', 'delete', 'view')
   * @param category Categoria da ação (ex: 'product', 'client', 'transaction')
   * @param description Descrição legível da ação
   * @param details Detalhes adicionais (opcional)
   */
  logAction(
    action: string,
    category: string,
    description: string,
    details?: any
  ): void {
    try {
      const log: ActionLog = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        action,
        category,
        description,
        details
      };

      this.saveLog(log);
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  }

  /**
   * Obtém o histórico de ações
   * @param limit Número máximo de registros a retornar (opcional)
   * @param category Filtrar por categoria (opcional)
   * @returns Array de ações registradas
   */
  getActionLog(limit?: number, category?: string): ActionLog[] {
    try {
      const logs = this.loadLogs();
      
      // Filtrar por categoria se especificada
      let filteredLogs = logs;
      if (category) {
        filteredLogs = logs.filter(log => log.category === category);
      }
      
      // Ordenar por timestamp (mais recente primeiro)
      filteredLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Limitar resultados se especificado
      if (limit) {
        return filteredLogs.slice(0, limit);
      }
      
      return filteredLogs;
    } catch (error) {
      console.error('Erro ao obter histórico de ações:', error);
      return [];
    }
  }

  /**
   * Limpa o histórico de ações
   */
  clearActionLog(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar histórico de ações:', error);
    }
  }

  /**
   * Obtém estatísticas do histórico de ações
   * @returns Estatísticas agregadas
   */
  getActionStatistics(): {
    totalActions: number;
    actionsByCategory: Record<string, number>;
    actionsByType: Record<string, number>;
    mostActiveDay: string;
  } {
    try {
      const logs = this.getActionLog();
      
      const stats = {
        totalActions: logs.length,
        actionsByCategory: {} as Record<string, number>,
        actionsByType: {} as Record<string, number>,
        mostActiveDay: ''
      };
      
      // Contar ações por categoria e tipo
      const dayCount: Record<string, number> = {};
      
      logs.forEach(log => {
        // Contar por categoria
        stats.actionsByCategory[log.category] = 
          (stats.actionsByCategory[log.category] || 0) + 1;
        
        // Contar por tipo de ação
        stats.actionsByType[log.action] = 
          (stats.actionsByType[log.action] || 0) + 1;
        
        // Contar por dia
        const day = log.timestamp.split('T')[0];
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      
      // Encontrar o dia mais ativo
      let maxCount = 0;
      for (const [day, count] of Object.entries(dayCount)) {
        if (count > maxCount) {
          maxCount = count;
          stats.mostActiveDay = day;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de ações:', error);
      return {
        totalActions: 0,
        actionsByCategory: {},
        actionsByType: {},
        mostActiveDay: ''
      };
    }
  }

  /**
   * Salva um registro de ação
   * @param log Registro a ser salvo
   */
  private saveLog(log: ActionLog): void {
    const logs = this.loadLogs();
    
    // Adicionar novo registro
    logs.unshift(log);
    
    // Limitar o número de registros
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }
    
    // Salvar no localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
  }

  /**
   * Carrega registros de ações do localStorage
   * @returns Array de registros
   */
  private loadLogs(): ActionLog[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar registros de ações:', error);
      return [];
    }
  }

  /**
   * Gera um ID único para o registro
   * @returns ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Instância singleton do serviço
export const actionLoggerService = new ActionLoggerService();