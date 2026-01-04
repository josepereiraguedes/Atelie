import React, { memo } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';

interface LowStockAlertsProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = memo(({ 
  limit = 5, 
  showTitle = true,
  className = ''
}) => {
  const { lowStockAlerts } = useLocalDatabase();
  
  if (lowStockAlerts.length === 0) return null;
  
  const alertsToShow = limit ? lowStockAlerts.slice(0, limit) : lowStockAlerts;

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center mb-3">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
          <h3 className="font-medium text-red-800 dark:text-red-200">
            Alerta de Estoque Baixo
          </h3>
        </div>
      )}
      
      <div className="space-y-2">
        {alertsToShow.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-2 bg-white dark:bg-red-900/30 rounded-lg">
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
        
        {limit && lowStockAlerts.length > limit && (
          <div className="text-center pt-2">
            <p className="text-xs text-red-700 dark:text-red-300">
              + {lowStockAlerts.length - limit} produtos com estoque baixo
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default LowStockAlerts;
