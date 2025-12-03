import React, { createContext, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * Interface representing company configuration settings
 */
interface CompanyConfig {
  /** Name of the company */
  name: string;
  /** Optional logo URL for the company */
  logo?: string;
  /** Whether to show logo instead of company name */
  showLogo?: boolean;
}

/**
 * Interface representing notification settings
 */
interface NotificationSettings {
  /** Enable/disable low stock alerts */
  lowStockAlerts: boolean;
  /** Enable/disable toast notifications for low stock */
  toastNotifications: boolean;
  /** Enable/disable dashboard alerts for low stock */
  dashboardAlerts: boolean;
}

/**
 * Context type for company configuration
 */
interface ConfigContextType {
  /** Current company configuration */
  company: CompanyConfig;
  /** Current notification settings */
  notifications: NotificationSettings;
  /** Function to update company configuration */
  updateCompany: (config: CompanyConfig) => void;
  /** Function to update notification settings */
  updateNotifications: (config: NotificationSettings) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

/**
 * Provider component for the company configuration context
 * Manages company configuration settings with localStorage persistence
 * @param children - Child components that will have access to the context
 */
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useLocalStorage<CompanyConfig>('company-config', { name: 'Minha Empresa' });

  const [notifications, setNotifications] = useLocalStorage<NotificationSettings>('notification-settings', { 
    lowStockAlerts: true, 
    toastNotifications: true, 
    dashboardAlerts: true 
  });

  /**
   * Update company configuration settings
   * @param config - New company configuration
   */
  const updateCompany = (config: CompanyConfig) => {
    setCompany(config);
  };

  /**
   * Update notification settings
   * @param config - New notification settings
   */
  const updateNotifications = (config: NotificationSettings) => {
    setNotifications(config);
  };

  return (
    <ConfigContext.Provider value={{ company, notifications, updateCompany, updateNotifications }}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Custom hook to use the company configuration context
 * @returns Config context with company settings and update function
 * @throws Error if used outside of ConfigProvider
 */
export const useConfig = () => {
  const context = React.useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export default ConfigProvider;