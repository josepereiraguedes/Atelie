import React from 'react';
import { CustomCost } from '@/core/contexts/LocalDatabaseContext';
import { TrendingUp } from 'lucide-react';

interface CustomCostSummaryCardProps {
  customCosts: CustomCost[];
  totalCustomCosts: number;
}

export const CustomCostSummaryCard: React.FC<CustomCostSummaryCardProps> = ({ 
  customCosts, 
  totalCustomCosts 
}) => {
  if (customCosts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Custos Personalizados
        </h3>
        <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
      
      <div className="space-y-2">
        {customCosts.slice(0, 3).map((cost, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
              {cost.name}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {cost.type === 'fixed' 
                ? `R$ ${cost.value.toFixed(2)}` 
                : `${cost.value.toFixed(2)}%`}
            </span>
          </div>
        ))}
        
        {customCosts.length > 3 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            +{customCosts.length - 3} custos adicionais
          </div>
        )}
        
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-900 dark:text-white">Total</span>
          <span className="text-gray-900 dark:text-white">
            R$ {totalCustomCosts.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};


