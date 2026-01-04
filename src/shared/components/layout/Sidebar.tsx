import React, { memo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfig } from '@/core/contexts/ConfigContext';
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  BarChart2,
  Tag,
  Settings,
  TrendingUp,
  Scan,
  Brain,
  Heart,
  ClipboardCheck,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import UserProfile from '@/features/auth/components/UserProfile';

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

const Sidebar: React.FC<SidebarProps> = memo(() => {
  const { company } = useConfig();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Estoque': true,
    'Clientes': true
  });

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'user'] },
    {
      name: 'Estoque',
      href: '/inventory',
      icon: Package,
      roles: ['admin', 'user'],
      children: [
        { name: 'Produtos', href: '/inventory', icon: Package, roles: ['admin', 'user'] },
        { name: 'Inteligência', href: '/intelligence', icon: Brain, roles: ['admin', 'user'] },
        { name: 'Gerar Etiquetas', href: '/labels', icon: Tag, roles: ['admin', 'user'] },
        { name: 'Auditoria de Estoque', href: '/inventory/audit', icon: ClipboardCheck, roles: ['admin', 'user'] },
        { name: 'Movimentações', href: '/inventory/movement-log', icon: FileText, roles: ['admin', 'user'] }
      ]
    },
    {
      name: 'Clientes',
      href: '/clients',
      icon: Users,
      roles: ['admin', 'user'],
      children: [
        { name: 'Lista de Clientes', href: '/clients', icon: Users, roles: ['admin', 'user'] },
        { name: 'Importar Leads', href: '/clients/import', icon: UserPlus, roles: ['admin', 'user'] },
        { name: 'Sucesso do Cliente', href: '/customer-success', icon: Heart, roles: ['admin', 'user'] }
      ]
    },
    { name: 'PDV (Caixa Rápido)', href: '/pos', icon: Scan, roles: ['admin', 'user'] },
    { name: 'Vendas', href: '/financial', icon: ShoppingCart, roles: ['admin', 'user'] },
    { name: 'Fornecedores', href: '/suppliers', icon: Truck, roles: ['admin', 'user'] },
    { name: 'Compras', href: '/purchase-orders', icon: FileText, roles: ['admin', 'user'] },
    { name: 'Relatórios', href: '/reports', icon: BarChart2, roles: ['admin', 'user'] },
    {
      name: 'Marketplaces',
      href: '#',
      icon: ShoppingCart,
      roles: ['admin', 'user'],
      children: [
        { name: 'Configurações', href: '/marketplace-settings', icon: Settings, roles: ['admin', 'user'] },
        { name: 'Precificação', href: '/product-pricing', icon: TrendingUp, roles: ['admin', 'user'] },
        { name: 'Relatórios', href: '/pricing-reports', icon: FileText, roles: ['admin', 'user'] }
      ]
    },
    { name: 'Categorias', href: '/categories', icon: Tag, roles: ['admin'] },
    { name: 'Configurações', href: '/settings', icon: Settings, roles: ['admin'] }
  ];

  const filteredNavigationItems = navigationItems;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 px-2 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none overflow-hidden">
          {company.logo && company.showLogo !== false ? (
            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-xl italic leading-none">
              {(company.name || 'A').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-gray-900 dark:text-white font-black tracking-tighter text-xl leading-none">
            {(company.name || 'Nome da Empresa').toUpperCase()}
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mt-0.5">Sistema de Gestão</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavigationItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.name];
          const isActive = location.pathname === item.href || (item.children?.some(c => location.pathname === c.href));

          return (
            <div key={item.name} className="mb-1">
              <Link
                to={hasChildren ? '#' : item.href}
                onClick={(e) => {
                  if (hasChildren) {
                    e.preventDefault();
                    toggleMenu(item.name);
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 text-sm font-bold rounded-2xl transition-all ${isActive
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 dark:shadow-none'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {hasChildren && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </Link>

              {hasChildren && isExpanded && (
                <div className="ml-4 mt-2 mb-4 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-4 animate-in slide-in-from-left duration-300">
                  {item.children!.map((child) => (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${location.pathname === child.href
                        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700'
                        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
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

      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <UserProfile />
      </div>
    </div>
  );
});

export default Sidebar;
