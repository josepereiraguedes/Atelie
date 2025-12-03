import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import { usePreferences } from '../contexts/PreferencesContext';
import DashboardPreferences from '../components/Dashboard/DashboardPreferences';
import StatsCards from '../components/Dashboard/StatsCards';
import LowStockAlerts from '../components/Dashboard/LowStockAlerts';
import SalesChart from '../components/Dashboard/SalesChart';
import TopSellingProducts from '../components/Dashboard/TopSellingProducts';
import SupplierPerformance from '../components/Dashboard/SupplierPerformance';
import { Settings, BarChart3, AlertTriangle, TrendingUp, ShoppingCart, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { products, transactions, clients, suppliers, purchaseOrders } = useLocalDatabase();
  const { preferences } = usePreferences();
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'inventory'>(preferences.dashboard.activeTab);

  // Calcular estatísticas para o StatsCards
  const statsCardsData = useMemo(() => {
    // Calcular receita total (vendas pagas)
    const salesTransactions = transactions.filter(t => t.type === 'sale' && t.payment_status === 'paid');
    const totalRevenue = salesTransactions.reduce((sum, t) => sum + t.total, 0);
    
    // Calcular custo total (produtos vendidos * custo unitário)
    let totalCost = 0;
    salesTransactions.forEach(transaction => {
      if (transaction.items) {
        transaction.items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            totalCost += item.quantity * product.cost;
          }
        });
      }
    });
    
    // Calcular lucro líquido
    const totalProfit = totalRevenue - totalCost;
    
    // Calcular margem de lucro
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Calcular valor total do estoque
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.quantity * product.cost), 0);
    
    // Calcular clientes ativos (compras nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeClients = clients.filter(client => {
      return transactions.some(transaction => 
        transaction.client_id === client.id && 
        new Date(transaction.created_at) > thirtyDaysAgo
      );
    }).length;
    
    // Calcular valor total de pedidos de compra
    const totalPurchaseValue = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Calcular alertas de estoque baixo
    const lowStockAlerts = products.filter(product => 
      product.min_stock !== undefined && 
      product.quantity <= product.min_stock
    ).length;
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalInventoryValue,
      totalClients: clients.length,
      activeClients,
      totalSuppliers: suppliers.length,
      totalPurchaseOrders: purchaseOrders.length,
      totalPurchaseValue,
      lowStockAlerts
    };
  }, [products, transactions, clients, suppliers, purchaseOrders]);

  // Obter produtos com estoque baixo para o LowStockAlerts
  const lowStockProducts = useMemo(() => {
    return products
      .filter(product => 
        product.min_stock !== undefined && 
        product.quantity <= product.min_stock
      )
      .map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        quantity: product.quantity,
        min_stock: product.min_stock!,
        image: product.image
      }))
      .slice(0, 5); // Limitar a 5 produtos para o dashboard
  }, [products]);

  // Preparar dados para o SalesChart
  const salesChartData = useMemo(() => {
    // Agrupar transações por mês
    const monthlyData: Record<string, { sales: number; purchases: number }> = {};
    
    // Processar vendas
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { sales: 0, purchases: 0 };
      }
      
      if (transaction.type === 'sale' && transaction.payment_status === 'paid') {
        monthlyData[monthKey].sales += transaction.total;
      } else if (transaction.type === 'purchase') {
        monthlyData[monthKey].purchases += transaction.total;
      }
    });
    
    // Converter para formato esperado pelo componente
    return Object.entries(monthlyData)
      .map(([date, values]) => ({
        date,
        sales: values.sales,
        purchases: values.purchases
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6); // Últimos 6 meses
  }, [transactions]);

  // Preparar dados para o TopSellingProducts
  const topSellingProductsData = useMemo(() => {
    // Calcular vendas por produto
    const productSales: Record<number, { name: string; sales: number; revenue: number }> = {};
    
    transactions
      .filter(t => t.type === 'sale' && t.payment_status === 'paid')
      .forEach(transaction => {
        if (transaction.items) {
          transaction.items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              if (!productSales[item.product_id]) {
                productSales[item.product_id] = {
                  name: product.name,
                  sales: 0,
                  revenue: 0
                };
              }
              productSales[item.product_id].sales += item.quantity;
              productSales[item.product_id].revenue += item.total;
            }
          });
        }
      });
    
    // Converter para formato esperado pelo componente e ordenar por vendas
    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5 produtos
  }, [transactions, products]);

  // Preparar dados para o SupplierPerformance
  const supplierPerformanceData = useMemo(() => {
    // Calcular desempenho dos fornecedores
    const supplierStats: Record<number, { name: string; orders: number; onTimeRate: number }> = {};
    
    purchaseOrders.forEach(order => {
      const supplier = suppliers.find(s => s.id === order.supplier_id);
      if (supplier) {
        if (!supplierStats[order.supplier_id!]) {
          supplierStats[order.supplier_id!] = {
            name: supplier.name,
            orders: 0,
            onTimeRate: 100 // Simplificação - assumindo 100% pontualidade
          };
        }
        supplierStats[order.supplier_id!].orders += 1;
      }
    });
    
    // Converter para formato esperado pelo componente e ordenar por pedidos
    return Object.values(supplierStats)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5); // Top 5 fornecedores
  }, [purchaseOrders, suppliers]);

  // Widgets disponíveis
  const widgets = {
    'stats-cards': {
      id: 'stats-cards',
      component: <StatsCards {...statsCardsData} />,
      icon: BarChart3,
      title: 'Estatísticas'
    },
    'low-stock-alerts': {
      id: 'low-stock-alerts',
      component: <LowStockAlerts products={lowStockProducts} />,
      icon: AlertTriangle,
      title: 'Estoque Baixo'
    },
    'sales-chart': {
      id: 'sales-chart',
      component: <SalesChart salesData={salesChartData} />,
      icon: TrendingUp,
      title: 'Vendas'
    },
    'top-selling-products': {
      id: 'top-selling-products',
      component: <TopSellingProducts products={topSellingProductsData} />,
      icon: ShoppingCart,
      title: 'Produtos Populares'
    },
    'supplier-performance': {
      id: 'supplier-performance',
      component: <SupplierPerformance suppliers={supplierPerformanceData} />,
      icon: Users,
      title: 'Fornecedores'
    }
  };

  // Aplicar classes CSS baseadas nas preferências
  const dashboardClasses = `
    ${preferences.display.compactMode ? 'space-y-3' : 'space-y-6'}
    ${preferences.display.animations ? 'transition-all duration-300' : ''}
  `.trim();

  return (
    <div className={dashboardClasses}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral do seu negócio
          </p>
        </div>
        
        <button
          onClick={() => setShowPreferences(true)}
          className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Preferências
        </button>
      </div>

      {/* Navegação por abas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pricing'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Precificação
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Estoque
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo do dashboard baseado na aba ativa e nas preferências */}
      <div className={`${preferences.display.compactMode ? 'space-y-3' : 'space-y-6'}`}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {preferences.dashboard.widgetOrder
              .filter(widgetId => preferences.dashboard.visibleWidgets.includes(widgetId))
              .map(widgetId => {
                const widget = widgets[widgetId as keyof typeof widgets];
                if (!widget) return null;
                
                // Somente mostrar widgets relevantes para a aba overview
                if (['stats-cards', 'low-stock-alerts', 'sales-chart', 'top-selling-products'].includes(widgetId)) {
                  return (
                    <div key={widgetId} className={`${preferences.display.compactMode ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800 rounded-lg shadow-sm`}>
                      {widget.component}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {preferences.dashboard.widgetOrder
              .filter(widgetId => preferences.dashboard.visibleWidgets.includes(widgetId))
              .map(widgetId => {
                const widget = widgets[widgetId as keyof typeof widgets];
                if (!widget) return null;
                
                // Somente mostrar widgets relevantes para a aba pricing
                if (['supplier-performance'].includes(widgetId)) {
                  return (
                    <div key={widgetId} className={`${preferences.display.compactMode ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800 rounded-lg shadow-sm`}>
                      {widget.component}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {preferences.dashboard.widgetOrder
              .filter(widgetId => preferences.dashboard.visibleWidgets.includes(widgetId))
              .map(widgetId => {
                const widget = widgets[widgetId as keyof typeof widgets];
                if (!widget) return null;
                
                // Somente mostrar widgets relevantes para a aba inventory
                if (['low-stock-alerts'].includes(widgetId)) {
                  return (
                    <div key={widgetId} className={`${preferences.display.compactMode ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800 rounded-lg shadow-sm`}>
                      {widget.component}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}
      </div>

      {/* Modal de preferências */}
      <DashboardPreferences 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
    </div>
  );
};

export default Dashboard;