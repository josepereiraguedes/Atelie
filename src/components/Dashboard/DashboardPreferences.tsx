import React, { useState } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Settings, Eye, EyeOff, Move, RotateCcw } from 'lucide-react';

interface WidgetOption {
  id: string;
  title: string;
  description: string;
}

const widgetOptions: WidgetOption[] = [
  {
    id: 'stats-cards',
    title: 'Cards de Estatísticas',
    description: 'Mostra os cards com estatísticas principais'
  },
  {
    id: 'pricing-alerts',
    title: 'Alertas de Precificação',
    description: 'Alertas sobre oportunidades de precificação'
  },
  {
    id: 'low-stock-alerts',
    title: 'Alertas de Estoque Baixo',
    description: 'Produtos com estoque abaixo do mínimo'
  },
  {
    id: 'category-stats',
    title: 'Estatísticas por Categoria',
    description: 'Visão detalhada por categorias de produtos'
  },
  {
    id: 'marketplace-overview',
    title: 'Visão Geral dos Marketplaces',
    description: 'Resumo do desempenho nos marketplaces'
  },
  {
    id: 'advanced-pricing-metrics',
    title: 'Métricas Avançadas de Precificação',
    description: 'Análise detalhada de precificação'
  },
  {
    id: 'custom-cost-dashboard',
    title: 'Custos Personalizados',
    description: 'Resumo de custos personalizados'
  }
];

const DashboardPreferences: React.FC = () => {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [isEditing, setIsEditing] = useState(false);

  const toggleWidgetVisibility = (widgetId: string) => {
    const visibleWidgets = [...preferences.dashboard.visibleWidgets];
    const index = visibleWidgets.indexOf(widgetId);
    
    if (index > -1) {
      // Remover widget
      visibleWidgets.splice(index, 1);
    } else {
      // Adicionar widget
      visibleWidgets.push(widgetId);
    }
    
    updatePreferences({
      dashboard: {
        ...preferences.dashboard,
        visibleWidgets
      }
    });
  };

  const resetToDefaults = () => {
    if (window.confirm('Tem certeza que deseja resetar todas as preferências do dashboard?')) {
      resetPreferences();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Preferências do Dashboard
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isEditing ? 'Concluir' : 'Editar Widgets'}
          </button>
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Resetar
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione quais widgets você deseja ver no dashboard:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {widgetOptions.map((widget) => (
              <div 
                key={widget.id}
                className={`p-3 rounded-lg border transition-colors ${
                  preferences.dashboard.visibleWidgets.includes(widget.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <button
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className="flex-shrink-0 mt-0.5 mr-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {preferences.dashboard.visibleWidgets.includes(widget.id) ? (
                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {widget.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {widget.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Widgets visíveis:</span>
          {preferences.dashboard.visibleWidgets.map((widgetId) => {
            const widget = widgetOptions.find(w => w.id === widgetId);
            return widget ? (
              <span 
                key={widgetId}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {widget.title}
              </span>
            ) : null;
          })}
          {preferences.dashboard.visibleWidgets.length === 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 italic">
              Nenhum widget selecionado
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPreferences;