import React, { useMemo } from 'react';
import { Brain, TrendingUp, AlertTriangle, Package, Activity, Ghost, ShieldCheck, CheckCircle } from 'lucide-react';

import { inventoryIntelligence } from '@/features/inventory/services/inventoryIntelligence';

interface AnalyticsTabProps {
  products: any[];
  transactions: any[];
  isLoading: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ products, transactions, isLoading }) => {
  const abcResult = useMemo(() => {
    if (products.length === 0) return null;
    return inventoryIntelligence.analyzeABC(products);
  }, [products]);

  const profitability = useMemo(() => {
    if (products.length === 0 || transactions.length === 0) return null;
    return inventoryIntelligence.analyzeProfitability(products, transactions);
  }, [products, transactions]);

  const deadStock = useMemo(() => {
    if (products.length === 0) return [];
    return inventoryIntelligence.analyzeDeadStock(products, transactions);
  }, [products, transactions]);

  const financialSummary = useMemo(() => {
    if (!profitability) return null;
    const totalProfit = profitability.categoryRanking.reduce((sum, c) => sum + c.profit, 0);
    const totalRevenue = profitability.categoryRanking.reduce((sum, c) => sum + c.revenue, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const immobilizedCapital = deadStock.reduce((sum, item) => sum + item.value, 0);

    return { totalProfit, totalRevenue, avgMargin, immobilizedCapital };
  }, [profitability, deadStock]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {financialSummary && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Margem Média</span>
            </div>
            <div className="text-2xl font-black text-indigo-600">{financialSummary.avgMargin.toFixed(1)}%</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Lucro Acumulado</span>
            </div>
            <div className="text-2xl font-black text-emerald-600">R$ {financialSummary.totalProfit.toFixed(2)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Ghost className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Capital Preso</span>
            </div>
            <div className="text-2xl font-black text-purple-600">R$ {financialSummary.immobilizedCapital.toFixed(2)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Risco Ruptura</span>
            </div>
            <div className="text-2xl font-black text-red-600">R$ 0.00</div>
          </div>
        </section>
      )}

      {profitability && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mais Lucrativos (Categorias)</h2>
            </div>
            <div className="p-4 space-y-3">
              {profitability.categoryRanking.slice(0, 5).map((cat: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">{i + 1}</span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-tight">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">R$ {cat.profit.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cat.margin.toFixed(1)}% MG</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mais Lucrativos (Produtos)</h2>
            </div>
            <div className="p-4 space-y-3">
              {profitability.productRanking.slice(0, 5).map((prod: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-[10px] font-black shrink-0">{i + 1}</span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate tracking-tight">{prod.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-600">R$ {prod.profit.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{prod.margin.toFixed(1)}% MG</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Análise Curva ABC (Investimento)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
              <p className="text-[10px] font-black uppercase text-emerald-600 mb-1 tracking-widest">Classe A</p>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{abcResult?.classA.length || 0}</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold">20% ITENS | 80% VALOR</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-1 tracking-widest">Classe B</p>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{abcResult?.classB.length || 0}</p>
              <p className="text-[10px] text-blue-500 mt-1 font-bold">30% ITENS | 15% VALOR</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Classe C</p>
              <p className="text-3xl font-black text-gray-700 dark:text-gray-300">{abcResult?.classC.length || 0}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-bold">50% ITENS | 5% VALOR</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto max-h-[280px]">
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Ações Recomendadas
          </h3>
          <div className="space-y-3">
            {abcResult?.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-bold">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
