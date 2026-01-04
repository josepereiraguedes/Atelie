import React, { useState, useEffect } from 'react';
import { usePreferences } from '@/core/contexts/PreferencesContext';
import { Bell, Monitor, Keyboard, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdvancedPreferences: React.FC = () => {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Atualizar preferências locais quando as preferências globais mudarem
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(localPreferences);
    toast.success('Preferências salvas com sucesso!');
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja redefinir todas as preferências para os valores padrão?')) {
      resetPreferences();
      toast.success('Preferências redefinidas para os valores padrão!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção de Notificações */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Notificações
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Notificações por e-mail
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receber notificações importantes por e-mail
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications.emailNotifications}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    emailNotifications: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Notificações na área de trabalho
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrar notificações pop-up no sistema
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications.desktopNotifications}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    desktopNotifications: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Sons de notificação
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reproduzir sons para notificações
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications.soundNotifications}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    soundNotifications: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Volume das notificações: {localPreferences.notifications.notificationVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localPreferences.notifications.notificationVolume}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                notifications: {
                  ...prev.notifications,
                  notificationVolume: parseInt(e.target.value)
                }
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>
      </div>
      
      {/* Seção de Exibição */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Exibição
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Tamanho da fonte
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setLocalPreferences(prev => ({
                    ...prev,
                    display: {
                      ...prev.display,
                      fontSize: size
                    }
                  }))}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    localPreferences.display.fontSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Modo compacto
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Interface mais compacta com menos espaçamento
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.display.compactMode}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    compactMode: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Animações
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ativar animações e transições na interface
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.display.animations}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    animations: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Dicas de ferramentas
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrar dicas ao passar o mouse sobre elementos
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.display.showTooltips}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    showTooltips: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Seção de Atalhos */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Atalhos de Teclado
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Ativar atalhos de teclado
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permitir uso de atalhos de teclado para navegação rápida
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.shortcuts.enableShortcuts}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  shortcuts: {
                    ...prev.shortcuts,
                    enableShortcuts: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {localPreferences.shortcuts.enableShortcuts && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Dica:</strong> Pressione Ctrl + / para ver todos os atalhos disponíveis
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Salvar Preferências
        </button>
        
        <button
          onClick={handleReset}
          className="inline-flex items-center px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-medium rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Redefinir
        </button>
      </div>
    </div>
  );
};

export default AdvancedPreferences;
