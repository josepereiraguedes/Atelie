import React from 'react';
import PageHeader from '../components/common/PageHeader';
import { X } from 'lucide-react';

const KeyboardShortcutsHelp: React.FC = () => {
  const shortcuts = [
    { keys: 'Ctrl + N', description: 'Criar novo produto' },
    { keys: 'Ctrl + I', description: 'Ir para inventário' },
    { keys: 'Ctrl + C', description: 'Ir para clientes' },
    { keys: 'Ctrl + S', description: 'Ir para fornecedores' },
    { keys: 'Ctrl + V', description: 'Ir para vendas' },
    { keys: 'Ctrl + R', description: 'Ir para relatórios' },
    { keys: 'Ctrl + M', description: 'Ir para marketplaces' },
    { keys: 'Ctrl + D', description: 'Ir para dashboard' },
    { keys: 'Ctrl + L', description: 'Ir para histórico de ações' },
    { keys: 'Ctrl + ,', description: 'Ir para configurações' },
    { keys: 'Ctrl + K', description: 'Abrir ajuda de atalhos' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader 
        title="Atalhos de Teclado" 
      />
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Lista de atalhos de teclado disponíveis para aumentar sua produtividade
      </p>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Atalhos Disponíveis
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center">
                <kbd className="inline-flex items-center px-2 py-1 text-sm font-sans font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                  {shortcut.keys}
                </kbd>
                <span className="ml-3 text-sm text-gray-900 dark:text-white">
                  {shortcut.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Dica de Produtividade
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Memorize os atalhos mais utilizados para navegar rapidamente entre as seções do sistema.
                Os atalhos funcionam em qualquer parte do sistema, exceto quando estiver digitando em campos de texto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;