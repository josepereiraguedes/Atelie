import React, { memo } from 'react';
import { Truck } from 'lucide-react';

interface SupplierPerformanceData {
  name: string;
  orders: number;
  onTimeRate: number;
}

interface SupplierPerformanceProps {
  suppliers: SupplierPerformanceData[];
}

const SupplierPerformance: React.FC<SupplierPerformanceProps> = memo(({ suppliers }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Desempenho dos Fornecedores
      </h3>
      <div className="space-y-4">
        {suppliers.map((supplier, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {supplier.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {supplier.orders} pedidos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {supplier.onTimeRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pontualidade
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SupplierPerformance;