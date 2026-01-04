import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Package, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalInventoryValue: number;
  totalClients: number;
  activeClients: number;
  totalSuppliers: number;
  totalPurchaseOrders: number;
  totalPurchaseValue: number;
  lowStockAlerts: number;
}

const StatsCards: React.FC<StatsCardsProps> = memo(({
  totalRevenue,
  totalCost,
  totalProfit,
  profitMargin,
  totalInventoryValue,
  totalClients,
  activeClients,
  totalSuppliers,
  totalPurchaseOrders,
  totalPurchaseValue,
  lowStockAlerts
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stats = [
    {
      title: 'Receita Total',
      value: formatCurrency(totalRevenue),
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Custo Total',
      value: formatCurrency(totalCost),
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
      change: '+8%',
      changeType: 'negative'
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(totalProfit),
      icon: <DollarSign className="w-5 h-5 text-blue-500" />,
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Margem de Lucro',
      value: `${profitMargin.toFixed(1)}%`,
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      change: '+2%',
      changeType: 'positive'
    },
    {
      title: 'Valor do Estoque',
      value: formatCurrency(totalInventoryValue),
      icon: <Package className="w-5 h-5 text-purple-500" />,
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Clientes',
      value: `${activeClients}/${totalClients}`,
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      change: '+3%',
      changeType: 'positive'
    },
    {
      title: 'Fornecedores',
      value: totalSuppliers.toString(),
      icon: <Users className="w-5 h-5 text-yellow-500" />,
      change: '0%',
      changeType: 'neutral'
    },
    {
      title: 'Pedidos de Compra',
      value: `${totalPurchaseOrders} (${formatCurrency(totalPurchaseValue)})`,
      icon: <ShoppingCart className="w-5 h-5 text-pink-500" />,
      change: '+7%',
      changeType: 'positive'
    },
    {
      title: 'Alertas de Estoque',
      value: lowStockAlerts.toString(),
      icon: <Package className="w-5 h-5 text-red-500" />,
      change: '-2',
      changeType: 'negative'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.title}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              {stat.icon}
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className={`text-xs font-medium ${
              stat.changeType === 'positive' ? 'text-green-600' : 
              stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {stat.changeType === 'positive' ? '↑' : stat.changeType === 'negative' ? '↓' : ''}
              {stat.change}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs mês anterior</span>
          </div>
        </div>
      ))}
    </div>
  );
});

export default StatsCards;