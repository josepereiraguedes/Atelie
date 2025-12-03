import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LocalDatabaseProvider } from './contexts/LocalDatabaseContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
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