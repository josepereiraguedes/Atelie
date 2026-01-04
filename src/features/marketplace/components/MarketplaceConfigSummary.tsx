import React, { useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { ShoppingCart, TrendingUp, Clock } from 'lucide-react';

export const MarketplaceConfigSummary: React.FC = () => {
  const { marketplaceConfigs } = useLocalDatabase();
  
  // Calcular estatísticas dos marketplaces
  const stats = useMemo(() => {
    const totalMarketplaces = marketplaceConfigs.length;
    const averageCommission = marketplaceConfigs.reduce((sum, config) => sum + config.commission_rate, 0) / totalMarketplaces || 0;
    const averagePaymentTerm = marketplaceConfigs.reduce((sum, config) => sum + config.average_payment_term, 0) / totalMarketplaces || 0;
    const totalCustomCosts = marketplaceConfigs.reduce((sum, config) => 
      sum + (config.custom_costs?.length || 0), 0);
    
    return {
      totalMarketplaces,
      averageCommission: averageCommission.toFixed(2),
      averagePaymentTerm: averagePaymentTerm.toFixed(1),
      totalCustomCosts
    };
  }, [marketplaceConfigs]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Configuração de Marketplaces
        </h2>
        <ShoppingCart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalMarketplaces}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Comissão Média</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.averageCommission}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Recebimento Médio</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.averagePaymentTerm} dias
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Custos Personalizados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalCustomCosts}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Marketplaces Configurados
        </h3>
        <div className="flex flex-wrap gap-2">
          {marketplaceConfigs.slice(0, 8).map((config, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {config.name}
            </span>
          ))}
          {marketplaceConfigs.length > 8 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              +{marketplaceConfigs.length - 8}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

