import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Activity, MousePointer, Clock, Database } from 'lucide-react';
import { useUserActionHistory } from '../../hooks/useUserActionHistory';

interface UsageStatsProps {
  className?: string;
}

const UsageStats: React.FC<UsageStatsProps> = ({ className = '' }) => {
  const { actions, loading } = useUserActionHistory();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Filtrar ações com base no intervalo de tempo
  const filteredActions = useMemo(() => {
    if (timeRange === 'all') return actions;
    
    const now = new Date();
    const startDate = new Date(now);
    
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    return actions.filter(action => new Date(action.timestamp) >= startDate);
  }, [actions, timeRange]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    // Total de ações
    const totalActions = filteredActions.length;
    
    // Ações por tipo
    const actionsByType: Record<string, number> = {};
    filteredActions.forEach(action => {
      actionsByType[action.action] = (actionsByType[action.action] || 0) + 1;
    });
    
    // Ações por dia
    const actionsByDay: Record<string, number> = {};
    filteredActions.forEach(action => {
      const date = new Date(action.timestamp).toISOString().split('T')[0];
      actionsByDay[date] = (actionsByDay[date] || 0) + 1;
    });
    
    // Média de ações por dia
    const daysWithActivity = Object.keys(actionsByDay).length;
    const avgActionsPerDay = daysWithActivity > 0 ? totalActions / daysWithActivity : 0;
    
    // Tipos de ações únicos
    const uniqueActionTypes = Object.keys(actionsByType).length;
    
    // Ação mais recente
    const lastAction = filteredActions.length > 0 ? filteredActions[0] : null;
    
    return {
      totalActions,
      actionsByType,
      avgActionsPerDay,
      uniqueActionTypes,
      lastAction
    };
  }, [filteredActions]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          Estatísticas de Uso
        </h3>
        
        <div className="flex space-x-1">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center">
            <Database className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total de Ações</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {stats.totalActions}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center">
            <MousePointer className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Tipos de Ações</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {stats.uniqueActionTypes}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-purple-500 mr-2" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Média por Dia</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {stats.avgActionsPerDay.toFixed(1)}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Última Ação</span>
          </div>
          <p className="text-xs text-gray-900 dark:text-white mt-1 truncate">
            {stats.lastAction 
              ? new Date(stats.lastAction.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Nenhuma'}
          </p>
        </div>
      </div>
      
      {/* Gráfico de barras simples */}
      <div className="mt-4">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ações por tipo:
        </h4>
        <div className="space-y-2">
          {Object.entries(stats.actionsByType)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => (
              <div key={type} className="flex items-center">
                <div className="w-20 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {type}
                </div>
                <div className="flex-1 ml-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / Math.max(...Object.values(stats.actionsByType))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-right text-xs text-gray-900 dark:text-white ml-2">
                  {count}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UsageStats;