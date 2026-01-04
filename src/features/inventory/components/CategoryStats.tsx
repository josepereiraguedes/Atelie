import React, { useMemo, memo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

interface CategoryStatsProps {
  className?: string;
}

const CategoryStats: React.FC<CategoryStatsProps> = memo(({ className = '' }) => {
  const { products } = useLocalDatabase();

  // Estatísticas por categoria
  const categoryStats = useMemo(() => {
    const stats: Record<string, { 
      productCount: number; 
      totalValue: number; 
      lowStockCount: number;
      totalQuantity: number;
    }> = {};

    products.forEach(product => {
      if (!stats[product.category]) {
        stats[product.category] = {
          productCount: 0,
          totalValue: 0,
          lowStockCount: 0,
          totalQuantity: 0
        };
      }

      stats[product.category].productCount += 1;
      stats[product.category].totalValue += (Number(product.quantity) || 0) * (Number(product.sale_price) || 0);
      stats[product.category].totalQuantity += Number(product.quantity) || 0;
      
      if (Number(product.quantity) <= Number(product.min_stock)) {
        stats[product.category].lowStockCount += 1;
      }
    });

    return stats;
  }, [products]);

  const sortedCategories = useMemo(() => {
    return Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.totalValue - a.totalValue)
      .slice(0, 5); // Mostrar apenas as 5 principais categorias
  }, [categoryStats]);

  if (sortedCategories.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Estatísticas por Categoria
      </h3>
      
      <div className="space-y-4">
        {sortedCategories.map(([category, stats]) => (
          <div key={category} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 pb-4 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stats.productCount} produto{stats.productCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  R$ {stats.totalValue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.totalQuantity} unidades
                </p>
              </div>
            </div>
            
            {stats.lowStockCount > 0 && (
              <div className="flex items-center mt-2 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                <span>{stats.lowStockCount} com estoque baixo</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total de categorias</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {Object.keys(categoryStats).length}
          </span>
        </div>
      </div>
    </div>
  );
});

export default CategoryStats;
