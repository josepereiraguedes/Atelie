import React, { memo } from 'react';
import { Package } from 'lucide-react';

interface ProductSalesData {
  name: string;
  sales: number;
  revenue: number;
}

interface TopSellingProductsProps {
  products: ProductSalesData[];
}

const TopSellingProducts: React.FC<TopSellingProductsProps> = memo(({ products }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Produtos Mais Vendidos
      </h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.sales} unidades vendidas
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(product.revenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receita
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TopSellingProducts;