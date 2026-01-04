import React, { memo } from 'react';
import { AlertTriangle, Package } from 'lucide-react';

interface LowStockProduct {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  quantity: number;
  min_stock: number;
  image?: string;
}

interface LowStockAlertsProps {
  products: LowStockProduct[];
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = memo(({ products }) => {
  if (products.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Alertas de Estoque Baixo
        </h3>
        <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
      </div>
      <div className="space-y-3">
        {products.slice(0, 5).map((product) => (
          <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded-md mr-3" />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md mr-3 flex items-center justify-center">
                  <Package size={16} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {product.quantity} unid.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                mín: {product.min_stock}
              </p>
            </div>
          </div>
        ))}
        
        {products.length > 5 && (
          <div className="text-center pt-2">
            <p className="text-xs text-red-700 dark:text-red-300">
              + {products.length - 5} produtos com estoque baixo
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default LowStockAlerts;