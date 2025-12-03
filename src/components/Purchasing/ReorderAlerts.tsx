import React, { useMemo } from 'react';
import { ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';
import { Link } from 'react-router-dom';

interface ReorderSuggestion {
  product_id: number;
  product_name: string;
  current_stock: number;
  min_stock: number;
  supplier_name: string;
  supplier_id: number;
  last_purchase_price: number;
  suggested_quantity: number;
  estimated_cost: number;
}

const ReorderAlerts: React.FC = () => {
  const { products, suppliers } = useLocalDatabase();

  // Calcular sugestões de reabastecimento
  const reorderSuggestions = useMemo(() => {
    const suggestions: ReorderSuggestion[] = [];
    
    products.forEach(product => {
      if (product.id && product.quantity <= product.min_stock) {
        // Encontrar o fornecedor do produto
        const supplier = suppliers.find(s => 
          s.supplied_product_ids?.includes(product.id!)
        ) || suppliers.find(s => s.name === product.supplier);
        
        if (supplier) {
          // Calcular quantidade sugerida (3x o estoque mínimo)
          const suggestedQuantity = Math.max(
            product.min_stock * 3 - product.quantity,
            product.min_stock
          );
          
          // Estimar custo (usando custo atual ou 70% do preço de venda)
          const estimatedCost = product.cost > 0 
            ? product.cost * suggestedQuantity
            : (product.sale_price * 0.7) * suggestedQuantity;
          
          suggestions.push({
            product_id: product.id,
            product_name: product.name,
            current_stock: product.quantity,
            min_stock: product.min_stock,
            supplier_name: supplier.name,
            supplier_id: supplier.id!,
            last_purchase_price: product.cost,
            suggested_quantity: suggestedQuantity,
            estimated_cost: estimatedCost
          });
        }
      }
    });
    
    return suggestions.sort((a, b) => a.current_stock - b.current_stock);
  }, [products, suppliers]);

  if (reorderSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <ShoppingCart className="w-5 h-5 text-orange-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Alertas de Reabastecimento
          </h3>
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {reorderSuggestions.length} produtos
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Produtos abaixo do estoque mínimo recomendado
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
                Estoque
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fornecedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sugestão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Custo Estimado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {reorderSuggestions.map((suggestion) => (
              <tr key={suggestion.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {suggestion.product_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {suggestion.current_stock} un
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      (mín: {suggestion.min_stock})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {suggestion.supplier_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {suggestion.suggested_quantity} unidades
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    R$ {suggestion.estimated_cost.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/purchase-orders/new?supplier=${suggestion.supplier_id}&product=${suggestion.product_id}&quantity=${suggestion.suggested_quantity}`}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Comprar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReorderAlerts;