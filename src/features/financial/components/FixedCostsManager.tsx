import React, { useState, useEffect } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { FixedCost } from '@/shared/types/database.types';
import { Plus, DollarSign, Calendar, AlertCircle, Tag, Trash2 } from 'lucide-react';

export const FixedCostsManager: React.FC = () => {
    const { fixedCosts, addFixedCost, deleteFixedCost } = useLocalDatabase();
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState<Partial<FixedCost>>({
        description: '',
        value: 0,
        category: 'outros',
        due_day: 5
    });

    const categories = [
        { id: 'aluguel', label: 'Aluguel', color: 'bg-red-100 text-red-700' },
        { id: 'energia', label: 'Energia/Luz', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'internet', label: 'Internet/Tel', color: 'bg-blue-100 text-blue-700' },
        { id: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-700' },
        { id: 'salarios', label: 'Salários/Pro-labore', color: 'bg-green-100 text-green-700' },
        { id: 'sistemas', label: 'Sistemas/Software', color: 'bg-indigo-100 text-indigo-700' },
        { id: 'outros', label: 'Outros', color: 'bg-gray-100 text-gray-700' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.value) return;

        addFixedCost({
            description: formData.description,
            value: Number(formData.value),
            category: formData.category as any,
            due_day: Number(formData.due_day)
        });

        setFormData({ description: '', value: 0, category: 'outros', due_day: 5 });
        setIsAdding(false);
    };

    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.value, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header com Resumo */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Custos Fixos Mensais</h3>
                    <p className="text-sm text-gray-500 font-bold">Gerencie as despesas que não dependem das vendas.</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Comprometido</span>
                    <span className="text-2xl font-black text-red-600">R$ {totalFixedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Listagem ou Formulário */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {!isAdding ? (
                    <div className="p-4">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all font-bold group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Novo Custo Fixo
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Aluguel da Loja"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Valor Mensal</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-sm appearance-none"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Vencimento (Dia)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.due_day}
                                        onChange={e => setFormData({ ...formData, due_day: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Salvar Custo
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {fixedCosts.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400">Nenhum custo fixo cadastrado.</p>
                        </div>
                    ) : (
                        fixedCosts.map(cost => {
                            const category = categories.find(c => c.id === cost.category);
                            return (
                                <div key={cost.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${category?.color || 'bg-gray-100 text-gray-700'}`}>
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{cost.description}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Dia {cost.due_day}</span>
                                                <span className="text-[10px] text-gray-300">•</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{category?.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">R$ {cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        <button
                                            onClick={() => deleteFixedCost(cost.id)}
                                            className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Dica Informativa */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                    Estes valores são utilizados para calcular o seu <span className="underline decoration-blue-300">Ponto de Equilíbrio</span>. Cadastre tudo o que você paga mensalmente (aluguel, sistemas, luz) para saber exatamente quanto precisa vender para ter lucro real.
                </p>
            </div>
        </div>
    );
};

