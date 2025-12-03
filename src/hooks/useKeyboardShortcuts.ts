import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar se o usuário está em um campo de input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      shortcuts.forEach(shortcut => {
        // Verificar se as teclas correspondem
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, navigate]);
};

// Atalhos padrão do sistema
export const useDefaultShortcuts = () => {
  const navigate = useNavigate();

  const defaultShortcuts: ShortcutConfig[] = [
    {
      key: 'n',
      ctrl: true,
      description: 'Novo produto',
      action: () => navigate('/inventory/new')
    },
    {
      key: 'i',
      ctrl: true,
      description: 'Ir para inventário',
      action: () => navigate('/inventory')
    },
    {
      key: 'c',
      ctrl: true,
      description: 'Ir para clientes',
      action: () => navigate('/clients')
    },
    {
      key: 's',
      ctrl: true,
      description: 'Ir para fornecedores',
      action: () => navigate('/suppliers')
    },
    {
      key: 'v',
      ctrl: true,
      description: 'Ir para vendas',
      action: () => navigate('/sales')
    },
    {
      key: 'r',
      ctrl: true,
      description: 'Ir para relatórios',
      action: () => navigate('/reports')
    },
    {
      key: 'm',
      ctrl: true,
      description: 'Ir para marketplaces',
      action: () => navigate('/marketplace-settings')
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Ir para dashboard',
      action: () => navigate('/')
    },
    {
      key: 'l',
      ctrl: true,
      description: 'Ir para histórico de ações',
      action: () => navigate('/action-log')
    },
    {
      key: ',',
      ctrl: true,
      description: 'Ir para configurações',
      action: () => navigate('/settings')
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Abrir ajuda de atalhos',
      action: () => {
        // Esta ação pode ser implementada posteriormente para mostrar uma janela de ajuda
        console.log('Ajuda de atalhos de teclado');
      }
    }
  ];

  useKeyboardShortcuts(defaultShortcuts);
};