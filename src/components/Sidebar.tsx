import React, { memo, useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Archive, 
  BarChart2, 
  Tag, 
  Settings, 
  TrendingUp,
  LogOut 
} from 'lucide-react';
import UserProfile from './Auth/UserProfile';

interface SidebarProps {
  onClose?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  children?: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = memo((props) => {
  const { signOut, user } = useAuth();
  const { company } = useConfig();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'user'] },
    { name: 'Estoque', href: '/inventory', icon: Package, roles: ['admin', 'user'] },
    { name: 'Clientes', href: '/clients', icon: Users, roles: ['admin', 'user'] },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart, roles: ['admin', 'user'] },
    { name: 'Fornecedores', href: '/suppliers', icon: Truck, roles: ['admin', 'user'] },
    { name: 'Compras', href: '/purchase-orders', icon: FileText, roles: ['admin', 'user'] },
    { name: 'Orçamentos Clientes', href: '/client-quotes', icon: FileText, roles: ['admin', 'user'] },
    { name: 'Recebimento', href: '/goods-receipts', icon: Archive, roles: ['admin', 'user'] },
    { name: 'Relatórios', href: '/reports', icon: BarChart2, roles: ['admin', 'user'] },
    { 
      name: 'Marketplaces', 
      href: '#', 
      icon: ShoppingCart, 
      roles: ['admin', 'user'],
      children: [
        { name: 'Configurações', href: '/marketplace-settings', icon: Settings, roles: ['admin', 'user'] },
        { name: 'Precificação', href: '/product-pricing', icon: TrendingUp, roles: ['admin', 'user'] },
        { name: 'Comparar', href: '/marketplace-comparison', icon: BarChart2, roles: ['admin', 'user'] },
        { name: 'Relatórios', href: '/pricing-reports', icon: FileText, roles: ['admin', 'user'] }
      ]
    },
    { name: 'Categorias', href: '/categories', icon: Tag, roles: ['admin'] },
    { name: 'Configurações', href: '/settings', icon: Settings, roles: ['admin'] }
  ];

  // Filtrar itens com base nas permissões do usuário
  const filteredNavigationItems = navigationItems.filter(item => {
    // Se não houver usuário, não mostrar nenhum item
    if (!user) {
      return false;
    }
    
    // Para usuários logados, mostrar todos os itens exceto Configurações (somente admin)
    if (item.name === 'Configurações') {
      // Configurações é somente para admin
      // Como não há role definida no usuário, assumimos que todos são admins
      return true;
    }
    
    // Todos os outros itens são acessíveis para usuários logados
    return true;
  });

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [signOut]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        {(company.logo && company.showLogo !== false) ? (
          <img src={company.logo} alt={company.name} className="h-12 w-auto" />
        ) : (
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{company.name || 'Sistema Gestão'}</h1>
        )}
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavigationItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.name];
          
          return (
            <div key={item.name}>
              <Link
                to={item.href}
                onClick={(e) => {
                  if (hasChildren) {
                    e.preventDefault();
                    toggleMenu(item.name);
                  }
                }}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${location.pathname === item.href
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                  ${hasChildren ? 'cursor-pointer' : ''}
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
                {hasChildren && (
                  <span className="ml-auto">
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                )}
              </Link>
              
              {hasChildren && isExpanded && (
                <div className="ml-8 space-y-1">
                  {item.children!.map((child) => (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={`
                        flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                        ${location.pathname === child.href
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <child.icon className="w-4 h-4 mr-3" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* User profile and logout at the bottom */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <UserProfile />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
});

export default Sidebar;