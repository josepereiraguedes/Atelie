import React, { useMemo } from 'react';
import { Activity, Clock, ArrowUpRight, Coins } from 'lucide-react';
import { useConfig } from '@/core/contexts/ConfigContext';
import { financialAnalyticsService } from '@/features/financial/services/financialAnalyticsService';

interface HealthTabProps {
  transactions: any[];
  isLoading: boolean;
}

export const HealthTab: React.FC<HealthTabProps> = ({ transactions, isLoading }) => {
  const burnUpData = useMemo(() => {
    return financialAnalyticsService.getBurnUpData(transactions, 5000); // 5000 como custo fixo base de exemplo
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="w-32 h-32 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Crescimento de Faturamento (Burn-up)</h2>
            <p className="text-sm text-gray-500 font-medium mb-8">Acompanhamento diário do faturamento real vs. Ponto de Equilíbrio mensal.</p>

            <div className="relative h-48 flex items-end gap-1 px-2 border-b border-gray-100 dark:border-gray-700">
              {/* Linha de Meta (Custos Fixos) */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-400/30 z-0 flex items-center justify-end pr-2"
                style={{ bottom: `${(burnUpData.target / Math.max(burnUpData.projection, burnUpData.target * 1.2)) * 100}%` }}
              >
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-white dark:bg-gray-800 px-1">Custos Fixos</span>
              </div>

              {burnUpData.series.map((s: any, i: number) => {
                const maxHeight = Math.max(burnUpData.projection, burnUpData.target * 1.2);
                const height = (s.revenue / maxHeight) * 100;
                const isFuture = s.day > new Date().getDate();

                return (
                  <div
                    key={i}
                    className="flex-1 relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className={`w-full h-full rounded-t-sm transition-all duration-500 ${isFuture ? 'bg-gray-100 dark:bg-gray-700/30' :
                      s.isProfitDay ? 'bg-emerald-500' : 'bg-indigo-400'
                      } hover:opacity-80`} />

                    {/* Tooltip Simples */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      Dia {s.day}: R$ {s.revenue.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Dia 01</span>
              <span>Projeção de Faturamento Mensal</span>
              <span>Dia {burnUpData.series.length}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm text-center relative overflow-hidden group">
            <div className={`absolute inset-0 opacity-10 transition-colors ${burnUpData.profitDay ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <Clock className={`w-12 h-12 mx-auto mb-4 ${burnUpData.profitDay ? 'text-emerald-500' : 'text-indigo-500'}`} />
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Ponto de Equilíbrio</h3>
            <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
              {burnUpData.profitDay ? `DIA ${burnUpData.profitDay}` : 'EM BUSCA'}
            </div>
            <p className="text-[11px] text-gray-500 font-bold uppercase leading-tight px-4">
              {burnUpData.profitDay
                ? 'Parabéns! A partir deste dia, cada venda gerou lucro líquido real.'
                : `Faltam R$ ${(burnUpData.target - burnUpData.currentTotal).toFixed(2)} para atingir o lucro.`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Previsão Fechamento</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">R$ {burnUpData.projection.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                  <ArrowUpRight className="w-4 h-4" />
                  {((burnUpData.projection / burnUpData.target - 1) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (burnUpData.currentTotal / burnUpData.target) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Hoje: R$ {burnUpData.currentTotal.toFixed(0)}</span>
                <span>Meta: R$ {burnUpData.target.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Coins className="w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">O Ciclo de Lucro do {useConfig().company.name}</h3>
          <p className="text-indigo-100 text-sm font-medium leading-relaxed">
            O gráfico acima reflete a saúde do seu capital de giro. Quando a barra fica <strong>verde</strong>, significa que o faturamento acumulado já cobriu todos os seus custos operacionais fixos pré-definidos.
          </p>
        </div>
        <button className="relative z-10 px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all uppercase tracking-widest text-xs shadow-xl">
          Configurar Custos Fixos
        </button>
      </div>
    </section>
  );
};
