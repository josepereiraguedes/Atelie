import React, { useState, useMemo } from 'react';
import { actionLoggerService, type ActionLog } from '../services/actionLogger';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '../components/common/PageHeader';
import { Filter, Calendar, User, Package, ShoppingCart, Truck, FileText, BarChart2 } from 'lucide-react';

const ActionLog: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  
  // Obter logs de ações
  const actionLogs = useMemo(() => {
    return actionLoggerService.getActionLog(undefined, filterCategory !== 'all' ? filterCategory : undefined);
  }, [filterCategory]);
  
  // Obter estatísticas
  const statistics = useMemo(() => {
    return actionLoggerService.getActionStatistics();
  }, []);
  
  // Filtrar logs por tipo de ação
  const filteredLogs = useMemo(() => {
    if (filterAction === 'all') return actionLogs;
    return actionLogs.filter(log => log.action === filterAction);
  }, [actionLogs, filterAction]);
  
  // Categorias disponíveis
  const categories = [
    { value: 'all', label: 'Todas as categorias' },
    { value: 'product', label: 'Produtos' },
    { value: 'client', label: 'Clientes' },
    { value: 'supplier', label: 'Fornecedores' },
    { value: 'transaction', label: 'Transações' },
    { value: 'inventory', label: 'Estoque' },
    { value: 'marketplace', label: 'Marketplaces' },
    { value: 'report', label: 'Relatórios' },
    { value: 'settings', label: 'Configurações' }
  ];
  
  // Tipos de ações disponíveis
  const actions = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'create', label: 'Criação' },
    { value: 'update', label: 'Atualização' },
    { value: 'delete', label: 'Exclusão' },
    { value: 'view', label: 'Visualização' },
    { value: 'export', label: 'Exportação' },
    { value: 'import', label: 'Importação' }
  ];
  
  // Ícone para categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'client': return <User className="w-4 h-4" />;
      case 'supplier': return <Truck className="w-4 h-4" />;
      case 'transaction': return <ShoppingCart className="w-4 h-4" />;
      case 'report': return <BarChart2 className="w-4 h-4" />;
      case 'settings': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };
  
  // Texto para tipo de ação
  const getActionText = (action: string) => {
    switch (action) {
      case 'create': return 'Criou';
      case 'update': return 'Atualizou';
      case 'delete': return 'Excluiu';
      case 'view': return 'Visualizou';
      case 'export': return 'Exportou';
      case 'import': return 'Importou';
      default: return action;
    }
  };
  
  // Classe para cor da ação
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'update': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delete': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'view': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'export': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'import': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const clearLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de ações? Esta ação não pode ser desfeita.')) {
      actionLoggerService.clearActionLog();
      // Forçar re-render
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Histórico de Ações" 
      />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Registro completo de todas as atividades realizadas no sistema
      </p>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Ações</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.totalActions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dia Mais Ativo</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {statistics.mostActiveDay 
                  ? format(parseISO(statistics.mostActiveDay), "dd/MM/yyyy", { locale: ptBR })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Produtos</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {statistics.actionsByCategory['product'] || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Clientes</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {statistics.actionsByCategory['client'] || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </h3>
          <button
            onClick={clearLogs}
            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
          >
            Limpar Histórico
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Ação
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {actions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Lista de ações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Histórico de Ações
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descrição
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {getCategoryIcon(log.category)}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {log.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionText(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.description}
                      {log.details && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Detalhes: {JSON.stringify(log.details)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="w-12 h-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        Nenhuma ação registrada
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {filterCategory !== 'all' || filterAction !== 'all' 
                          ? 'Nenhuma ação corresponde aos filtros aplicados' 
                          : 'Comece a usar o sistema para registrar ações'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActionLog;