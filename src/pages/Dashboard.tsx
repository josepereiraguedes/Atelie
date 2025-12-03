import React, { useEffect, useState, useMemo } from 'react';
import { Package, DollarSign, TrendingUp, Clock, Bell, AlertTriangle, ShoppingCart, TrendingDown, Minus } from 'lucide-react';
import { FinancialSummary, useLocalDatabase } from '../contexts/LocalDatabaseContext';
import { handleError } from '../utils/errorHandler';
import { motion, HTMLMotionProps } from 'framer-motion';
import LowStockAlerts from '../components/Inventory/LowStockAlerts';
import CategoryStats from '../components/Inventory/CategoryStats';
import MarketplaceOverview from '../components/marketplace/MarketplaceOverview';
import PricingAlerts from '../components/marketplace/PricingAlerts';
import AdvancedPricingMetrics from '../components/marketplace/AdvancedPricingMetrics';
import CustomCostDashboardCard from '../components/marketplace/CustomCostDashboardCard';
import useFinancialData from '../hooks/useFinancialData';

const Dashboard: React.FC = () => {
  const { products, transactions, clients, getFinancialSummary, lowStockAlerts } = useLocalDatabase();
  const { financialData, loading } = useFinancialData(getFinancialSummary, transactions);
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'inventory'>('overview');

  // Calcular contas pendentes (vendas com status pending)
  const pendingReceivables = useMemo(() => {
    return transactions
      .filter(t => t.type === 'sale' && t.payment_status === 'pending')
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  const totalProducts = useMemo(() => {
    return products.length;
  }, [products]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.sale_price) || 0)), 0);
  }, [products]);

  const statsCards = useMemo(() => [
    {
      title: 'Faturamento',
      value: `R$ ${(financialData.totalSales || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'purple',
      subtitle: 'Vendas pagas'
    },
    {
      title: 'A Receber',
      value: `R$ ${pendingReceivables.toFixed(2)}`,
      icon: Clock,
      color: 'blue',
      subtitle: 'Vendas pendentes'
    },
    {
      title: 'Produtos',
      value: totalProducts.toString(),
      icon: Package,
      color: 'green',
      subtitle: 'Itens no estoque'
    },
    {
      title: 'Valor em Estoque',
      value: `R$ ${totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'yellow',
      subtitle: 'Valor total'
    }
  ], [financialData, pendingReceivables, totalProducts, totalValue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Atualizado: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
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

      {/* Conteúdo das abas */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Alertas de Precificação */}
          <PricingAlerts />
          
          {/* Alerta de Estoque Baixo */}
          {lowStockAlerts.length > 0 && (
            <LowStockAlerts limit={3} />
          )}

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4" } as HTMLMotionProps<'div'>)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.title}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{card.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900/30`}>
                      <IconComponent className={`w-5 h-5 text-${card.color}-600 dark:text-${card.color}-400`} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{card.subtitle}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Estatísticas por Categoria em Lista */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
            <CategoryStats />
          </div>

          {/* Visão Geral dos Marketplaces */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
            <MarketplaceOverview />
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <AdvancedPricingMetrics />
          <CustomCostDashboardCard />
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
            <CategoryStats />
          </div>
          <LowStockAlerts />
        </div>
      )}
    </div>
  );
};

export default Dashboard;