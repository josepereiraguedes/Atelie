import React, { useMemo } from 'react';
import { Transaction } from '@/shared/types/database.types';
import { heatmapService } from '@/services/heatmapService';
import { TrendingUp, Clock } from 'lucide-react';

interface SalesHeatmapProps {
    transactions: Transaction[];
}

const SalesHeatmap: React.FC<SalesHeatmapProps> = ({ transactions }) => {
    const data = useMemo(() => heatmapService.generateSalesHeatmap(transactions), [transactions]);
    const goldenHour = useMemo(() => heatmapService.getGoldenHour(transactions), [transactions]);

    const getColor = (value: number) => {
        if (value === 0) return 'bg-gray-100 dark:bg-gray-800/50';
        const ratio = value / data.max;
        if (ratio < 0.2) return 'bg-blue-100 dark:bg-blue-900/20';
        if (ratio < 0.4) return 'bg-blue-200 dark:bg-blue-800/40';
        if (ratio < 0.6) return 'bg-blue-400 dark:bg-blue-700/60';
        if (ratio < 0.8) return 'bg-blue-600 dark:bg-blue-600/80';
        return 'bg-blue-800 dark:bg-blue-400';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Pulsar de Vendas</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Análise de Tráfego por Horário</p>
                </div>
                {goldenHour.value !== 0 && (
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase leading-none">Horário de Ouro</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                                {goldenHour.day} às {goldenHour.hour}h
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="min-w-[600px]">
                    <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-1">
                        {/* Header: Horas */}
                        <div />
                        {data.hours.map(h => (
                            <div key={h} className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-tighter">
                                {h.replace('h', '')}
                            </div>
                        ))}

                        {/* Linhas: Dias da Semana */}
                        {data.days.map((day, dIdx) => (
                            <React.Fragment key={day}>
                                <div className="text-[10px] font-black text-gray-400 uppercase self-center">
                                    {day}
                                </div>
                                {data.matrix[dIdx].map((val, hIdx) => (
                                    <div
                                        key={`${dIdx}-${hIdx}`}
                                        className={`h-6 rounded-md transition-all hover:scale-125 hover:z-10 cursor-help ${getColor(val)}`}
                                        title={`${day}, ${hIdx}h: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}`}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Menos</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800/40" />
                        <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-700/60" />
                        <div className="w-3 h-3 rounded bg-blue-600 dark:bg-blue-600/80" />
                        <div className="w-3 h-3 rounded bg-blue-800 dark:bg-blue-400" />
                    </div>
                    <span>Mais</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                    <Clock className="w-3 h-3" />
                    Insights em Tempo Real
                </div>
            </div>
        </div>
    );
};

export default SalesHeatmap;
