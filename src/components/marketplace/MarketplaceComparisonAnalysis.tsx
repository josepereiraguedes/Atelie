import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MarketplaceComparisonData {
  marketplace: string;
  totalCost: number;
  suggestedPrice: number;
  grossProfit: number;
  actualProfitMargin: number;
  averagePaymentTerm: number;
}

interface MarketplaceComparisonAnalysisProps {
  comparisonData: MarketplaceComparisonData[];
}

const MarketplaceComparisonAnalysis: React.FC<MarketplaceComparisonAnalysisProps> = ({ 
  comparisonData 
}) => {
  if (comparisonData.length === 0) {
    return null;
  }

  // Encontrar o melhor e pior marketplace com base na margem de lucro
  const bestMarginMarketplace = [...comparisonData].sort((a, b) => b.actualProfitMargin - a.actualProfitMargin)[0];
  const worstMarginMarketplace = [...comparisonData].sort((a, b) => a.actualProfitMargin - b.actualProfitMargin)[0];
  
  // Encontrar o marketplace com melhor lucro bruto
  const bestProfitMarketplace = [...comparisonData].sort((a, b) => b.grossProfit - a.grossProfit)[0];
  
  // Encontrar o marketplace com menor prazo de recebimento
  const fastestPaymentMarketplace = [...comparisonData].sort((a, b) => a.averagePaymentTerm - b.averagePaymentTerm)[0];
  
  // Calcular médias
  const avgMargin = comparisonData.reduce((sum, data) => sum + data.actualProfitMargin, 0) / comparisonData.length;
  const avgProfit = comparisonData.reduce((sum, data) => sum + data.grossProfit, 0) / comparisonData.length;
  const avgPaymentTerm = comparisonData.reduce((sum, data) => sum + data.averagePaymentTerm, 0) / comparisonData.length;

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
        Análise Comparativa de Marketplaces
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Melhor Margem */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              Melhor Margem
            </h4>
          </div>
          <p className="text-lg font-bold text-green-800 dark:text-green-200">
            {bestMarginMarketplace.marketplace}
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            {bestMarginMarketplace.actualProfitMargin.toFixed(2)}%
          </p>
        </div>
        
        {/* Maior Lucro Bruto */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Maior Lucro Bruto
            </h4>
          </div>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {bestProfitMarketplace.marketplace}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            R$ {bestProfitMarketplace.grossProfit.toFixed(2)}
          </p>
        </div>
        
        {/* Recebimento Mais Rápido */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Recebimento Mais Rápido
            </h4>
          </div>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
            {fastestPaymentMarketplace.marketplace}
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {fastestPaymentMarketplace.averagePaymentTerm} dias
          </p>
        </div>
        
        {/* Pior Margem */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-2">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Pior Margem
            </h4>
          </div>
          <p className="text-lg font-bold text-red-800 dark:text-red-200">
            {worstMarginMarketplace.marketplace}
          </p>
          <p className="text-sm text-red-700 dark:text-red-300">
            {worstMarginMarketplace.actualProfitMargin.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Médias */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Médias dos Marketplaces
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Margem Média</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {avgMargin.toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Lucro Bruto Médio</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              R$ {avgProfit.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Prazo Médio de Recebimento</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {avgPaymentTerm.toFixed(1)} dias
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceComparisonAnalysis;