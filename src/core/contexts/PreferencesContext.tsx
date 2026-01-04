import React, { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '@/shared/hooks/useLocalStorage';

// Interface para as preferências do dashboard
export interface DashboardPreferences {
  visibleWidgets: string[];
  widgetOrder: string[];
  activeTab: 'overview' | 'pricing' | 'inventory';
}

// Interface para as preferências de notificações
export interface NotificationPreferences {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  soundNotifications: boolean;
  notificationVolume: number; // 0-100
}

// Interface para as preferências de exibição
export interface DisplayPreferences {
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  showTooltips: boolean;
}

// Interface para as preferências de atalhos
export interface ShortcutPreferences {
  enableShortcuts: boolean;
  customShortcuts: Record<string, string>; // key -> action
}

// Interface para as preferências gerais
export interface UserPreferences {
  dashboard: DashboardPreferences;
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US';
  notifications: NotificationPreferences; // Adicionar esta linha
  display: DisplayPreferences; // Adicionar esta linha
  shortcuts: ShortcutPreferences; // Adicionar esta linha
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
      'custom-cost-dashboard',
      'usage-stats'
    ],
    widgetOrder: [
      'stats-cards',
      'pricing-alerts',
      'low-stock-alerts',
      'category-stats',
      'marketplace-overview',
      'advanced-pricing-metrics',
      'custom-cost-dashboard',
      'usage-stats'
    ],
    activeTab: 'overview'
  },
  theme: 'system',
  language: 'pt-BR',
  notifications: { // Adicionar esta seção
    emailNotifications: true,
    desktopNotifications: true,
    soundNotifications: true,
    notificationVolume: 80
  },
  display: { // Adicionar esta seção
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    showTooltips: true
  },
  shortcuts: { // Adicionar esta seção
    enableShortcuts: true,
    customShortcuts: {}
  }
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
    
    // Aplicar preferências de exibição
    document.documentElement.style.fontSize = 
      preferences.display.fontSize === 'small' ? '14px' :
      preferences.display.fontSize === 'large' ? '18px' : '16px';
  }, [preferences.theme, preferences.display.fontSize]);

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
