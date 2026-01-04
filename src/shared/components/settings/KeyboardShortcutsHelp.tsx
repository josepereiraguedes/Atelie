import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  const { getShortcuts } = useKeyboardShortcuts();
  const [shortcuts, setShortcuts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setShortcuts(getShortcuts());
    }
  }, [isOpen, getShortcuts]);

  if (!isOpen) return null;

  // Formatar atalho para exibição
  const formatShortcut = (shortcut: any) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atalhos de Teclado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {shortcuts.length > 0 ? (
            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div 
                  key={shortcut.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="text-sm text-gray-900 dark:text-white">
                    {shortcut.description}
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Keyboard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhum atalho registrado
              </p>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <Keyboard className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="mb-1"><strong>Dica:</strong></p>
                <p>Os atalhos podem ser habilitados ou desabilitados nas configurações avançadas do sistema.</p>
              </div>
            </div>
          </div>
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

export default KeyboardShortcutsHelp;
