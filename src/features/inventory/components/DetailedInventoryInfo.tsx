import React, { useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const DetailedInventoryInfo: React.FC = () => {
  const { products, lowStockAlerts } = useLocalDatabase();

  // Calcular estatísticas detalhadas do estoque
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, product) => sum + (Number(product.quantity) || 0), 0);
    const totalValue = products.reduce((sum, product) => 
      sum + ((Number(product.quantity) || 0) * (Number(product.cost) || 0)), 0
    );
    const totalSaleValue = products.reduce((sum, product) => 
      sum + ((Number(product.quantity) || 0) * (Number(product.sale_price) || 0)), 0
    );
    const avgCost = totalProducts > 0 ? totalValue / totalProducts : 0;
    const avgSalePrice = totalProducts > 0 ? totalSaleValue / totalProducts : 0;
    
    // Produtos com estoque baixo
    const lowStockCount = lowStockAlerts.length;
    
    // Produtos sem estoque
    const outOfStockCount = products.filter(p => Number(p.quantity) === 0).length;
    
    // Produtos com estoque adequado
    const adequateStockCount = totalProducts - lowStockCount - outOfStockCount;
    
    // Categorias
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean).length;
    
    // Subcategorias
    const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))].length;
    
    return {
      totalProducts,
      totalQuantity,
      totalValue,
      totalSaleValue,
      avgCost,
      avgSalePrice,
      lowStockCount,
      outOfStockCount,
      adequateStockCount,
      categories,
      subcategories
    };
  }, [products, lowStockAlerts]);

  // Agrupar produtos por categoria
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, typeof products> = {};
    
    products.forEach(product => {
      const category = product.category || 'Sem Categoria';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Estatísticas gerais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Estatísticas Gerais do Estoque
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total de Produtos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {inventoryStats.totalProducts}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Unidades em Estoque</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {inventoryStats.totalQuantity}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor Total (Custo)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              R$ {inventoryStats.totalValue.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor Total (Venda)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              R$ {inventoryStats.totalSaleValue.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Custo Médio</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              R$ {inventoryStats.avgCost.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Preço Médio de Venda</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              R$ {inventoryStats.avgSalePrice.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Baixo</p>
            </div>
            <p className="text-lg font-semibold text-red-800 dark:text-red-200">
              {inventoryStats.lowStockCount}
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sem Estoque</p>
            <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              {inventoryStats.outOfStockCount}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Adequado</p>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">
              {inventoryStats.adequateStockCount}
            </p>
          </div>
        </div>
      </div>
      
      {/* Informações por categoria */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Estoque por Categoria
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
            const categoryQuantity = categoryProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
            const categoryValue = categoryProducts.reduce((sum, p) => 
              sum + ((Number(p.quantity) || 0) * (Number(p.cost) || 0)), 0
            );
            const lowStockInCategory = categoryProducts.filter(p => 
              lowStockAlerts.some(alert => alert.id === p.id)
            ).length;
            
            return (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Produtos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {categoryProducts.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Unidades:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {categoryQuantity}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      R$ {categoryValue.toFixed(2)}
                    </span>
                  </div>
                  {lowStockInCategory > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600 dark:text-red-400">Estoque Baixo:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {lowStockInCategory}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Alertas de estoque baixo */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
              Produtos com Estoque Baixo
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockAlerts.map(product => (
              <div key={product.id} className="bg-white dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
                    </p>
                  </div>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="mt-3 flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Estoque Atual</p>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      {product.quantity} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Estoque Mínimo</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.min_stock} unidades
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedInventoryInfo;
