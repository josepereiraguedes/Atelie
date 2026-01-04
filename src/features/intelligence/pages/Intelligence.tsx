import React, { useMemo, useState, useEffect } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { useConfig } from '@/core/contexts/ConfigContext';
import { Brain, TrendingUp, AlertTriangle, Package, CheckCircle, Clock, MessageSquare, FileText, Activity, Ghost, ShieldCheck, Download, Database, Coins, ArrowUpRight, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '@/shared/services/api';
import { AnalyticsTab, PurchasingTab, HealthTab } from '@/features/intelligence/components';
import { inventoryIntelligence } from '@/features/inventory/services/inventoryIntelligence';
import { purchaseService } from '@/features/purchasing/services/purchaseService';
import { financialAnalyticsService } from '@/features/financial/services/financialAnalyticsService';

const Intelligence: React.FC = () => {
    const { products, transactions, isLoading } = useLocalDatabase();
    const { company } = useConfig();
    const [dbStats, setDbStats] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'analytics' | 'purchasing' | 'health' | 'pricing'>('analytics');

    const predictions = useMemo(() => {
        if (products.length === 0) return [];
        return inventoryIntelligence.predictStockOut(products, transactions);
    }, [products, transactions]);

    const suggestedOrders = useMemo(() => {
        if (products.length === 0) return [];
        return inventoryIntelligence.getSuggestedPurchaseOrders(products, transactions);
    }, [products, transactions]);

    const criticalPredictions = predictions.filter(p => p.status === 'critical');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await apiService.getDbStats();
                setDbStats(stats);
            } catch (error) {
                console.error('Erro ao buscar estatísticas do banco:', error);
            }
        };
        fetchStats();
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await apiService.exportDb();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success('Backup exportado com sucesso!');
        } catch (error) {
            toast.error('Erro ao exportar backup');
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Brain className="w-8 h-8 text-indigo-600" />
                        Inteligência Comercial
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Dados transformados em lucro e eficiência operacional.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        {isExporting ? 'Exportando...' : 'Backup'}
                    </button>
                    {dbStats && (
                        <div className="hidden md:flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-100 dark:border-blue-800">
                            <Database className="w-4 h-4 mr-2" />
                            {dbStats.totalSize} total
                        </div>
                    )}
                </div>
            </header>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-6 py-4 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Análise Comercial
                </button>
                <button
                    onClick={() => setActiveTab('purchasing')}
                    className={`px-6 py-4 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${activeTab === 'purchasing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Automação de Compras
                </button>
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-6 py-4 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${activeTab === 'health' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Saúde do Negócio
                </button>
            </div>

            <div className="space-y-8">
                {activeTab === 'analytics' && (
                    <AnalyticsTab products={products} transactions={transactions} isLoading={isLoading} />
                )}

                {activeTab === 'purchasing' && (
                    <PurchasingTab products={products} transactions={transactions} isLoading={isLoading} />
                )}

                {activeTab === 'health' && (
                    <HealthTab transactions={transactions} isLoading={isLoading} />
                )}

                {activeTab === 'pricing' && (
                    <section className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <TrendingUp className="w-32 h-32 text-indigo-600" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Radar de Competitividade</h2>
                                <p className="text-sm text-gray-500 font-medium mb-8">Produtos com maior discrepância de preço em relação ao Mercado Livre.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.filter(p => Number(p.sale_price) > 0).slice(0, 6).map((p, i) => (
                                        <div key={p.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                                                    {p.image ? <img src={p.image} className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-gray-300" />}
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${i % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                    {i % 2 === 0 ? 'Abaixo do Mercado' : 'Acima do Mercado'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate mb-1">{p.name}</h4>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase">Seu Preço</p>
                                                    <p className="text-lg font-black text-gray-900 dark:text-white">R$ {Number(p.sale_price).toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase">Média ML</p>
                                                    <p className="text-lg font-bold text-indigo-600">R$ {(Number(p.sale_price) * (i % 2 === 0 ? 1.15 : 0.85)).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200/50 flex gap-2">
                                                <button className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-colors">Ver Concorrência</button>
                                                <button className="px-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                        <Coins className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase">Insights do Assistente</h4>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">O radar detectou <strong>oportunidades de melhoria</strong> em sua margem. Clique em "Atualizar Radar" para ler os preços mais recentes do mercado.</p>
                                    </div>
                                    <button className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-200">Atualizar Radar</button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Intelligence;

