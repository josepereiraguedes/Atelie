import React from 'react';
import { CustomCost } from '@/core/contexts/LocalDatabaseContext';

interface CustomCostCategorySummaryProps {
  customCosts: { name: string; cost: number; category?: string }[];
  totalCustomCosts: number;
  productCost: number;
}

export const CustomCostCategorySummary: React.FC<CustomCostCategorySummaryProps> = ({ 
  customCosts, 
  totalCustomCosts,
  productCost
}) => {
  // Agrupar custos por categoria
  const costsByCategory = customCosts.reduce((acc, cost) => {
    const category = cost.category || 'Sem Categoria';
    if (!acc[category]) {
      acc[category] = {
        costs: [],
        total: 0
      };
    }
    acc[category].costs.push(cost);
    acc[category].total += cost.cost;
    return acc;
  }, {} as Record<string, { costs: { name: string; cost: number; category?: string }[]; total: number }>);

  if (customCosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
        Resumo de Custos Personalizados por Categoria
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(costsByCategory).map(([category, data]) => (
          <div 
            key={category} 
            className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {category}
              </h4>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                R$ {data.total.toFixed(2)}
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              {data.costs.map((cost, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                    {cost.name}
                  </span>
                  <div className="flex items-center">
                    <span className="text-gray-900 dark:text-white mr-2">
                      R$ {cost.cost.toFixed(2)}
                    </span>
                    {productCost > 0 && (
                      <span className="text-gray-500 dark:text-gray-400">
                        ({((cost.cost / productCost) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-700 dark:text-gray-300">
                  Total da Categoria:
                </span>
                <span className="text-gray-900 dark:text-white">
                  R$ {data.total.toFixed(2)}
                </span>
              </div>
              {productCost > 0 && (
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>
                    Proporção do Custo do Produto:
                  </span>
                  <span>
                    {((data.total / productCost) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-900 dark:text-white">
            Total de Custos Personalizados
          </span>
          <span className="text-gray-900 dark:text-white">
            R$ {totalCustomCosts.toFixed(2)}
          </span>
        </div>
        {productCost > 0 && (
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>
              Proporção do Custo do Produto:
            </span>
            <span>
              {((totalCustomCosts / productCost) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


