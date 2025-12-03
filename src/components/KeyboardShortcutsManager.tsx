import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUserActionHistory } from '../hooks/useUserActionHistory';

/**
 * Componente para gerenciar os atalhos de teclado padrão do sistema
 * Deve ser usado dentro do contexto de um Router
 */
const KeyboardShortcutsManager: React.FC = () => {
  const navigate = useNavigate();
  const { registerShortcut } = useKeyboardShortcuts();
  const { recordAction } = useUserActionHistory();

  useEffect(() => {
    // Array de atalhos padrão
    const defaultShortcuts = [
      {
        id: 'new-product',
        key: 'n',
        ctrl: true,
        description: 'Novo produto',
        action: () => {
          navigate('/inventory/new');
          recordAction('navigation', 'Navegou para: Novo produto', { path: '/inventory/new' });
        }
      },
      {
        id: 'inventory',
        key: 'i',
        ctrl: true,
        description: 'Ir para inventário',
        action: () => {
          navigate('/inventory');
          recordAction('navigation', 'Navegou para: Inventário', { path: '/inventory' });
        }
      },
      {
        id: 'clients',
        key: 'c',
        ctrl: true,
        description: 'Ir para clientes',
        action: () => {
          navigate('/clients');
          recordAction('navigation', 'Navegou para: Clientes', { path: '/clients' });
        }
      },
      {
        id: 'suppliers',
        key: 's',
        ctrl: true,
        description: 'Ir para fornecedores',
        action: () => {
          navigate('/suppliers');
          recordAction('navigation', 'Navegou para: Fornecedores', { path: '/suppliers' });
        }
      },
      {
        id: 'sales',
        key: 'v',
        ctrl: true,
        description: 'Ir para vendas',
        action: () => {
          navigate('/sales');
          recordAction('navigation', 'Navegou para: Vendas', { path: '/sales' });
        }
      },
      {
        id: 'reports',
        key: 'r',
        ctrl: true,
        description: 'Ir para relatórios',
        action: () => {
          navigate('/reports');
          recordAction('navigation', 'Navegou para: Relatórios', { path: '/reports' });
        }
      },
      {
        id: 'marketplaces',
        key: 'm',
        ctrl: true,
        description: 'Ir para marketplaces',
        action: () => {
          navigate('/marketplace-settings');
          recordAction('navigation', 'Navegou para: Marketplaces', { path: '/marketplace-settings' });
        }
      },
      {
        id: 'dashboard',
        key: 'd',
        ctrl: true,
        description: 'Ir para dashboard',
        action: () => {
          navigate('/');
          recordAction('navigation', 'Navegou para: Dashboard', { path: '/' });
        }
      },
      {
        id: 'action-log',
        key: 'l',
        ctrl: true,
        description: 'Ir para histórico de ações',
        action: () => {
          navigate('/action-log');
          recordAction('navigation', 'Navegou para: Histórico de ações', { path: '/action-log' });
        }
      },
      {
        id: 'settings',
        key: ',',
        ctrl: true,
        description: 'Ir para configurações',
        action: () => {
          navigate('/settings');
          recordAction('navigation', 'Navegou para: Configurações', { path: '/settings' });
        }
      },
      {
        id: 'help',
        key: '/',
        ctrl: true,
        description: 'Abrir ajuda de atalhos',
        action: () => {
          // Esta ação pode ser implementada posteriormente para mostrar uma janela de ajuda
          console.log('Abrir ajuda de atalhos de teclado');
          recordAction('help', 'Abriu ajuda de atalhos de teclado');
        }
      }
    ];

    // Registrar todos os atalhos
    const cleanupFunctions = defaultShortcuts.map(shortcut => 
      registerShortcut(shortcut)
    );

    // Função de limpeza para remover os atalhos ao desmontar
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [navigate, registerShortcut, recordAction]);

  return null;
};

export default KeyboardShortcutsManager;