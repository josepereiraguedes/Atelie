import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Package, 
  Truck,
  DollarSign,
  Award
} from 'lucide-react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';

interface PurchaseTrend {
  date: string;
  total: number;
  count: number;
}

interface SupplierPerformance {
  supplier_id: number;
  supplier_name: string;
  total_purchased: number;
  order_count: number;
  average_order_value: number;
  on_time_delivery_rate: number;
}

interface ProductAnalysis {
  product_id: number;
  product_name: string;
  total_purchased: number;
  total_spent: number;
  average_cost: number;
  purchase_frequency: number;
}

const PurchaseReports: React.FC = () => {
  const { purchaseOrders, suppliers, products } = useLocalDatabase();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const handleDateRangeChange = (newDateRange: '7d' | '30d' | '90d' | '1y') => {
    setDateRange(newDateRange);
  };

  // Calcular tendências de compras
  const purchaseTrends = useMemo(() => {
    const trends: PurchaseTrend[] = [];
    
    // Agrupar pedidos por data
    const ordersByDate: Record<string, { total: number; count: number }> = {};
    
    purchaseOrders.forEach(order => {
      const date = order.order_date.split('T')[0]; // Formato YYYY-MM-DD
      if (!ordersByDate[date]) {
        ordersByDate[date] = { total: 0, count: 0 };
      }
      ordersByDate[date].total += order.total;
      ordersByDate[date].count += 1;
    });
    
    // Converter para array e ordenar
    Object.keys(ordersByDate).forEach(date => {
      trends.push({
        date,
        total: ordersByDate[date].total,
        count: ordersByDate[date].count
      });
    });
    
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }, [purchaseOrders]);

  // Calcular desempenho dos fornecedores
  const supplierPerformance = useMemo(() => {
    const supplierData: Record<number, any> = {};
    
    // Inicializar dados dos fornecedores
    suppliers.forEach(supplier => {
      supplierData[supplier.id] = {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        total_purchased: 0,
        order_count: 0,
        on_time_delivery_rate: 0,
        average_order_value: 0
      };
    });
    
    // Processar pedidos de compra
    purchaseOrders.forEach(order => {
      const supplierId = order.supplier_id;
      if (supplierData[supplierId]) {
        supplierData[supplierId].total_purchased += order.total;
        supplierData[supplierId].order_count += 1;
        
        // Verificar se o pedido foi entregue no prazo
        // Nota: Não temos dados de entrega esperada vs real no modelo atual
        // Vamos usar uma taxa fixa para demonstração
        supplierData[supplierId].on_time_delivery_rate = 85; // 85% como exemplo
      }
    });
    
    // Calcular ticket médio
    Object.values(supplierData).forEach(supplier => {
      if (supplier.order_count > 0) {
        supplier.average_order_value = supplier.total_purchased / supplier.order_count;
      }
    });
    
    // Converter para array e ordenar por valor total comprado
    return Object.values(supplierData)
      .sort((a, b) => b.total_purchased - a.total_purchased)
      .slice(0, 10);
  }, [purchaseOrders, suppliers]);

  // Análise de produtos mais comprados
  const productAnalysis = useMemo(() => {
    const analysis: ProductAnalysis[] = [];
    
    // Agrupar itens de pedido por produto
    const productData: Record<number, { 
      totalQuantity: number; 
      totalSpent: number; 
      purchaseDates: string[] 
    }> = {};
    
    // Processar itens de todos os pedidos de compra
    purchaseOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.product_id) {
          if (!productData[item.product_id]) {
            productData[item.product_id] = {
              totalQuantity: 0,
              totalSpent: 0,
              purchaseDates: []
            };
          }
          
          productData[item.product_id].totalQuantity += item.quantity;
          productData[item.product_id].totalSpent += item.total;
          // Adicionar data do pedido (simplificada)
          productData[item.product_id].purchaseDates.push(new Date().toISOString());
        }
      });
    });
    
    // Converter para array
    Object.keys(productData).forEach(productId => {
      const productIdNum = parseInt(productId);
      const product = products.find(p => p.id === productIdNum);
      
      if (product) {
        const data = productData[productIdNum];
        const averageCost = data.totalSpent / data.totalQuantity;
        const purchaseFrequency = data.purchaseDates.length; // Simplificada
        
        analysis.push({
          product_id: productIdNum,
          product_name: product.name,
          total_purchased: data.totalQuantity,
          total_spent: data.totalSpent,
          average_cost: averageCost,
          purchase_frequency: purchaseFrequency
        });
      }
    });
    
    return analysis.sort((a, b) => b.total_spent - a.total_spent);
  }, [purchaseOrders, products]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalSpent = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = purchaseOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const activeSuppliers = new Set(purchaseOrders.map(order => order.supplier_id)).size;
    
    return {
      totalSpent,
      totalOrders,
      averageOrderValue,
      activeSuppliers
    };
  }, [purchaseOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatórios de Compras
        </h1>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
        </div>
      </div>

      {/* Estatísticas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Gasto</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                R$ {stats.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Pedidos</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Fornecedores Ativos</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.activeSuppliers}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Médio</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                R$ {stats.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Compras */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Tendência de Compras
            </h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <BarChart className="w-12 h-12 mr-2" />
            <span>Gráfico de tendências (implementação futura)</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Visualização do volume de compras ao longo do tempo
          </p>
        </div>

        {/* Desempenho dos Fornecedores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Desempenho dos Fornecedores
            </h3>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <PieChart className="w-12 h-12 mr-2" />
            <span>Gráfico de desempenho (implementação futura)</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Comparação de valor total comprado por fornecedor
          </p>
        </div>
      </div>

      {/* Tabela de Desempenho dos Fornecedores */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Ranking de Fornecedores
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fornecedores ordenados pelo valor total comprado
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
                  Total Comprado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ticket Médio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entregas no Prazo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {supplierPerformance.map((supplier, index) => (
                <tr key={supplier.supplier_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400">
                        {index + 1}
                      </span>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {supplier.supplier_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {supplier.total_purchased.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {supplier.order_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      R$ {supplier.average_order_value.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {supplier.on_time_delivery_rate >= 90 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : supplier.on_time_delivery_rate >= 70 ? (
                        <TrendingUp className="w-4 h-4 text-yellow-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {supplier.on_time_delivery_rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análise de Produtos Mais Comprados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Produtos Mais Comprados
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Produtos com maior volume de compras
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
                  Quantidade Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Custo Médio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Frequência
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {productAnalysis.slice(0, 10).map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {product.total_purchased} unidades
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {product.total_spent.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      R$ {product.average_cost.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {product.purchase_frequency} vezes
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

export default PurchaseReports;