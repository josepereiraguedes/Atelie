import React from 'react';
import { CustomCost } from '../../contexts/LocalDatabaseContext';

interface CostBreakdownChartProps {
  productCost: number;
  commissionCost: number;
  fixedFee: number;
  taxCost: number;
  operationalCost: number;
  shippingCost: number;
  marketingCost: number;
  customCosts: { name: string; cost: number }[];
  customCostsTotal: number;
  totalCost: number;
}

const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ 
  productCost,
  commissionCost,
  fixedFee,
  taxCost,
  operationalCost,
  shippingCost,
  marketingCost,
  customCosts,
  customCostsTotal,
  totalCost
}) => {
  // Definir as categorias de custo
  const costCategories = [
    { name: 'Produto', value: productCost, color: 'bg-blue-500' },
    { name: 'Comissão', value: commissionCost, color: 'bg-green-500' },
    { name: 'Taxa Fixa', value: fixedFee, color: 'bg-yellow-500' },
    { name: 'Impostos', value: taxCost, color: 'bg-red-500' },
    { name: 'Operacional', value: operationalCost, color: 'bg-purple-500' },
    { name: 'Envio', value: shippingCost, color: 'bg-indigo-500' },
    { name: 'Marketing', value: marketingCost, color: 'bg-pink-500' },
    ...customCosts.map((cost, index) => ({
      name: cost.name,
      value: cost.cost,
      color: `bg-gray-${500 + (index % 3) * 100}`
    }))
  ];

  // Filtrar categorias com valor maior que zero
  const filteredCategories = costCategories.filter(category => category.value > 0);

  // Calcular porcentagens
  const categoriesWithPercentage = filteredCategories.map(category => ({
    ...category,
    percentage: totalCost > 0 ? (category.value / totalCost) * 100 : 0
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Distribuição de Custos
      </h3>
      
      <div className="space-y-3">
        {categoriesWithPercentage.map((category, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-xs text-gray-600 dark:text-gray-400 truncate">
              {category.name}
            </div>
            <div className="flex-1 ml-2">
              <div className="flex items-center">
                <div 
                  className={`h-2 ${category.color} rounded-full`}
                  style={{ width: `${Math.min(100, category.percentage)}%` }}
                ></div>
                <div className="ml-2 text-xs font-medium text-gray-900 dark:text-white min-w-[40px]">
                  {category.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Custo Total</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            R$ {totalCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdownChart;