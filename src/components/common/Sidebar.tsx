import React, { useState, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = memo(({
  items,
  collapsed = false,
  onCollapseChange,
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const renderItems = (items: SidebarItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.id}>
        <div
          className={`flex items-center justify-between px-4 py-3 text-sm font-medium ${
            item.active
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          } ${level > 0 ? 'pl-' + (level * 4) : ''}`}
        >
          <div className="flex items-center">
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {!collapsed && <span>{item.label}</span>}
          </div>
          
          {!collapsed && item.children && item.children.length > 0 && (
            <button
              onClick={() => toggleItem(item.id)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {expandedItems[item.id] ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          {!collapsed && item.badge && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {item.badge}
            </span>
          )}
        </div>
        
        {!collapsed && item.children && expandedItems[item.id] && (
          <div className="bg-gray-50 dark:bg-gray-800">
            {renderItems(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Menu
          </h2>
        )}
        <button
          onClick={() => onCollapseChange?.(!collapsed)}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {renderItems(items)}
      </div>
    </div>
  );
});

export default Sidebar;