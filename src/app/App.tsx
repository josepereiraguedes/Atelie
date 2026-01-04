import React from 'react';
import { AuthProvider } from '@/core/contexts/AuthContext';
import { LocalDatabaseProvider } from '@/core/contexts/LocalDatabaseContext';
import { ConfigProvider } from '@/core/contexts/ConfigContext';
import { ThemeProvider } from '@/core/contexts/ThemeContext';
import { NotificationProvider } from '@/core/contexts/NotificationContext';
import { PreferencesProvider } from '@/core/contexts/PreferencesContext';
import AppContent from './AppContent';

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <ThemeProvider>
          <NotificationProvider>
            <PreferencesProvider>
              <LocalDatabaseProvider>
                <AppContent />
              </LocalDatabaseProvider>
            </PreferencesProvider>
          </NotificationProvider>
        </ThemeProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;