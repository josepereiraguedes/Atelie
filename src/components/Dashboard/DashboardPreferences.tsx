import React, { useState } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { X, Save, Palette, Monitor, Bell, Keyboard } from 'lucide-react';
import AdvancedPreferences from '../AdvancedPreferences'; // Adicionar esta linha

interface DashboardPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardPreferences: React.FC<DashboardPreferencesProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<'widgets' | 'appearance' | 'advanced'>('widgets'); // Atualizar esta linha

  if (!isOpen) return null;

  // Widgets disponíveis
  const availableWidgets = [
    { id: 'stats-cards', name: 'Cartões de Estatísticas', description: 'Visão geral das métricas principais' },
    { id: 'pricing-alerts', name: 'Alertas de Precificação', description: 'Produtos com margem de lucro abaixo do mínimo' },
    { id: 'low-stock-alerts', name: 'Alertas de Estoque Baixo', description: 'Produtos com estoque abaixo do mínimo' },
    { id: 'category-stats', name: 'Estatísticas por Categoria', description: 'Distribuição de produtos por categoria' },
    { id: 'marketplace-overview', name: 'Visão Geral dos Marketplaces', description: 'Comparação de desempenho entre marketplaces' },
    { id: 'advanced-pricing-metrics', name: 'Métricas Avançadas de Precificação', description: 'Análise detalhada de custos e margens' },
    { id: 'custom-cost-dashboard', name: 'Dashboard de Custos Personalizados', description: 'Visualização de custos adicionais configurados' }
  ];

  const toggleWidgetVisibility = (widgetId: string) => {
    const isVisible = preferences.dashboard.visibleWidgets.includes(widgetId);
    const newVisibleWidgets = isVisible
      ? preferences.dashboard.visibleWidgets.filter(id => id !== widgetId)
      : [...preferences.dashboard.visibleWidgets, widgetId];
    
    updatePreferences({
      dashboard: {
        ...preferences.dashboard,
        visibleWidgets: newVisibleWidgets
      }
    });
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const currentIndex = preferences.dashboard.widgetOrder.indexOf(widgetId);
    if (currentIndex === -1) return;

    const newOrder = [...preferences.dashboard.widgetOrder];
    if (direction === 'up' && currentIndex > 0) {
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    }

    updatePreferences({
      dashboard: {
        ...preferences.dashboard,
        widgetOrder: newOrder
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preferências do Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação por abas */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('widgets')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'widgets'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Widgets
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'appearance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Palette className="w-4 h-4 mr-1.5" />
                Aparência
              </div>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Monitor className="w-4 h-4 mr-1.5" />
                Avançado
              </div>
            </button>
          </nav>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'widgets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {availableWidgets.map((widget) => {
                  const isVisible = preferences.dashboard.visibleWidgets.includes(widget.id);
                  const orderIndex = preferences.dashboard.widgetOrder.indexOf(widget.id);
                  
                  return (
                    <div 
                      key={widget.id}
                      className={`border rounded-lg p-3 transition-colors ${
                        isVisible 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                              {widget.name}
                            </h3>
                            {isVisible && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                                Visível
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                            {widget.description}
                          </p>
                          
                          {isVisible && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span>Posição: #{orderIndex + 1}</span>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={() => moveWidget(widget.id, 'up')}
                                  disabled={orderIndex === 0}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => moveWidget(widget.id, 'down')}
                                  disabled={orderIndex === preferences.dashboard.widgetOrder.length - 1}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => toggleWidgetVisibility(widget.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isVisible ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isVisible ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Tema */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                  Tema
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updatePreferences({ theme })}
                      className={`p-3 rounded-lg border transition-colors ${
                        preferences.theme === theme
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full mb-2 flex items-center justify-center">
                          {theme === 'light' && (
                            <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                          )}
                          {theme === 'dark' && (
                            <div className="w-6 h-6 bg-gray-800 rounded-full"></div>
                          )}
                          {theme === 'system' && (
                            <div className="relative w-6 h-6">
                              <div className="absolute top-0 left-0 w-3 h-6 bg-yellow-400 rounded-l-full"></div>
                              <div className="absolute bottom-0 right-0 w-3 h-6 bg-gray-800 rounded-r-full"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aba padrão */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                  Aba Padrão
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'overview', name: 'Visão Geral' },
                    { id: 'pricing', name: 'Precificação' },
                    { id: 'inventory', name: 'Estoque' }
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => updatePreferences({
                        dashboard: {
                          ...preferences.dashboard,
                          activeTab: tab.id
                        }
                      })}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        preferences.dashboard.activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <AdvancedPreferences />
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-medium rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreferences;