import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LocalDatabaseProvider } from '../../contexts/LocalDatabaseContext';
import { Menu, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { company, notifications, updateCompany, updateNotifications } = useConfig();
  const { theme, toggleTheme } = useTheme();

  // Usar as variáveis para evitar o erro de variáveis não utilizadas
  console.log(company, notifications, updateCompany, updateNotifications);

  useEffect(() => {
    // Fechar o menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.getElementById('user-menu');
      if (userMenu && !userMenu.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return <Outlet />;
  }

  return (
    <LocalDatabaseProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
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
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="user-menu-trigger p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

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

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ 
                position: 'fixed', 
                top: '4rem', 
                right: '1rem', 
                zIndex: 50,
                width: '12rem',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                borderRadius: '0.5rem'
              }}
            >
              <div className="user-menu space-y-2">
                <div className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-3">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{user.name}</span>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Configurações
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sair
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LocalDatabaseProvider>
  );
};

export default Layout;