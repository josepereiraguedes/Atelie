import React, { useState } from 'react';
import { useUserActionHistory } from '../hooks/useUserActionHistory';
import { Clock, Filter, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const UserActionHistory: React.FC = () => {
  const { actions, loading, clearHistory, refresh } = useUserActionHistory();
  const [filter, setFilter] = useState<string>('all');
  
  // Tipos de ações disponíveis
  const actionTypes = [
    { value: 'all', label: 'Todas as ações' },
    { value: 'product', label: 'Produtos' },
    { value: 'client', label: 'Clientes' },
    { value: 'transaction', label: 'Transações' },
    { value: 'settings', label: 'Configurações' },
    { value: 'export', label: 'Exportação' },
    { value: 'import', label: 'Importação' }
  ];

  // Filtrar ações com base no filtro selecionado
  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(action => action.action === filter);

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lidar com limpeza do histórico
  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de ações? Esta ação não pode ser desfeita.')) {
      clearHistory();
      toast.success('Histórico de ações limpo com sucesso!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Histórico de Ações
          </h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="inline-flex items-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-sm rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </button>
          
          <button
            onClick={handleClearHistory}
            disabled={actions.length === 0}
            className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </button>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="flex items-center">
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
        <div className="flex flex-wrap gap-2">
          {actionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Lista de ações */}
      {filteredActions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhuma ação registrada ainda
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Suas ações aparecerão aqui conforme você utilizar o sistema
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredActions.map((action) => (
            <div 
              key={action.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {actionTypes.find(t => t.value === action.action)?.label || action.action}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(action.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 dark:text-white text-sm mt-1">
                    {action.description}
                  </p>
                  
                  {action.metadata && Object.keys(action.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <details>
                        <summary className="cursor-pointer">Detalhes</summary>
                        <div className="mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                          {Object.entries(action.metadata).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium mr-1">{key}:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserActionHistory;