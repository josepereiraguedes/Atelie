import React, { useState, useMemo, useEffect } from 'react';
import { actionLoggerService, type ActionLog } from '@/services/actionLogger';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/shared/components';
import { Calendar, User, Package, ShoppingCart, Truck, FileText, BarChart2, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ActionLog: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalActions: 0,
    actionsByCategory: {} as Record<string, number>,
    actionsByType: {} as Record<string, number>,
    mostActiveDay: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const logs = await actionLoggerService.getActionLog(500, filterCategory);
      const stats = await actionLoggerService.getActionStatistics();
      setActionLogs(logs);
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCategory]);

  // Filtrar logs por tipo de ação (filtro local para performance)
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

  const clearLogs = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de ações no servidor?')) {
      await actionLoggerService.clearActionLog();
      toast.success('Histórico removido');
      fetchData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Histórico de Ações"
        actions={
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Histórico
          </button>
        }
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total de Ações</p>
          <p className="text-2xl font-black text-blue-600">{statistics.totalActions}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Dia Mais Ativo</p>
          <p className="text-2xl font-black text-green-600">
            {statistics.mostActiveDay
              ? format(parseISO(statistics.mostActiveDay), "dd/MM", { locale: ptBR })
              : '--'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ações em Produtos</p>
          <p className="text-2xl font-black text-indigo-600">{statistics.actionsByCategory['product'] || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ações em Vendas</p>
          <p className="text-2xl font-black text-orange-600">{statistics.actionsByCategory['transaction'] || 0}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl py-3 px-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Ação</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl py-3 px-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {actions.map((action) => (
                <option key={action.value} value={action.value}>{action.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de ações */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Carregando histórico do servidor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {format(parseISO(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                            {getCategoryIcon(log.category)}
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                            {log.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getActionColor(log.action)}`}>
                          {getActionText(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {log.description}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Calendar className="w-12 h-12 text-gray-300 mb-2" />
                        <h3 className="text-md font-bold text-gray-900 dark:text-white">Nenhuma ação encontrada</h3>
                        <p className="text-sm text-gray-500">Ajuste os filtros ou comece a operar o sistema.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLog;