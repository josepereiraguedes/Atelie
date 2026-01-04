import React from 'react';
import { CustomCost } from '@/shared/types/database.types';

interface CustomCostBreakdownProps {
  customCosts: { name: string; cost: number }[];
  totalCustomCosts: number;
}

export const CustomCostBreakdown: React.FC<CustomCostBreakdownProps> = ({ 
  customCosts, 
  totalCustomCosts 
}) => {
  if (customCosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Custos Personalizados
      </h4>
      <div className="space-y-2">
        {customCosts.map((cost, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{cost.name}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              R$ {cost.cost.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-900 dark:text-white">Total Custos Personalizados</span>
          <span className="text-gray-900 dark:text-white">
            R$ {totalCustomCosts.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

