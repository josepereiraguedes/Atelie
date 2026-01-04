import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { labelService, LabelConfig } from '@/services/labelService';
import { Tag, Search, Printer, Trash2, LayoutGrid, Settings2, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const LabelGenerator: React.FC = () => {
    const { products, isLoading } = useLocalDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<(any & { labelQty: number })[]>([]);
    const [config, setConfig] = useState<LabelConfig>({
        width: 38,
        height: 21,
        columns: 5,
        rows: 13,
        fontSize: 10,
        showPrice: true,
        showName: true,
        showBarcode: true
    });

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [products, searchTerm]);

    const addProduct = (product: any) => {
        const exists = selectedProducts.find(p => p.id === product.id);
        if (exists) {
            updateQty(product.id, exists.labelQty + 1);
        } else {
            setSelectedProducts([...selectedProducts, { ...product, labelQty: 1 }]);
        }
        setSearchTerm('');
    };

    const updateQty = (id: number, qty: number) => {
        setSelectedProducts(selectedProducts.map(p =>
            p.id === id ? { ...p, labelQty: Math.max(1, qty) } : p
        ));
    };

    const removeProduct = (id: number) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            toast.error('Selecione ao menos um produto para imprimir.');
            return;
        }

        try {
            const doc = labelService.generatePDF(selectedProducts, config);
            const pdfBlob = doc.output('bloburl');
            window.open(pdfBlob.toString(), '_blank');
            toast.success('PDF Gerado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao gerar PDF de etiquetas.');
        }
    };

    if (isLoading) return <div className="p-8 text-center">Carregando catálogo...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tag className="w-8 h-8 text-blue-600" />
                        Gerador de Etiquetas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Crie etiquetas profissionais para gôndolas e precificação.</p>
                </div>
                <button
                    onClick={handlePrint}
                    disabled={selectedProducts.length === 0}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none transition-all disabled:opacity-50"
                >
                    <Printer className="w-5 h-5" />
                    Gerar PDF para Impressão
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Configuração e Busca */}
                <div className="space-y-6">
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Buscar Produtos
                        </h2>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Digite o nome ou SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {filteredProducts.length > 0 && (
                            <div className="space-y-2">
                                {filteredProducts.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addProduct(p)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-transparent hover:border-blue-100 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {p.image ? (
                                                <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Tag className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-bold text-gray-800 dark:text-white truncate max-w-[150px]">{p.name}</div>
                                                <div className="text-[10px] text-gray-400">R$ {p.sale_price.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <PackageCheck className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Ajustes do Layout (A4)
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500">Colunas</label>
                                <input
                                    type="number"
                                    value={config.columns}
                                    onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) || 1 })}
                                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900 border border-transparent rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Linhas</label>
                                <input
                                    type="number"
                                    value={config.rows}
                                    onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) || 1 })}
                                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900 border border-transparent rounded-lg text-sm"
                                />
                            </div>
                            <div className="col-span-2 space-y-2 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showPrice} onChange={e => setConfig({ ...config, showPrice: e.target.checked })} className="rounded text-blue-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Exibir Preço</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showName} onChange={e => setConfig({ ...config, showName: e.target.checked })} className="rounded text-blue-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Exibir Nome</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showBarcode} onChange={e => setConfig({ ...config, showBarcode: e.target.checked })} className="rounded text-blue-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Exibir SKU/Código</span>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Lista de Seleção */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <LayoutGrid className="w-6 h-6 text-blue-500" />
                                Itens Selecionados
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{selectedProducts.length} itens</span>
                            </h2>
                            {selectedProducts.length > 0 && (
                                <button onClick={() => setSelectedProducts([])} className="text-sm text-red-500 font-bold hover:underline flex items-center gap-1">
                                    <Trash2 className="w-4 h-4" /> Limpar Tudo
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            {selectedProducts.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Produto</th>
                                            <th className="px-6 py-4 text-center">Qtde Etiquetas</th>
                                            <th className="px-6 py-4 text-center">Preço</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {selectedProducts.map(p => (
                                            <tr key={p.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        {p.image ? (
                                                            <img src={p.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                                <Tag className="w-6 h-6 text-gray-300" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-black text-gray-900 dark:text-white">{p.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{p.sku || 'Sem SKU'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => updateQty(p.id, p.labelQty - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100">-</button>
                                                        <input
                                                            type="number"
                                                            className="w-12 text-center font-bold bg-transparent"
                                                            value={p.labelQty}
                                                            onChange={e => updateQty(p.id, parseInt(e.target.value) || 1)}
                                                        />
                                                        <button onClick={() => updateQty(p.id, p.labelQty + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100">+</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-blue-600">
                                                    R$ {p.sale_price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => removeProduct(p.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                                        <Printer className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Nenhum produto selecionado</h3>
                                        <p className="text-sm text-gray-400">Use o campo de busca ao lado para escolher os produtos que deseja etiquetar.</p>
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

export default LabelGenerator;

