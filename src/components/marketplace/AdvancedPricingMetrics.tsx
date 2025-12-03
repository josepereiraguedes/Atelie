import React from 'react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const AdvancedPricingMetrics: React.FC = () => {
  const { products, calculateAllMarketplacePricing, marketplaceConfigs } = useLocalDatabase();
  
  // Calcular métricas avançadas de precificação
  const metrics = React.useMemo(() => {
    if (products.length === 0) {
      return {
        avgMargin: 0,
        bestMarginMarketplace: '',
        worstMarginMarketplace: '',
        totalPotentialProfit: 0,
        avgPaymentTerm: 0,
        fastestPaymentMarketplace: '',
        mostProfitableProduct: '',
        leastProfitableProduct: ''
      };
    }
    
    // Calcular margens para todos os produtos em todos os marketplaces
    const allPricingData = products.flatMap(product => 
      calculateAllMarketplacePricing(product, 20)
    );
    
    // Margem média
    const avgMargin = allPricingData.reduce((sum, data) => sum + data.actualProfitMargin, 0) / allPricingData.length;
    
    // Marketplace com melhor margem
    const bestMarginData = [...allPricingData].sort((a, b) => b.actualProfitMargin - a.actualProfitMargin)[0];
    const bestMarginMarketplace = bestMarginData?.marketplace || '';
    
    // Marketplace com pior margem
    const worstMarginData = [...allPricingData].sort((a, b) => a.actualProfitMargin - b.actualProfitMargin)[0];
    const worstMarginMarketplace = worstMarginData?.marketplace || '';
    
    // Lucro potencial total
    const totalPotentialProfit = allPricingData.reduce((sum, data) => sum + data.grossProfit, 0);
    
    // Prazo médio de recebimento
    const avgPaymentTerm = marketplaceConfigs.reduce((sum, config) => sum + config.average_payment_term, 0) / marketplaceConfigs.length;
    
    // Marketplace com recebimento mais rápido
    const fastestPaymentMarketplaceData = [...marketplaceConfigs].sort((a, b) => a.average_payment_term - b.average_payment_term)[0];
    const fastestPaymentMarketplace = fastestPaymentMarketplaceData?.name || '';
    
    // Produto mais lucrativo
    const productProfits = products.map(product => {
      const productData = allPricingData.filter(data => data.productCost === product.cost);
      const totalProfit = productData.reduce((sum, data) => sum + data.grossProfit, 0);
      return { product, totalProfit };
    });
    
    const mostProfitableProductData = [...productProfits].sort((a, b) => b.totalProfit - a.totalProfit)[0];
    const mostProfitableProduct = mostProfitableProductData?.product.name || '';
    
    // Produto menos lucrativo
    const leastProfitableProductData = [...productProfits].sort((a, b) => a.totalProfit - b.totalProfit)[0];
    const leastProfitableProduct = leastProfitableProductData?.product.name || '';
    
    return {
      avgMargin,
      bestMarginMarketplace,
      worstMarginMarketplace,
      totalPotentialProfit,
      avgPaymentTerm,
      fastestPaymentMarketplace,
      mostProfitableProduct,
      leastProfitableProduct
    };
  }, [products, marketplaceConfigs, calculateAllMarketplacePricing]);
  
  // Determinar a tendência da margem média
  const marginTrend = metrics.avgMargin > 20 ? 'up' : metrics.avgMargin < 15 ? 'down' : 'neutral';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Métricas Avançadas de Precificação
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Margem Média */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Margem Média</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.avgMargin.toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center">
              {marginTrend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {marginTrend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
              {marginTrend === 'neutral' && <Minus className="w-5 h-5 text-gray-500" />}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Comparado à margem desejada de 20%
          </p>
        </div>
        
        {/* Lucro Potencial Total */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Lucro Potencial Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            R$ {metrics.totalPotentialProfit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Em todos os marketplaces
          </p>
        </div>
        
        {/* Melhor Marketplace */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">Melhor Margem</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {metrics.bestMarginMarketplace}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Recebimento mais rápido: {metrics.fastestPaymentMarketplace}
          </p>
        </div>
        
        {/* Pior Marketplace */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">Pior Margem</p>
          <p className="text-lg font-bold text-red-900 dark:text-red-100">
            {metrics.worstMarginMarketplace}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            Produto mais lucrativo: {metrics.mostProfitableProduct}
          </p>
        </div>
      </div>
      
      {/* Informações adicionais */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">Prazo Médio de Recebimento</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {metrics.avgPaymentTerm.toFixed(1)} dias
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Marketplace mais rápido: {metrics.fastestPaymentMarketplace}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-800 dark:text-purple-200">Produtos</p>
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-purple-700 dark:text-purple-300">Mais Lucrativo</p>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                {metrics.mostProfitableProduct}
              </p>
            </div>
            <div>
              <p className="text-xs text-purple-700 dark:text-purple-300">Menos Lucrativo</p>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                {metrics.leastProfitableProduct}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPricingMetrics;