import React from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';

interface CostComparisonChartProps {
  productId: number;
  marketplaceNames: string[];
}

export const CostComparisonChart: React.FC<CostComparisonChartProps> = ({ 
  productId, 
  marketplaceNames 
}) => {
  const { products, calculateMarketplacePricing } = useLocalDatabase();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return null;
  }
  
  // Calcular precificação para cada marketplace
  const pricingData = marketplaceNames.map(name => 
    calculateMarketplacePricing(product, name, 20)
  );
  
  // Encontrar os valores máximos para escala
  const maxTotalCost = Math.max(...pricingData.map(data => data.totalCost));
  const maxSuggestedPrice = Math.max(...pricingData.map(data => data.suggestedPrice));
  
  // Cores para cada marketplace
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
    'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Comparação de Custos entre Marketplaces
      </h2>
      
      {/* Informações do produto */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <div className="flex items-center">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">IMG</span>
            </div>
          )}
          <div className="ml-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Custo do Produto: R$ {product.cost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Gráfico de barras */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Custo Total por Marketplace
        </h3>
        <div className="space-y-4">
          {pricingData.map((data, index) => {
            const percentage = (data.totalCost / maxTotalCost) * 100;
            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.marketplace}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    R$ {data.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Gráfico de preços sugeridos */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Preço Sugerido por Marketplace
        </h3>
        <div className="space-y-4">
          {pricingData.map((data, index) => {
            const percentage = (data.suggestedPrice / maxSuggestedPrice) * 100;
            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.marketplace}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    R$ {data.suggestedPrice.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tabela detalhada */}
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Detalhamento de Custos
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Marketplace
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Custo Produto
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Taxa Fixa
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Impostos
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Operacional
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Envio
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Marketing
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Custos Personalizados
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Custo Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pricingData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {data.marketplace}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.productCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.commissionCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.fixedFee.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.taxCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.operationalCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.shippingCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.marketingCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {data.customCostsTotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    R$ {data.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


