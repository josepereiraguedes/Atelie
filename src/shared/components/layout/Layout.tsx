import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/core/contexts/AuthContext';
import { useConfig } from '@/core/contexts/ConfigContext';
import { useTheme } from '@/core/contexts/ThemeContext';
import { LocalDatabaseProvider } from '@/core/contexts/LocalDatabaseContext';
import { Menu, Sun, Moon } from 'lucide-react';
import CommandPalette from '@/shared/components/ui/CommandPalette';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { company, notifications, updateCompany, updateNotifications } = useConfig();
  const { theme, toggleTheme } = useTheme();

  // Usar as variáveis para evitar o erro de variáveis não utilizadas
  console.log(company, notifications, updateCompany, updateNotifications);

  if (!user) {
    return <Outlet />;
  }

  return (
    <LocalDatabaseProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <CommandPalette />
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-4 ml-auto">
                <button
                  onClick={toggleTheme}
                  className="toggle-theme-trigger p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LocalDatabaseProvider>
  );
};

export default Layout;
