
import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, AlertOctagon, Package, ArrowRight } from 'lucide-react';
import { inventoryIntelligence } from '@/features/inventory/services/inventoryIntelligence';
import { Product, Transaction } from '@/core/contexts/LocalDatabaseContext';
import { Link } from 'react-router-dom';
import { motion, HTMLMotionProps } from 'framer-motion';

interface InventoryIntelligenceWidgetProps {
    products: Product[];
    transactions: Transaction[];
}

const InventoryIntelligenceWidget: React.FC<InventoryIntelligenceWidgetProps> = ({ products, transactions }) => {
    const [activeTab, setActiveTab] = useState<'abc' | 'prediction'>('prediction');

    const abcAnalysis = useMemo(() => {
        return inventoryIntelligence.analyzeABC(products as any); // Type cast necessario enquanto tipos nao sao 100% alinhados estritamente em todo app
    }, [products]);

    const predictions = useMemo(() => {
        // Filtrar apenas previsões críticas ou warning para não poluir
        const all = inventoryIntelligence.predictStockOut(products as any, transactions as any);
        return all.filter(p => p.status === 'critical' || p.status === 'warning').slice(0, 5);
    }, [products, transactions]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                        <Brain size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Inteligência de Estoque</h3>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 text-xs font-medium">
                    <button
                        onClick={() => setActiveTab('prediction')}
                        className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'prediction'
                            ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        Previsões
                    </button>
                    <button
                        onClick={() => setActiveTab('abc')}
                        className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'abc'
                            ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        Curva ABC
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto pr-1">
                {activeTab === 'prediction' ? (
                    <div className="space-y-3">
                        {predictions.length > 0 ? (
                            predictions.map((pred, idx) => (
                                <motion.div
                                    key={pred.productId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    {...({
                                        className: `flex items-center justify-between p-3 rounded-lg border-l-4 ${pred.status === 'critical'
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                                            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-500'
                                            }`
                                    } as HTMLMotionProps<'div'>)}
                                >
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate w-40">
                                            {pred.productName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                            <TrendingUp size={12} className="inline" /> Venda média: {pred.averageDailySales.toFixed(1)}/dia
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${pred.status === 'critical' ? 'text-red-600' : 'text-amber-600'
                                            }`}>
                                            {pred.daysOfStockLeft} dias
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Restantes</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                <Package size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Seu estoque está saudável! Nenhuma ruptura prevista para os próximos dias.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 text-center">
                                <span className="block text-2xl font-bold text-emerald-600">{abcAnalysis.classA.length}</span>
                                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Classe A</span>
                                <span className="block text-[10px] text-emerald-600/70">Alto Valor</span>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                                <span className="block text-2xl font-bold text-blue-600">{abcAnalysis.classB.length}</span>
                                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">Classe B</span>
                                <span className="block text-[10px] text-blue-600/70">Médio Valor</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                                <span className="block text-2xl font-bold text-gray-600 dark:text-gray-400">{abcAnalysis.classC.length}</span>
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-400">Classe C</span>
                                <span className="block text-[10px] text-gray-500">Baixo Valor</span>
                            </div>
                        </div>

                        {abcAnalysis.recommendations.length > 0 && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-start gap-2">
                                    <AlertOctagon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                        {abcAnalysis.recommendations[0]}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            <Link to="/reports" className="text-xs text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                                Ver Relatório Completo <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryIntelligenceWidget;

