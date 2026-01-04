import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, TrendingUp, TrendingDown, DollarSign,
  Edit2, Trash2, Calendar, BarChart3,
  CheckCircle2, Target, PieChart, MoreHorizontal
} from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FixedCostsManager } from '@/features/financial/components';

const Financial: React.FC = () => {
  const {
    transactions, products, clients,
    updateTransactionStatus, deleteTransaction, getFinancialSummary
  } = useLocalDatabase();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'fixed_costs'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const navigate = useNavigate();

  // Obter resumo financeiro real (com custos fixos e break-even)
  const summary = getFinancialSummary();

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const handleStatusChange = async (id: number, currentStatus: 'paid' | 'pending') => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await updateTransactionStatus(id, newStatus);
    toast.success('Status atualizado!');
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Excluir esta transação?')) return;
    await deleteTransaction(id);
    toast.success('Transação excluída!');
  };

  const handleEditTransaction = (id: number) => navigate(`/sales/edit/${id}`);

  // Filtragem de transações para o histórico
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startOfPeriod = new Date(0);

    if (selectedPeriod === 'today') startOfPeriod = new Date(now.setHours(0, 0, 0, 0));
    else if (selectedPeriod === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      startOfPeriod = new Date(weekStart.setHours(0, 0, 0, 0));
    }
    else if (selectedPeriod === 'month') startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions
      .filter(t => new Date(t.created_at) >= startOfPeriod)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions, selectedPeriod]);

  // Cards Financeiros Principais
  const financialCards = [
    {
      title: 'Faturamento',
      value: `R$ ${summary.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'blue',
      subtitle: 'Total em Vendas Pagas',
      trend: '+12%'
    },
    {
      title: 'Custos Variáveis',
      value: `R$ ${summary.totalPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'orange',
      subtitle: 'Produtos e CMV'
    },
    {
      title: 'Custos Fixos',
      value: `R$ ${summary.totalFixedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: PieChart,
      color: 'red',
      subtitle: 'Custos Operacionais'
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${summary.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: summary.netProfit >= 0 ? 'emerald' : 'red',
      subtitle: summary.totalSales > 0 ? `${((summary.netProfit / summary.totalSales) * 100).toFixed(1)}% de lucro real` : 'Sem vendas'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Financeiro Inteligente</h1>
          <p className="text-sm text-gray-500 font-bold">Gestão de faturamento, despesas e ponto de equilíbrio.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/financial/new" className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 dark:shadow-none">
            <Plus className="w-4 h-4 mr-2" /> Venda / Despesa
          </Link>
        </div>
      </div>

      {/* Tabs Modernas */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'transactions', label: 'Histórico', icon: Calendar },
          { id: 'fixed_costs', label: 'Custos Fixos', icon: PieChart }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Dashboard de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {financialCards.map((card, index) => (
              <motion.div key={card.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
              >
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${card.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                        card.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' :
                          card.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                            'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      }`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    {card.trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">{card.trend}</span>}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.title}</h3>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{card.value}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase leading-none">{card.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ponto de Equilíbrio (Break-even Card) */}
            <div className="lg:col-span-1 bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-200 dark:shadow-none relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Target className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">Ponto de Equilíbrio</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Meta de sobrevivência</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-2">Faturamento Necessário</span>
                    <div className="text-4xl font-black text-white">R$ {summary.breakEvenPoint.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                    <p className="text-xs font-bold text-white/60 mt-2 italic">Valor para cobrir 100% dos custos fixos e variáveis.</p>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Progresso Mensal</span>
                      <span className="text-sm font-black text-yellow-400">{Math.min(100, (summary.totalSales / summary.breakEvenPoint) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (summary.totalSales / summary.breakEvenPoint) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full shadow-lg ${summary.totalSales >= summary.breakEvenPoint ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                      />
                    </div>
                    {summary.totalSales >= summary.breakEvenPoint ? (
                      <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Meta Batida! O lucro começa agora.
                      </div>
                    ) : (
                      <div className="mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Faltam R$ {Math.max(0, summary.breakEvenPoint - summary.totalSales).toLocaleString('pt-BR')} para o lucro.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl -mr-32 -mt-32" />
            </div>

            {/* Projetado e Eficiência */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Saúde de Caixa</h3>
                  <MoreHorizontal className="text-gray-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Entradas Pendentes</span>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-tight">Total Aguardando</span>
                      </div>
                      <span className="text-lg font-black text-gray-900 dark:text-white">R$ {transactions.filter(t => t.payment_status === 'pending' && t.type === 'sale').reduce((sum, t) => sum + t.total, 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase">Estas são as vendas que faturaram mas o dinheiro ainda não entrou em caixa.</p>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">Eficiência Operacional</span>
                    <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mb-1">
                      {summary.totalSales > 0 ? ((summary.netProfit / summary.totalSales) * 100).toFixed(1) : '0'}%
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600/60 leading-tight uppercase">Porcentagem de faturamento que efetivamente se torna lucro livre.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl flex items-center gap-4 group hover:border-blue-100 transition-colors cursor-pointer">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 transition-transform group-hover:scale-110">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter block">Otimizar Margem de Contribuição</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Analise o CMV dos seus produtos na Inteligência de Estoque.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Filtros Histórico */}
          <div className="flex flex-wrap gap-2">
            {['all', 'today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                    : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shadow-sm'
                  }`}
              >
                {period === 'all' ? 'Tudo' : period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Itens</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {t.items?.map((item, i) => (
                            <div key={i} className="text-xs font-bold text-gray-600 dark:text-gray-400">
                              {productMap.get(item.product_id)?.name || 'Produto'} <span className="text-gray-300 font-medium">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                        {t.client?.name || (t.client_id && clientMap.get(t.client_id)?.name) || 'Consumidor'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${t.type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusChange(t.id!, t.payment_status)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${t.payment_status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-white'}`}
                        >
                          {t.payment_status === 'paid' ? 'Liquidado' : 'Pendente'}
                        </button>
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${t.type === 'sale' ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                        {t.type === 'sale' ? '+' : '-'} R$ {t.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEditTransaction(t.id!)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteTransaction(t.id!)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fixed_costs' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 min-h-[400px]">
          <FixedCostsManager />
        </div>
      )}
    </div>
  );
};

export default Financial;
