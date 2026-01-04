import React, { useMemo } from 'react';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';

interface ProductComparison {
  product_id: number;
  product_name: string;
  suppliers: {
    supplier_id: number;
    supplier_name: string;
    cost: number;
    last_purchase_date?: string;
  }[];
  best_price: number;
  price_difference: number;
  percentage_difference: number;
}

const SupplierComparison: React.FC = () => {
  const { suppliers, products, purchaseOrderItems } = useLocalDatabase();

  // Agrupar itens de pedidos por produto e fornecedor
  const productSupplierData = useMemo(() => {
    const data: Record<number, Record<number, { cost: number; date: string }[]>> = {};
    
    purchaseOrderItems.forEach(item => {
      // Encontrar o pedido para obter o fornecedor
      // Esta é uma simplificação - na prática, você precisaria vincular itens a pedidos
      if (item.product_id && item.unit_cost > 0) {
        if (!data[item.product_id]) {
          data[item.product_id] = {};
        }
        
        // Agrupar por fornecedor (simplificado)
        const supplierId = 1; // Placeholder - na prática, você precisaria vincular ao fornecedor correto
        if (!data[item.product_id][supplierId]) {
          data[item.product_id][supplierId] = [];
        }
        
        data[item.product_id][supplierId].push({
          cost: item.unit_cost,
          date: new Date().toISOString() // Placeholder
        });
      }
    });
    
    return data;
  }, [purchaseOrderItems]);

  // Calcular comparações de preços
  const productComparisons = useMemo(() => {
    const comparisons: ProductComparison[] = [];
    
    Object.keys(productSupplierData).forEach(productId => {
      const productIdNum = parseInt(productId);
      const product = products.find(p => p.id === productIdNum);
      
      if (product) {
        const supplierPrices: ProductComparison['suppliers'] = [];
        
        Object.keys(productSupplierData[productIdNum]).forEach(supplierId => {
          const supplierIdNum = parseInt(supplierId);
          const supplier = suppliers.find(s => s.id === supplierIdNum);
          const prices = productSupplierData[productIdNum][supplierIdNum];
          
          if (supplier && prices && prices.length > 0) {
            // Usar o último preço registrado
            const lastPrice = prices[prices.length - 1];
            supplierPrices.push({
              supplier_id: supplierIdNum,
              supplier_name: supplier.name,
              cost: lastPrice.cost,
              last_purchase_date: lastPrice.date
            });
          }
        });
        
        if (supplierPrices.length > 1) {
          // Ordenar por preço
          supplierPrices.sort((a, b) => a.cost - b.cost);
          
          const bestPrice = supplierPrices[0].cost;
          const worstPrice = supplierPrices[supplierPrices.length - 1].cost;
          const priceDifference = worstPrice - bestPrice;
          const percentageDifference = (priceDifference / bestPrice) * 100;
          
          comparisons.push({
            product_id: productIdNum,
            product_name: product.name,
            suppliers: supplierPrices,
            best_price: bestPrice,
            price_difference: priceDifference,
            percentage_difference: percentageDifference
          });
        }
      }
    });
    
    return comparisons.sort((a, b) => b.percentage_difference - a.percentage_difference);
  }, [productSupplierData, products, suppliers]);

  if (productComparisons.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <Package className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhuma comparação disponível
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Registre pedidos de compra com diferentes fornecedores para ver comparações de preços.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Comparação de Preços por Fornecedor
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Produtos com variação significativa de preços entre fornecedores
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Produto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Melhor Preço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Variação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fornecedores
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {productComparisons.map((comparison) => (
              <tr key={comparison.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {comparison.product_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    R$ {comparison.best_price.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {comparison.percentage_difference.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    R$ {comparison.price_difference.toFixed(2)} de diferença
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {comparison.suppliers.slice(0, 3).map((supplier) => (
                      <div 
                        key={supplier.supplier_id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {supplier.supplier_name}: R$ {supplier.cost.toFixed(2)}
                      </div>
                    ))}
                    {comparison.suppliers.length > 3 && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        +{comparison.suppliers.length - 3} mais
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierComparison;
