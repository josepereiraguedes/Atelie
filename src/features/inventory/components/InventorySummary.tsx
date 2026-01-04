import React, { useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';

interface InventorySummaryProps {
  className?: string;
}

const InventorySummary: React.FC<InventorySummaryProps> = ({ className = '' }) => {
  const { products, lowStockAlerts } = useLocalDatabase();

  // Calcular estatísticas gerais do estoque
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, product) => sum + (Number(product.quantity) || 0), 0);
    const totalValue = products.reduce((sum, product) => 
      sum + ((Number(product.quantity) || 0) * (Number(product.sale_price) || 0)), 0
    );
    const avgValuePerProduct = totalProducts > 0 ? totalValue / totalProducts : 0;
    
    return {
      totalProducts,
      totalQuantity,
      totalValue,
      avgValuePerProduct
    };
  }, [products, lowStockAlerts]);

  // Cards individuais para cada informação
  const productCard = useMemo(() => ({
    title: 'Produtos',
    value: inventoryStats.totalProducts,
    icon: Package,
    color: 'blue',
    subtitle: 'Itens no estoque'
  }), [inventoryStats.totalProducts]);

  const quantityCard = useMemo(() => ({
    title: 'Quantidade',
    value: inventoryStats.totalQuantity,
    icon: Package,
    color: 'green',
    subtitle: 'Unidades disponíveis'
  }), [inventoryStats.totalQuantity]);

  const totalValueCard = useMemo(() => ({
    title: 'Valor Total',
    value: `R$ ${inventoryStats.totalValue.toFixed(2)}`,
    icon: TrendingUp,
    color: 'purple',
    subtitle: 'Valor em estoque'
  }), [inventoryStats.totalValue]);

  const averageCard = useMemo(() => ({
    title: 'Média',
    value: `R$ ${inventoryStats.avgValuePerProduct.toFixed(2)}`,
    icon: TrendingDown,
    color: 'orange',
    subtitle: 'Por produto'
  }), [inventoryStats.avgValuePerProduct]);

  return (
    <div className={className}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Resumo do Estoque
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card Produtos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {productCard.title}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {productCard.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {productCard.subtitle}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <productCard.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card Quantidade */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {quantityCard.title}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {quantityCard.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {quantityCard.subtitle}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <quantityCard.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Card Valor Total */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalValueCard.title}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {totalValueCard.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {totalValueCard.subtitle}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <totalValueCard.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Card Média */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {averageCard.title}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {averageCard.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {averageCard.subtitle}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <averageCard.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;
