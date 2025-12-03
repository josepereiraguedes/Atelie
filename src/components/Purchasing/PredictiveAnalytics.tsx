import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Package,
  ShoppingCart,
  BarChart3,
  LineChart
} from 'lucide-react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';

interface SalesForecast {
  product_id: number;
  product_name: string;
  current_stock: number;
  min_stock: number;
  avg_monthly_sales: number;
  forecast_30_days: number;
  forecast_60_days: number;
  forecast_90_days: number;
  days_until_reorder: number;
  suggested_order_quantity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_percentage: number;
}

interface SupplierPerformanceForecast {
  supplier_id: number;
  supplier_name: string;
  avg_delivery_time: number;
  expected_delivery_date: string;
  reliability_score: number;
  price_trend: 'increasing' | 'decreasing' | 'stable';
  price_change_percentage: number;
}

const PredictiveAnalytics: React.FC = () => {
  const { products, transactions, suppliers, purchaseOrders, purchaseOrderItems } = useLocalDatabase();

  // Calcular previsões de vendas
  const salesForecasts = useMemo(() => {
    const forecasts: SalesForecast[] = [];
    
    // Calcular vendas médias mensais por produto
    const productSales: Record<number, { 
      monthlyData: Record<string, number>; 
      totalQuantity: number; 
      months: number 
    }> = {};
    
    // Agrupar transações de venda por produto e mês
    transactions
      .filter(t => t.type === 'sale')
      .forEach(transaction => {
        const productId = transaction.product_id;
        if (!productId) return;
        
        const date = new Date(transaction.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            monthlyData: {},
            totalQuantity: 0,
            months: 0
          };
        }
        
        if (!productSales[productId].monthlyData[monthKey]) {
          productSales[productId].monthlyData[monthKey] = 0;
          productSales[productId].months += 1;
        }
        
        productSales[productId].monthlyData[monthKey] += transaction.quantity;
        productSales[productId].totalQuantity += transaction.quantity;
      });
    
    // Calcular previsões para cada produto
    Object.keys(productSales).forEach(productId => {
      const productIdNum = parseInt(productId);
      const product = products.find(p => p.id === productIdNum);
      if (!product) return;
      
      const salesData = productSales[productIdNum];
      const avgMonthlySales = salesData.months > 0 
        ? salesData.totalQuantity / salesData.months 
        : 0;
      
      // Calcular tendência (simplificada)
      const monthlyValues = Object.values(salesData.monthlyData);
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      let trendPercentage = 0;
      
      if (monthlyValues.length >= 2) {
        const firstHalf = monthlyValues.slice(0, Math.floor(monthlyValues.length / 2));
        const secondHalf = monthlyValues.slice(Math.floor(monthlyValues.length / 2));
        
        const avgFirst = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        trendPercentage = avgSecond > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
        
        if (trendPercentage > 5) {
          trend = 'increasing';
        } else if (trendPercentage < -5) {
          trend = 'decreasing';
        } else {
          trend = 'stable';
        }
      }
      
      // Calcular dias até reordenar
      const daysUntilReorder = avgMonthlySales > 0 
        ? (product.quantity - product.min_stock) / (avgMonthlySales / 30)
        : 0;
      
      // Calcular quantidade sugerida para pedir
      const suggestedOrderQuantity = Math.max(
        product.min_stock * 2 - product.quantity,
        avgMonthlySales * 1.5 // 1.5 meses de estoque
      );
      
      forecasts.push({
        product_id: productIdNum,
        product_name: product.name,
        current_stock: product.quantity,
        min_stock: product.min_stock,
        avg_monthly_sales: avgMonthlySales,
        forecast_30_days: avgMonthlySales,
        forecast_60_days: avgMonthlySales * 2,
        forecast_90_days: avgMonthlySales * 3,
        days_until_reorder: Math.max(0, Math.floor(daysUntilReorder)),
        suggested_order_quantity: Math.ceil(suggestedOrderQuantity),
        trend,
        trend_percentage: Math.abs(trendPercentage)
      });
    });
    
    return forecasts.sort((a, b) => a.days_until_reorder - b.days_until_reorder);
  }, [products, transactions]);

  // Calcular previsões de desempenho de fornecedores
  const supplierForecasts = useMemo(() => {
    const forecasts: SupplierPerformanceForecast[] = [];
    
    suppliers.forEach(supplier => {
      const supplierOrders = purchaseOrders.filter(order => order.supplier_id === supplier.id);
      
      if (supplierOrders.length > 0) {
        // Calcular tempo médio de entrega
        let totalDeliveryTime = 0;
        let completedOrders = 0;
        
        supplierOrders.forEach(order => {
          if (order.actual_delivery && order.order_date) {
            const orderDate = new Date(order.order_date);
            const deliveryDate = new Date(order.actual_delivery);
            const deliveryTime = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
            totalDeliveryTime += deliveryTime;
            completedOrders += 1;
          }
        });
        
        const avgDeliveryTime = completedOrders > 0 
          ? totalDeliveryTime / completedOrders 
          : 0;
        
        // Calcular data de entrega esperada (baseada no último pedido)
        const lastOrder = supplierOrders
          .filter(order => order.order_date)
          .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0];
        
        let expectedDeliveryDate = '';
        if (lastOrder && lastOrder.order_date) {
          const orderDate = new Date(lastOrder.order_date);
          orderDate.setDate(orderDate.getDate() + Math.floor(avgDeliveryTime));
          expectedDeliveryDate = orderDate.toISOString().split('T')[0];
        }
        
        // Calcular pontuação de confiabilidade
        const onTimeDeliveries = supplierOrders.filter(order => {
          if (order.expected_delivery && order.actual_delivery) {
            return new Date(order.actual_delivery) <= new Date(order.expected_delivery);
          }
          return true;
        }).length;
        
        const reliabilityScore = supplierOrders.length > 0 
          ? (onTimeDeliveries / supplierOrders.length) * 100 
          : 0;
        
        // Calcular tendência de preços (simplificada)
        let priceTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let priceChangePercentage = 0;
        
        // Agrupar itens de pedido por produto para análise de preços
        const supplierItems = purchaseOrderItems.filter(item => 
          supplierOrders.some(order => order.id === item.purchase_order_id)
        );
        
        if (supplierItems.length >= 2) {
          const firstHalf = supplierItems.slice(0, Math.floor(supplierItems.length / 2));
          const secondHalf = supplierItems.slice(Math.floor(supplierItems.length / 2));
          
          const avgFirst = firstHalf.reduce((sum, item) => sum + item.unit_cost, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((sum, item) => sum + item.unit_cost, 0) / secondHalf.length;
          
          priceChangePercentage = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
          
          if (priceChangePercentage > 3) {
            priceTrend = 'increasing';
          } else if (priceChangePercentage < -3) {
            priceTrend = 'decreasing';
          } else {
            priceTrend = 'stable';
          }
        }
        
        forecasts.push({
          supplier_id: supplier.id!,
          supplier_name: supplier.name,
          avg_delivery_time: Math.floor(avgDeliveryTime),
          expected_delivery_date: expectedDeliveryDate,
          reliability_score: Math.floor(reliabilityScore),
          price_trend: priceTrend,
          price_change_percentage: Math.abs(priceChangePercentage)
        });
      }
    });
    
    return forecasts.sort((a, b) => b.reliability_score - a.reliability_score);
  }, [suppliers, purchaseOrders, purchaseOrderItems]);

  // Produtos críticos (estoque baixo com previsão de venda)
  const criticalProducts = useMemo(() => {
    return salesForecasts
      .filter(forecast => 
        forecast.current_stock <= forecast.min_stock || 
        forecast.days_until_reorder <= 7
      )
      .slice(0, 5);
  }, [salesForecasts]);

  return (
    <div className="space-y-6">
      {/* Alertas Críticos */}
      {criticalProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
              Produtos Críticos - Reabastecimento Urgente
            </h3>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalProducts.map(product => (
              <div key={product.product_id} className="bg-white dark:bg-red-900/30 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-red-900 dark:text-red-100 text-sm">
                    {product.product_name}
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200">
                    {product.days_until_reorder} dias
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-red-700 dark:text-red-300">
                    Estoque: {product.current_stock}
                  </span>
                  <span className="font-medium text-red-900 dark:text-red-100">
                    Pedir: {product.suggested_order_quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previsões de Vendas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Previsão de Vendas e Necessidade de Reposição
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Produtos ordenados por tempo estimado até reabastecimento
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
                  Média Mensal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dias até Reordenar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sugerido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tendência
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salesForecasts.map((forecast) => (
                <tr key={forecast.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {forecast.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className={`w-4 h-4 mr-1 ${
                        forecast.current_stock <= forecast.min_stock 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${
                        forecast.current_stock <= forecast.min_stock 
                          ? 'text-red-600 dark:text-red-400 font-medium' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {forecast.current_stock} / {forecast.min_stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {forecast.avg_monthly_sales.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      30d: {forecast.forecast_30_days.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      <span className={`text-sm font-medium ${
                        forecast.days_until_reorder <= 7 
                          ? 'text-red-600 dark:text-red-400' 
                          : forecast.days_until_reorder <= 14 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {forecast.days_until_reorder} dias
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {forecast.suggested_order_quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {forecast.trend === 'increasing' ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : forecast.trend === 'decreasing' ? (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      ) : (
                        <div className="w-4 h-4 mr-1" />
                      )}
                      <span className={`text-sm ${
                        forecast.trend === 'increasing' 
                          ? 'text-green-600 dark:text-green-400' 
                          : forecast.trend === 'decreasing' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {forecast.trend_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Previsões de Fornecedores */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <LineChart className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Previsão de Desempenho de Fornecedores
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Entrega esperada e tendência de preços
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tempo Médio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entrega Esperada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Confiabilidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tendência de Preços
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {supplierForecasts.map((forecast) => (
                <tr key={forecast.supplier_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {forecast.supplier_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {forecast.avg_delivery_time} dias
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {forecast.expected_delivery_date || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {forecast.reliability_score >= 90 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : forecast.reliability_score >= 70 ? (
                        <div className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        forecast.reliability_score >= 90 
                          ? 'text-green-600 dark:text-green-400' 
                          : forecast.reliability_score >= 70 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {forecast.reliability_score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {forecast.price_trend === 'increasing' ? (
                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                      ) : forecast.price_trend === 'decreasing' ? (
                        <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <div className="w-4 h-4 mr-1" />
                      )}
                      <span className={`text-sm ${
                        forecast.price_trend === 'increasing' 
                          ? 'text-red-600 dark:text-red-400' 
                          : forecast.price_trend === 'decreasing' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {forecast.price_change_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;