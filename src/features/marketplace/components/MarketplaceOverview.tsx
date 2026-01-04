import React from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { ShoppingCart, TrendingUp, Clock } from 'lucide-react';

export const MarketplaceOverview: React.FC = () => {
  const { marketplaceConfigs } = useLocalDatabase();
  
  // Calcular estatísticas gerais
  const totalMarketplaces = marketplaceConfigs.length;
  
  // Encontrar marketplace com maior comissão
  const highestCommission = [...marketplaceConfigs].sort((a, b) => b.commission_rate - a.commission_rate)[0];
  
  // Encontrar marketplace com menor prazo de recebimento
  const fastestPayment = [...marketplaceConfigs].sort((a, b) => a.average_payment_term - b.average_payment_term)[0];
  
  // Calcular médias
  const avgCommission = marketplaceConfigs.reduce((sum, config) => sum + config.commission_rate, 0) / totalMarketplaces;
  const avgPaymentTerm = marketplaceConfigs.reduce((sum, config) => sum + config.average_payment_term, 0) / totalMarketplaces;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Visão Geral dos Marketplaces
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Marketplaces */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Total de Marketplaces
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalMarketplaces}
              </p>
            </div>
          </div>
        </div>
        
        {/* Maior Comissão */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Maior Comissão
              </p>
              <p className="text-lg font-bold text-red-900 dark:text-red-100">
                {highestCommission?.name}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {highestCommission?.commission_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Recebimento Mais Rápido */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Recebimento Mais Rápido
              </p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">
                {fastestPayment?.name}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {fastestPayment?.average_payment_term} dias
              </p>
            </div>
          </div>
        </div>
        
        {/* Média de Comissão */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Média de Comissão
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {avgCommission.toFixed(1)}%
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Prazo médio: {avgPaymentTerm.toFixed(1)} dias
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de marketplaces */}
      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Marketplaces Configurados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {marketplaceConfigs.map((config) => (
            <div 
              key={config.name} 
              className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {config.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {config.commission_rate.toFixed(1)}% comissão
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


