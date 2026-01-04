import React, { useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { DollarSign, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { financialAnalyticsService } from '@/features/financial/services/financialAnalyticsService';

const ProfitabilityByChannel: React.FC = () => {
    const { transactions, products, marketplaceConfigs } = useLocalDatabase();

    const channelsData = useMemo(() => {
        const data: Record<string, {
            name: string;
            revenue: number;
            productCost: number;
            estimatedFees: number;
            realProfit: number;
            salesCount: number;
        }> = {};

        const paidSales = transactions.filter(t => t.type === 'sale' && t.payment_status === 'paid');

        paidSales.forEach(t => {
            const channelName = t.channel || 'Loja Física';
            if (!data[channelName]) {
                data[channelName] = {
                    name: channelName,
                    revenue: 0,
                    productCost: 0,
                    estimatedFees: 0,
                    realProfit: 0,
                    salesCount: 0
                };
            }

            const stats = financialAnalyticsService.calculateTransactionNetProfit(t, products, marketplaceConfigs);
            const channel = data[channelName];

            channel.revenue += stats.revenue;
            channel.productCost += stats.productCost;
            channel.estimatedFees += stats.fees;
            channel.realProfit += stats.netProfit;
            channel.salesCount += 1;
        });

        return Object.values(data).sort((a, b) => b.realProfit - a.realProfit);
    }, [transactions, products, marketplaceConfigs]);

    const totalRealProfit = channelsData.reduce((sum, c) => sum + c.realProfit, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lucro Líquido Multicanal</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRealProfit)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Margem Média Real</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                {channelsData.length > 0 ? ((totalRealProfit / channelsData.reduce((sum, c) => sum + c.revenue, 0)) * 100).toFixed(1) : 0}%
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Melhor Canal</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white truncate max-w-[150px]">
                                {channelsData[0]?.name || '---'}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Performance por Canal</h3>
                    <p className="text-sm text-gray-500">Lucratividade deduzindo custo de produto e taxas aproximadas</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider font-bold text-gray-500">
                                <th className="px-6 py-4">Canal</th>
                                <th className="px-6 py-4 text-right">Vendas</th>
                                <th className="px-6 py-4 text-right">Receita Bruta</th>
                                <th className="px-6 py-4 text-right">Custo Prod.</th>
                                <th className="px-6 py-4 text-right">Taxas (Est.)</th>
                                <th className="px-6 py-4 text-right">Lucro Líquido</th>
                                <th className="px-6 py-4 text-right">Margem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {channelsData.map(channel => {
                                const margin = (channel.realProfit / channel.revenue) * 100;
                                return (
                                    <tr key={channel.name} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900 dark:text-white">{channel.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{channel.salesCount}</td>
                                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(channel.revenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-500">
                                            - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(channel.productCost)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-orange-500">
                                            - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(channel.estimatedFees)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-bold ${channel.realProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(channel.realProfit)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${margin >= 20 ? 'bg-emerald-100 text-emerald-700' : margin >= 10 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {channelsData.some(c => (c.realProfit / c.revenue) < 0.1) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-400">Alerta de Margem Crítica</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            Detectamos canais com margem real abaixo de 10%. Revise seus preços de venda ou custos de operação nestes canais para evitar prejuízos.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitabilityByChannel;

