import React, { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

// Interface para as preferências do dashboard
export interface DashboardPreferences {
  visibleWidgets: string[];
  widgetOrder: string[];
  activeTab: 'overview' | 'pricing' | 'inventory';
}

// Interface para as preferências gerais
export interface UserPreferences {
  dashboard: DashboardPreferences;
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US';
}

// Valores padrão para as preferências
const defaultPreferences: UserPreferences = {
  dashboard: {
    visibleWidgets: [
      'stats-cards',
      'pricing-alerts',
      'low-stock-alerts',
      'category-stats',
      'marketplace-overview',
      'advanced-pricing-metrics',
      'custom-cost-dashboard'
    ],
    widgetOrder: [
      'stats-cards',
      'pricing-alerts',
      'low-stock-alerts',
      'category-stats',
      'marketplace-overview',
      'advanced-pricing-metrics',
      'custom-cost-dashboard'
    ],
    activeTab: 'overview'
  },
  theme: 'system',
  language: 'pt-BR'
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>('user-preferences', defaultPreferences);

  // Efeito para aplicar o tema quando as preferências mudarem
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (preferences.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Para 'system', usar a preferência do sistema
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [preferences.theme]);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default PreferencesProvider;