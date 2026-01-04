import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { ClipboardCheck, Search, AlertTriangle, CheckCircle2, Save, Trash2, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditItem {
    id: number;
    name: string;
    sku?: string;
    systemStock: number;
    physicalStock: number;
    difference: number;
}

const InventoryAudit: React.FC = () => {
    const { products, addTransaction, updateProduct, isLoading } = useLocalDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 5);
    }, [products, searchTerm]);

    const addToAudit = (product: any) => {
        if (auditItems.find(item => item.id === product.id)) {
            toast.error('Produto já está na lista de auditoria.');
            return;
        }

        setAuditItems([...auditItems, {
            id: product.id,
            name: product.name,
            sku: product.sku,
            systemStock: product.quantity,
            physicalStock: product.quantity, // Inicia igual ao sistema
            difference: 0
        }]);
        setSearchTerm('');
    };

    const updatePhysicalStock = (id: number, val: number) => {
        setAuditItems(auditItems.map(item => {
            if (item.id === id) {
                const diff = val - item.systemStock;
                return { ...item, physicalStock: val, difference: diff };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setAuditItems(auditItems.filter(item => item.id !== id));
    };

    const handleFinishAudit = async () => {
        if (auditItems.length === 0) {
            toast.error('Nenhum item para auditar.');
            return;
        }

        const itemsWithDiff = auditItems.filter(item => item.difference !== 0);

        if (itemsWithDiff.length === 0) {
            if (!window.confirm('Nenhuma divergência encontrada. Finalizar auditoria mesmo assim?')) return;
        } else {
            if (!window.confirm(`Você está prestes a ajustar o estoque de ${itemsWithDiff.length} produtos. Confirmar?`)) return;
        }

        try {
            for (const item of itemsWithDiff) {
                // Criar transação de ajuste
                const transaction = {
                    type: item.difference > 0 ? 'adjustment_in' : 'adjustment_out' as any,
                    product_id: item.id,
                    quantity: Math.abs(item.difference),
                    total: 0,
                    payment_status: 'paid' as any,
                    payment_method: 'system',
                    notes: `Ajuste via Auditoria de Estoque. Anterior: ${item.systemStock}, Novo: ${item.physicalStock}`,
                    created_at: new Date().toISOString()
                };

                await addTransaction(transaction);

                // Atualizar estoque do produto diretamente (o context geralmente faz isso via hook de transação, 
                // mas dependendo da implementação pode ser necessário atualizar o estado local se o hook for async)
                await updateProduct(item.id, { quantity: item.physicalStock });
            }

            toast.success('Auditoria finalizada e estoque atualizado!');
            setAuditItems([]);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar auditoria.');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando estoque...</div>;

    const totalDiffItems = auditItems.filter(i => i.difference !== 0).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                        Auditoria de Estoque (Balanço)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Conferência física do inventário vs Sistema.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setAuditItems([])}
                        className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                    >
                        Limpar
                    </button>
                    <button
                        onClick={handleFinishAudit}
                        disabled={auditItems.length === 0}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 dark:shadow-none transition-all disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        Finalizar e Ajustar
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Lateral: Busca e Resumo */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Adicionar Produto</label>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nome ou SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        {filteredProducts.length > 0 && (
                            <div className="space-y-2">
                                {filteredProducts.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToAudit(p)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl text-left transition-all border border-transparent hover:border-emerald-100"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-gray-400">
                                            {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-xl" alt="" /> : p.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-gray-800 dark:text-white truncate">{p.name}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">Estoque: {p.quantity}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200 dark:shadow-none">
                        <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-4">Resumo da Auditoria</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-sm opacity-80">Itens na Lista</span>
                                <span className="text-2xl font-black">{auditItems.length}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm opacity-80">Divergências</span>
                                <span className={`text-2xl font-black ${totalDiffItems > 0 ? 'text-yellow-200' : ''}`}>{totalDiffItems}</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Principal: Tabela de Auditoria */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
                                Lista de Verificação
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            {auditItems.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Produto</th>
                                            <th className="px-6 py-4 text-center">No Sistema</th>
                                            <th className="px-6 py-4 text-center">Contagem Física</th>
                                            <th className="px-6 py-4 text-center">Diferença</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {auditItems.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold">{item.sku || 'SEM SKU'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-gray-600 dark:text-gray-400">
                                                    {item.systemStock}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <input
                                                            type="number"
                                                            value={item.physicalStock}
                                                            onChange={(e) => updatePhysicalStock(item.id, parseInt(e.target.value) || 0)}
                                                            className="w-20 text-center font-black py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.difference === 0 ? (
                                                        <span className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-500">
                                                            <CheckCircle2 className="w-4 h-4" /> Bateu
                                                        </span>
                                                    ) : (
                                                        <span className={`flex items-center justify-center gap-1 text-xs font-black ${item.difference > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                            <AlertTriangle className="w-4 h-4" />
                                                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => removeItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 text-center space-y-6">
                                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                                        <ClipboardCheck className="w-12 h-12 text-gray-200" />
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Inicie o Balanço</h3>
                                        <p className="text-sm text-gray-400 mt-2">Adicione os produtos que deseja conferir na prateleira. O sistema ajustará as diferenças automaticamente ao finalizar.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryAudit;

