import React, { useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Trophy, Medal, Star, Info, AlertTriangle } from 'lucide-react';
import { financialAnalyticsService } from '@/features/financial/services/financialAnalyticsService';

interface ProductProfitData {
    id: number;
    name: string;
    category: string;
    revenue: number;
    totalProfit: number;
    margin: number;
    salesCount: number;
    classification: 'A' | 'B' | 'C';
}

const ABCProfitabilityRanking: React.FC = () => {
    const { transactions, products } = useLocalDatabase();

    const ranking = useMemo(() => {
        return financialAnalyticsService.calculateABCCurve(transactions, products) as ProductProfitData[];
    }, [transactions, products]);

    const stats = useMemo(() => {
        return {
            countA: ranking.filter(p => p.classification === 'A').length,
            countB: ranking.filter(p => p.classification === 'B').length,
            countC: ranking.filter(p => p.classification === 'C').length,
        };
    }, [ranking]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    Curva ABC de Lucratividade
                    <span className="text-xs font-normal text-gray-500">(Top Lucro Líquido)</span>
                </h3>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                        <Trophy className="w-3 h-3" /> A: {stats.countA}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        <Medal className="w-3 h-3" /> B: {stats.countB}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        <Star className="w-3 h-3" /> C: {stats.countC}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-3">Produto</th>
                                <th className="px-6 py-3 text-right">Qtd</th>
                                <th className="px-6 py-3 text-right">Lcr Líquido</th>
                                <th className="px-6 py-3 text-right">Margem</th>
                                <th className="px-6 py-3 text-center">ABC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {ranking.slice(0, 15).map((product, idx) => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-300 group-hover:text-blue-500 transition-colors">#{idx + 1}</span>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase">{product.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                                        {product.salesCount}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-black ${product.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.totalProfit)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-xs font-bold ${product.margin >= 20 ? 'text-emerald-500' : product.margin >= 10 ? 'text-blue-500' : 'text-red-500'}`}>
                                            {product.margin.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black shadow-sm ${product.classification === 'A' ? 'bg-emerald-500 text-white' :
                                            product.classification === 'B' ? 'bg-blue-500 text-white' :
                                                'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                            {product.classification}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {ranking.some(p => p.totalProfit < 0) && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Produtos com Prejuízo Líquido</h4>
                            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                Identificamos produtos onde o custo + taxas superam o preço de venda. Verifique os itens marcados em vermelho na tabela acima.
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong>O que é Curva ABC?</strong><br />
                        Classe <strong>A</strong> concentra os 70% maiores lucros. Classe <strong>B</strong> os próximos 20% e Classe <strong>C</strong> os 10% finais.
                        Foque em manter estoque e promover produtos da Classe A.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ABCProfitabilityRanking;

