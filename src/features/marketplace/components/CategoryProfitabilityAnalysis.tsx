import React from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const CategoryProfitabilityAnalysis: React.FC = () => {
  const { products, categories, calculateAllMarketplacePricing } = useLocalDatabase();
  
  // Calcular a rentabilidade por categoria
  const categoryProfitability = React.useMemo(() => {
    // Agrupar produtos por categoria
    const productsByCategory = products.reduce((acc, product) => {
      const category = product.category || 'Sem Categoria';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, typeof products>);
    
    // Calcular métricas para cada categoria
    return Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => {
      // Calcular precificação para todos os produtos da categoria
      const allPricingData = categoryProducts.flatMap(product => 
        calculateAllMarketplacePricing(product, 20)
      );
      
      // Calcular métricas agregadas
      const totalProducts = categoryProducts.length;
      const avgProductCost = categoryProducts.reduce((sum, p) => sum + p.cost, 0) / totalProducts;
      const avgMargin = allPricingData.reduce((sum, data) => sum + data.actualProfitMargin, 0) / allPricingData.length;
      const totalPotentialProfit = allPricingData.reduce((sum, data) => sum + data.grossProfit, 0);
      const avgSuggestedPrice = allPricingData.reduce((sum, data) => sum + data.suggestedPrice, 0) / allPricingData.length;
      
      // Encontrar o produto mais lucrativo
      const mostProfitableProduct = [...categoryProducts].sort((a, b) => {
        const aPricing = calculateAllMarketplacePricing(a, 20);
        const bPricing = calculateAllMarketplacePricing(b, 20);
        const aProfit = aPricing.reduce((sum, data) => sum + data.grossProfit, 0);
        const bProfit = bPricing.reduce((sum, data) => sum + data.grossProfit, 0);
        return bProfit - aProfit;
      })[0];
      
      return {
        categoryName,
        totalProducts,
        avgProductCost,
        avgMargin,
        totalPotentialProfit,
        avgSuggestedPrice,
        mostProfitableProduct: mostProfitableProduct?.name || ''
      };
    });
  }, [products]);
  
  // Ordenar categorias por margem média
  const sortedCategories = [...categoryProfitability].sort((a, b) => b.avgMargin - a.avgMargin);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Análise de Rentabilidade por Categoria
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Produtos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Custo Médio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Preço Sugerido Médio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Margem Média
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lucro Potencial Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Produto Mais Lucrativo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedCategories.map((category, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {category.categoryName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {category.totalProducts}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  R$ {category.avgProductCost.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  R$ {category.avgSuggestedPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      category.avgMargin >= 20 
                        ? 'text-green-600 dark:text-green-400' 
                        : category.avgMargin >= 10 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {category.avgMargin.toFixed(1)}%
                    </span>
                    {index === 0 && (
                      <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                    )}
                    {index === sortedCategories.length - 1 && (
                      <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  R$ {category.totalPotentialProfit.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {category.mostProfitableProduct}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma categoria encontrada
          </p>
        </div>
      )}
      
      {/* Resumo */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Resumo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Categoria Mais Rentável</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {sortedCategories[0]?.categoryName || 'N/A'}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Margem: {sortedCategories[0]?.avgMargin.toFixed(1) || '0'}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Categoria Menos Rentável</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {sortedCategories[sortedCategories.length - 1]?.categoryName || 'N/A'}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Margem: {sortedCategories[sortedCategories.length - 1]?.avgMargin.toFixed(1) || '0'}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Média Geral de Margem</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {(
                sortedCategories.reduce((sum, cat) => sum + cat.avgMargin, 0) / 
                sortedCategories.length || 0
              ).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


