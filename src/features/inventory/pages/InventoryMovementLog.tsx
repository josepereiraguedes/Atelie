import React, { useState, useMemo } from 'react';
import { inventoryMovementLogger, type InventoryMovementLog } from '@/features/inventory/services/inventoryMovementLogger';
import { PageHeader } from '@/shared/components';
import { Package, TrendingUp, TrendingDown, FileText } from 'lucide-react';

const InventoryMovementLog: React.FC = () => {
  const [filterProductId, setFilterProductId] = useState<number | ''>('');
  const [filterMovementType, setFilterMovementType] = useState<'entry' | 'exit' | 'adjustment' | 'all'>('all');

  // Obter logs de movimentação
  const movementLogs = useMemo(() => {
    return inventoryMovementLogger.getMovementLogs(undefined, filterProductId ? filterProductId : undefined);
  }, [filterProductId]);

  // Obter estatísticas
  const statistics = useMemo(() => {
    return inventoryMovementLogger.getMovementStatistics();
  }, []);

  // Filtrar logs por tipo de movimentação
  const filteredLogs = useMemo(() => {
    if (filterMovementType === 'all') return movementLogs;
    return movementLogs.filter(log => log.movementType === filterMovementType);
  }, [movementLogs, filterMovementType]);

  // Formatar tipo de movimentação
  const formatMovementType = (type: 'entry' | 'exit' | 'adjustment') => {
    switch (type) {
      case 'entry': return 'Entrada';
      case 'exit': return 'Saída';
      case 'adjustment': return 'Ajuste';
      default: return type;
    }
  };

  // Obter cor para tipo de movimentação
  const getMovementTypeColor = (type: 'entry' | 'exit' | 'adjustment') => {
    switch (type) {
      case 'entry': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'exit': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'adjustment': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Log de Movimentações de Estoque"
      />
      <p className="text-gray-600 dark:text-gray-400">
        Histórico completo de entradas, saídas e ajustes de estoque
      </p>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Movimentações</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.totalMovements}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Entradas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.totalEntries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Saídas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.totalExits}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ajustes</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.totalAdjustments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Produtos Movimentados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.mostMovedProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID do Produto
            </label>
            <input
              type="number"
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Filtrar por ID do produto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Movimentação
            </label>
            <select
              value={filterMovementType}
              onChange={(e) => setFilterMovementType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="entry">Entradas</option>
              <option value="exit">Saídas</option>
              <option value="adjustment">Ajustes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Data/Hora</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Produto</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Quantidade</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Estoque Anterior</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Novo Estoque</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Referência</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      {log.productName}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {log.productId}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeColor(log.movementType)}`}>
                        {formatMovementType(log.movementType)}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {log.previousQuantity}
                    </td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      {log.newQuantity}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {log.referenceType && log.referenceId ? (
                        <>
                          {log.referenceType === 'purchase_order' && 'Pedido de Compra'}
                          {log.referenceType === 'sale' && 'Venda'}
                          {log.referenceType === 'goods_receipt' && 'Recebimento'}
                          {log.referenceType === 'adjustment' && 'Ajuste'}
                          <div className="text-xs">
                            #{log.referenceId}
                          </div>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Nenhuma movimentação encontrada
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {movementLogs.length === 0 
                ? 'Nenhuma movimentação de estoque registrada'
                : 'Nenhuma movimentação corresponde aos filtros aplicados'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryMovementLog;
