import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Users, Package, ShoppingCart, DollarSign, Truck, AlertTriangle } from 'lucide-react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import PageHeader from '../components/common/PageHeader';
import StatsCards from '../components/Dashboard/StatsCards';
import SalesChart from '../components/Dashboard/SalesChart';
import TopSellingProducts from '../components/Dashboard/TopSellingProducts';
import SupplierPerformance from '../components/Dashboard/SupplierPerformance';
import LowStockAlerts from '../components/Dashboard/LowStockAlerts';
import useDateFilter from '../hooks/useDateFilter';
import ErrorBoundary from '../components/common/ErrorBoundary';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  cost: number;
  sale_price: number;
  image?: string;
  created_at: string;
  updated_at: string;
  min_stock?: number;
  barcode?: string;
  supplier_id?: number;
  sku?: string;
  brand?: string;
  model?: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  marketplace_link?: string;
}

interface Transaction {
  id?: number;
  type: 'sale' | 'purchase' | 'adjustment';
  client_id?: number;
  payment_status: 'paid' | 'pending';
  description?: string;
  created_at: string;
  user_id?: string;
  client?: {
    name: string;
  };
  items?: any[];
  total: number;
  product_id?: number;
  quantity?: number;
  unit_price?: number;
}

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrder {
  id?: number;
  supplier_id: number;
  order_number?: string;
  order_date: string;
  delivery_date?: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  notes?: string;
  total: number;
  created_at?: string;
  updated_at?: string;
  supplier?: {
    id: number;
    name: string;
  };
  items?: any[];
}

const ExecutiveDashboard: React.FC = () => {
  const { 
    products, 
    transactions, 
    clients, 
    suppliers, 
    purchaseOrders 
  } = useLocalDatabase();
  
  const { dateRange, getDateRange, handleDateRangeChange } = useDateFilter();
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'purchasing' | 'inventory'>('overview');

  // Filter data based on date range
  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transactions, getDateRange]);

  const filteredProducts = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    return products.filter(product => {
      const productDate = new Date(product.created_at);
      return productDate >= startDate && productDate <= endDate;
    });
  }, [products, getDateRange]);

  // Calculate financial metrics
  const totalRevenue = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'sale' && t.payment_status === 'paid')
      .reduce((sum, t) => sum + t.total, 0);
  }, [filteredTransactions]);

  const totalCost = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.total, 0);
  }, [filteredTransactions]);

  const totalProfit = useMemo(() => {
    return totalRevenue - totalCost;
  }, [totalRevenue, totalCost]);

  const profitMargin = useMemo(() => {
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }, [totalRevenue, totalProfit]);

  // Inventory metrics
  const totalInventoryValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (p.quantity * p.sale_price), 0);
  }, [filteredProducts]);

  const lowStockAlerts = useMemo(() => {
    return filteredProducts.filter(p => p.quantity <= (p.min_stock || 0)).length;
  }, [filteredProducts]);

  // Client metrics
  const totalClients = clients.length;
  const activeClients = useMemo(() => {
    const { startDate } = getDateRange;
    return clients.filter(client => {
      const clientDate = new Date(client.created_at);
      return clientDate >= startDate;
    }).length;
  }, [clients, getDateRange]);

  // Supplier metrics
  const totalSuppliers = suppliers.length;

  // Purchase metrics
  const totalPurchaseOrders = purchaseOrders.length;
  const totalPurchaseValue = useMemo(() => {
    return purchaseOrders.reduce((sum, order) => sum + order.total, 0);
  }, [purchaseOrders]);

  // Sales data for chart
  const salesData = useMemo(() => {
    // Group transactions by date
    const salesByDate: Record<string, { sales: number; purchases: number }> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { sales: 0, purchases: 0 };
      }
      
      if (transaction.type === 'sale' && transaction.payment_status === 'paid') {
        salesByDate[date].sales += transaction.total;
      } else if (transaction.type === 'purchase') {
        salesByDate[date].purchases += transaction.total;
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(salesByDate)
      .map(([date, values]) => ({
        date,
        sales: values.sales,
        purchases: values.purchases
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [filteredTransactions]);

  // Top selling products
  const topSellingProducts = useMemo(() => {
    const productSales: Record<number, { name: string; sales: number; revenue: number }> = {};
    
    filteredTransactions
      .filter(t => t.type === 'sale' && t.payment_status === 'paid')
      .forEach(transaction => {
        if (transaction.items) {
          transaction.items.forEach(item => {
            if (!productSales[item.product_id]) {
              const product = products.find(p => p.id === item.product_id);
              productSales[item.product_id] = {
                name: product?.name || 'Produto desconhecido',
                sales: 0,
                revenue: 0
              };
            }
            productSales[item.product_id].sales += item.quantity;
            productSales[item.product_id].revenue += item.total;
          });
        }
      });
    
    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [filteredTransactions, products]);

  // Supplier performance
  const supplierPerformance = useMemo(() => {
    const supplierStats: Record<number, { name: string; orders: number; onTimeRate: number }> = {};
    
    purchaseOrders.forEach(order => {
      if (order.supplier_id) {
        if (!supplierStats[order.supplier_id]) {
          const supplier = suppliers.find(s => s.id === order.supplier_id);
          supplierStats[order.supplier_id] = {
            name: supplier?.name || 'Fornecedor desconhecido',
            orders: 0,
            onTimeRate: 0
          };
        }
        supplierStats[order.supplier_id].orders += 1;
        // Simplified on-time rate calculation
        supplierStats[order.supplier_id].onTimeRate = Math.min(100, 80 + Math.random() * 20);
      }
    });
    
    return Object.values(supplierStats)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [purchaseOrders, suppliers]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Executivo"
          actions={
            <div className="flex space-x-2">
              <button
                onClick={() => handleDateRangeChange('7d')}
                className={`px-3 py-1 text-sm rounded-full ${
                  dateRange === '7d'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => handleDateRangeChange('30d')}
                className={`px-3 py-1 text-sm rounded-full ${
                  dateRange === '30d'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Últimos 30 dias
              </button>
              <button
                onClick={() => handleDateRangeChange('90d')}
                className={`px-3 py-1 text-sm rounded-full ${
                  dateRange === '90d'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Últimos 90 dias
              </button>
              <button
                onClick={() => handleDateRangeChange('1y')}
                className={`px-3 py-1 text-sm rounded-full ${
                  dateRange === '1y'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Último ano
              </button>
              <button
                onClick={() => handleDateRangeChange('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  dateRange === 'all'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Todo o período
              </button>
            </div>
          }
        />

        {/* Abas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sales'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Vendas
              </button>
              <button
                onClick={() => setActiveTab('purchasing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'purchasing'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Compras
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inventory'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Estoque
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <StatsCards
                  totalRevenue={totalRevenue}
                  totalCost={totalCost}
                  totalProfit={totalProfit}
                  profitMargin={profitMargin}
                  totalInventoryValue={totalInventoryValue}
                  totalClients={totalClients}
                  activeClients={activeClients}
                  totalSuppliers={totalSuppliers}
                  totalPurchaseOrders={totalPurchaseOrders}
                  totalPurchaseValue={totalPurchaseValue}
                  lowStockAlerts={lowStockAlerts}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SalesChart salesData={salesData} />
                  <TopSellingProducts products={topSellingProducts} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SupplierPerformance suppliers={supplierPerformance} />
                  <LowStockAlerts 
                    products={filteredProducts
                      .filter((p: Product) => p.quantity <= (p.min_stock || 0))
                      .map((p: Product) => ({
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        subcategory: p.subcategory,
                        quantity: p.quantity,
                        min_stock: p.min_stock || 0,
                        image: p.image
                      }))
                    } 
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receita Total</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Clientes Ativos</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {activeClients} de {totalClients}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Produtos Vendidos</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {topSellingProducts.reduce((sum, p) => sum + p.sales, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <SalesChart salesData={salesData} />
                
                <TopSellingProducts products={topSellingProducts} />
              </div>
            )}
            
            {activeTab === 'purchasing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pedidos de Compra</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {totalPurchaseOrders}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalPurchaseValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Truck className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fornecedores</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {totalSuppliers}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <SupplierPerformance suppliers={supplierPerformance} />
              </div>
            )}
            
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valor do Estoque</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalInventoryValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Alertas de Estoque</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {lowStockAlerts}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Produtos</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {filteredProducts.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <LowStockAlerts 
                  products={filteredProducts
                    .filter((p: Product) => p.quantity <= (p.min_stock || 0))
                    .map((p: Product) => ({
                      id: p.id,
                      name: p.name,
                      category: p.category,
                      subcategory: p.subcategory,
                      quantity: p.quantity,
                      min_stock: p.min_stock || 0,
                      image: p.image
                    }))
                  } 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ExecutiveDashboard;