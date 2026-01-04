import React, { useState, useMemo } from 'react';
import { TrendingUp, Truck, AlertTriangle, Target, Edit2, Info } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { PageHeader, ErrorBoundary } from '@/shared/components';
import { StatsCards } from '@/features/dashboard/components';
import { SalesChart } from '@/features/dashboard/components';
import { TopSellingProducts } from '@/features/dashboard/components';
import { SupplierPerformance } from '@/features/dashboard/components';
import { LowStockAlerts } from '@/features/dashboard/components';
import { ProfitabilityByChannel } from '@/features/financial/components';
import { ABCProfitabilityRanking } from '@/features/dashboard/components';
import { SalesHeatmap } from '@/features/dashboard/components';
import useDateFilter from '@/shared/hooks/useDateFilter';
import { transactionService } from '@/features/financial/services/transactionService';
import { inventoryIntelligence } from '@/features/inventory/services/inventoryIntelligence';

const ExecutiveDashboard: React.FC = () => {
  const {
    products,
    transactions,
    clients,
    suppliers,
    purchaseOrders,
    monthlyGoals,
    addMonthlyGoal,
    updateMonthlyGoal
  } = useLocalDatabase();

  const { dateRange, getDateRange, handleDateRangeChange } = useDateFilter();
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'purchasing' | 'inventory' | 'profitability'>('overview');

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
      const productDate = new Date(product.created_at || '');
      return productDate >= startDate && productDate <= endDate;
    });
  }, [products, getDateRange]);

  const stockRunway = useMemo(() => {
    return inventoryIntelligence.predictStockOut(products, transactions, 30);
  }, [products, transactions]);

  const criticalRunway = useMemo(() => {
    return stockRunway.filter(s => s.status === 'critical' || s.status === 'warning');
  }, [stockRunway]);

  // Calculate financial metrics using transactionService
  const { totalRevenue, totalPurchases: totalCost, totalProfit, profitMargin } = useMemo(() => {
    const summary = transactionService.calculateFinancialSummary(filteredTransactions);
    return {
      totalRevenue: summary.totalSales,
      totalPurchases: summary.totalPurchases,
      totalProfit: summary.netProfit,
      profitMargin: summary.totalSales > 0 ? (summary.netProfit / summary.totalSales) * 100 : 0
    };
  }, [filteredTransactions]);

  // Inventory metrics
  const totalInventoryValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (p.quantity * p.sale_price), 0);
  }, [filteredProducts]);

  const lowStockAlertsCount = useMemo(() => {
    return products.filter(p => p.quantity <= (p.min_stock || 0)).length;
  }, [products]);

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

    return Object.entries(salesByDate)
      .map(([date, values]) => ({
        date,
        sales: values.sales,
        purchases: values.purchases
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
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
        supplierStats[order.supplier_id].onTimeRate = Math.min(100, 80 + Math.random() * 20);
      }
    });

    return Object.values(supplierStats)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [purchaseOrders, suppliers]);

  // Meta Mensal
  const currentMonthGoal = useMemo(() => {
    const now = new Date();
    return monthlyGoals.find(g => g.month === (now.getMonth() + 1) && g.year === now.getFullYear());
  }, [monthlyGoals]);

  const monthRevenue = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return transactions
      .filter(t => {
        const d = new Date(t.created_at);
        return t.type === 'sale' && t.payment_status === 'paid' && d >= startOfMonth && d <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  const goalProgress = currentMonthGoal ? (monthRevenue / currentMonthGoal.target) * 100 : 0;
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(currentMonthGoal?.target.toString() || '0');

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Executivo"
          actions={
            <div className="flex space-x-2">
              {(['7d', '30d', '90d', '1y', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => handleDateRangeChange(range)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${dateRange === range
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700'
                    }`}
                >
                  {range === '7d' ? '7 Dias' : range === '30d' ? '30 Dias' : range === '90d' ? '90 Dias' : range === '1y' ? '1 Ano' : 'Tudo'}
                </button>
              ))}
            </div>
          }
        />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="border-b border-gray-100 dark:border-gray-700">
            <nav className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide">
              {(['overview', 'sales', 'purchasing', 'inventory', 'profitability'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-bold text-sm whitespace-nowrap transition-all uppercase tracking-widest ${activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                >
                  {tab === 'overview' ? 'Visão Geral' : tab === 'sales' ? 'Vendas' : tab === 'purchasing' ? 'Compras' : tab === 'inventory' ? 'Estoque' : 'Lucratividade'}
                </button>
              ))}
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
                  lowStockAlerts={lowStockAlertsCount}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Meta Mensal */}
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-blue-50 dark:border-blue-900/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Meta Mensal</h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Objetivo de Faturamento</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingGoal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}
                          </p>
                          <p className="text-xs font-bold text-gray-400">Total acumulado no mês</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-500">
                            / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentMonthGoal?.target || 0)}
                          </p>
                          <span className={`text-xs font-black p-1 px-2 rounded-lg ${goalProgress >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {goalProgress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${goalProgress >= 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, goalProgress)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Runway Alerts */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-orange-50 dark:border-orange-900/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                        <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Runway</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Previsão de Ruptura</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {criticalRunway.length > 0 ? criticalRunway.slice(0, 3).map(s => (
                        <div key={s.productId} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{s.productName}</p>
                            <p className={`text-[10px] font-black uppercase ${s.status === 'critical' ? 'text-red-500' : 'text-orange-500'}`}>
                              {s.daysOfStockLeft} dias restantes
                            </p>
                          </div>
                          <AlertTriangle className={`w-4 h-4 ${s.status === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />
                        </div>
                      )) : (
                        <div className="text-center py-4">
                          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-xs font-bold text-emerald-600 px-4">Estoque saudável e vendas constantes.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SalesChart salesData={salesData} />
                  <TopSellingProducts products={topSellingProducts} />
                </div>

                <SalesHeatmap transactions={filteredTransactions} />
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-6">
                <SalesChart salesData={salesData} />
                <SalesHeatmap transactions={filteredTransactions} />
                <TopSellingProducts products={topSellingProducts} />
              </div>
            )}

            {activeTab === 'purchasing' && (
              <div className="space-y-6">
                <SupplierPerformance suppliers={supplierPerformance} />
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex gap-4">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-blue-900 dark:text-blue-400 text-sm uppercase">Otimização de Compras</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                      O sistema analisa seu consumo diário e recomenda pedidos baseados no <strong>Tempo de Reposição (Runway)</strong>.
                      Fique atento aos alertas críticos para não perder vendas por falta de estoque.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <LowStockAlerts
                  products={products
                    .filter(p => p.quantity <= (p.min_stock || 0))
                    .map(p => ({
                      id: p.id!,
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

            {activeTab === 'profitability' && (
              <div className="space-y-8">
                <ProfitabilityByChannel />
                <ABCProfitabilityRanking />
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditingGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Definir Meta</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Objetivo de faturamento mensal</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Total (R$)</label>
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-2xl font-black text-gray-900 dark:text-white focus:border-blue-600 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditingGoal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Sair
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const targetValue = parseFloat(newGoalTarget);
                    if (currentMonthGoal) {
                      updateMonthlyGoal(currentMonthGoal.id, { target: targetValue });
                    } else {
                      addMonthlyGoal({
                        month: now.getMonth() + 1,
                        year: now.getFullYear(),
                        target: targetValue
                      });
                    }
                    setIsEditingGoal(false);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 dark:shadow-none uppercase tracking-widest"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default ExecutiveDashboard;
