import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface PriceComparisonData {
  marketplace: string;
  totalCost: number;
  suggestedPrice: number;
  grossProfit: number;
  actualProfitMargin: number;
  averagePaymentTerm: number;
}

interface PriceComparisonTableProps {
  comparisonData: PriceComparisonData[];
}

export const PriceComparisonTable: React.FC<PriceComparisonTableProps> = ({ comparisonData }) => {
  if (comparisonData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Nenhum dado de comparação disponível
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selecione um produto e marketplaces para ver a comparação
        </p>
      </div>
    );
  }

  // Encontrar o melhor preço (menor preço sugerido)
  const bestPrice = Math.min(...comparisonData.map(data => data.suggestedPrice));
  
  // Encontrar a melhor margem de lucro
  const bestMargin = Math.max(...comparisonData.map(data => data.actualProfitMargin));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Marketplace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Custo Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Preço Sugerido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lucro Bruto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Margem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recebimento
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {comparisonData.map((data, index) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  data.suggestedPrice === bestPrice ? 'bg-green-50 dark:bg-green-900/10' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {data.marketplace}
                        {data.suggestedPrice === bestPrice && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Melhor Preço
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  R$ {data.totalCost.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    R$ {data.suggestedPrice.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  R$ {data.grossProfit.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    data.actualProfitMargin === bestMargin
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {data.actualProfitMargin.toFixed(2)}%
                    {data.actualProfitMargin === bestMargin && (
                      <span className="ml-1">★</span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {data.averagePaymentTerm} dias
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

