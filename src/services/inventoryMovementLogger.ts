// Interface para um registro de movimentação de estoque
export interface InventoryMovementLog {
  id: string;
  productId: number;
  productName: string;
  movementType: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceId?: number; // ID do documento de referência (pedido de compra, venda, etc.)
  referenceType?: 'purchase_order' | 'sale' | 'goods_receipt' | 'adjustment';
  timestamp: string;
  userId?: string;
  notes?: string;
}

// Serviço para registrar movimentações de estoque
class InventoryMovementLogger {
  private readonly STORAGE_KEY = 'inventory-movement-log';
  private readonly MAX_LOGS = 1000; // Limite máximo de registros

  /**
   * Registra uma nova movimentação de estoque
   * @param productId ID do produto
   * @param productName Nome do produto
   * @param movementType Tipo de movimentação (entrada, saída, ajuste)
   * @param quantity Quantidade movimentada
   * @param previousQuantity Quantidade anterior em estoque
   * @param newQuantity Nova quantidade em estoque
   * @param referenceId ID do documento de referência (opcional)
   * @param referenceType Tipo do documento de referência (opcional)
   * @param notes Notas adicionais (opcional)
   */
  logMovement(
    productId: number,
    productName: string,
    movementType: 'entry' | 'exit' | 'adjustment',
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    referenceId?: number,
    referenceType?: 'purchase_order' | 'sale' | 'goods_receipt' | 'adjustment',
    notes?: string
  ): void {
    try {
      const log: InventoryMovementLog = {
        id: this.generateId(),
        productId,
        productName,
        movementType,
        quantity,
        previousQuantity,
        newQuantity,
        referenceId,
        referenceType,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        notes
      };

      this.saveLog(log);
    } catch (error) {
      console.error('Erro ao registrar movimentação de estoque:', error);
    }
  }

  /**
   * Obtém todas as movimentações de estoque
   * @param limit Limite de registros (opcional)
   * @param productId Filtrar por ID do produto (opcional)
   * @returns Array de movimentações de estoque
   */
  getMovementLogs(limit?: number, productId?: number): InventoryMovementLog[] {
    try {
      const logs = this.loadLogs();
      
      // Filtrar por produto se necessário
      let filteredLogs = productId 
        ? logs.filter(log => log.productId === productId)
        : logs;
      
      // Ordenar por timestamp (mais recente primeiro)
      filteredLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Limitar resultados se necessário
      if (limit) {
        filteredLogs = filteredLogs.slice(0, limit);
      }
      
      return filteredLogs;
    } catch (error) {
      console.error('Erro ao obter movimentações de estoque:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de movimentação de estoque
   * @returns Estatísticas de movimentação
   */
  getMovementStatistics(): {
    totalMovements: number;
    totalEntries: number;
    totalExits: number;
    totalAdjustments: number;
    mostMovedProducts: { productId: number; productName: string; totalQuantity: number }[];
  } {
    try {
      const logs = this.loadLogs();
      
      const stats = {
        totalMovements: logs.length,
        totalEntries: logs.filter(log => log.movementType === 'entry').length,
        totalExits: logs.filter(log => log.movementType === 'exit').length,
        totalAdjustments: logs.filter(log => log.movementType === 'adjustment').length,
        mostMovedProducts: [] as { productId: number; productName: string; totalQuantity: number }[]
      };
      
      // Calcular produtos mais movimentados
      const productMovements: Record<number, { productName: string; totalQuantity: number }> = {};
      
      logs.forEach(log => {
        if (!productMovements[log.productId]) {
          productMovements[log.productId] = {
            productName: log.productName,
            totalQuantity: 0
          };
        }
        productMovements[log.productId].totalQuantity += Math.abs(log.quantity);
      });
      
      // Ordenar por quantidade total e pegar os top 5
      stats.mostMovedProducts = Object.entries(productMovements)
        .map(([productId, data]) => ({
          productId: parseInt(productId),
          productName: data.productName,
          totalQuantity: data.totalQuantity
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);
      
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de movimentação:', error);
      return {
        totalMovements: 0,
        totalEntries: 0,
        totalExits: 0,
        totalAdjustments: 0,
        mostMovedProducts: []
      };
    }
  }

  /**
   * Salva um registro de movimentação
   * @param log Registro de movimentação a ser salvo
   */
  private saveLog(log: InventoryMovementLog): void {
    const logs = this.loadLogs();
    
    // Adicionar novo registro no início
    logs.unshift(log);
    
    // Manter apenas os registros mais recentes
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }
    
    // Salvar no localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
  }

  /**
   * Carrega todos os registros de movimentação
   * @returns Array de registros de movimentação
   */
  private loadLogs(): InventoryMovementLog[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar registros de movimentação:', error);
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

  /**
   * Obtém o ID do usuário atual (simulação)
   * @returns ID do usuário ou undefined
   */
  private getCurrentUserId(): string | undefined {
    // Em uma implementação real, isso viria do contexto de autenticação
    return 'current-user'; // Placeholder
  }
}

// Instância singleton do serviço
export const inventoryMovementLogger = new InventoryMovementLogger();