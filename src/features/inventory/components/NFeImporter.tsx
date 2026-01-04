import React, { useState, useRef } from 'react';
import { Upload, Check, Truck, Plus, AlertCircle, Save } from 'lucide-react';
import { nfeParser, NFeData, NFeItem } from '@/services/nfeParser';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { generateUniqueId } from '@/shared/utils/idGenerator';

interface MappedItem extends NFeItem {
    id: string; // ID temporário para a lista
    manualProductId?: number;
    isNewProduct?: boolean;
    editedQuantity: number;
    editedUnitPrice: number;
    matchedBy?: 'ean' | 'sku' | 'mapping' | 'none';
}

const NFeImporter: React.FC = () => {
    const [nfeData, setNFeData] = useState<NFeData | null>(null);
    const [mappedItems, setMappedItems] = useState<MappedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'review' | 'importing'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        products,
        suppliers,
        addProduct,
        updateProduct,
        addSupplier,
        updateSupplier,
        addTransaction
    } = useLocalDatabase();

    const navigate = useNavigate();

    // Tentar encontrar o produto ideal para um item da NFe
    const findBestMatch = (item: NFeItem, supplierCnpj?: string): { productId?: number, method: 'ean' | 'sku' | 'mapping' | 'none' } => {
        // 1. Tentar por mapping persistente (Aprendizado do sistema)
        if (supplierCnpj) {
            const mappedProduct = products.find(p => p.supplier_mappings?.[supplierCnpj] === item.code);
            if (mappedProduct) return { productId: mappedProduct.id, method: 'mapping' };
        }

        // 2. Tentar por EAN (Código de barras)
        if (item.ean && item.ean !== "SEM GTIN") {
            const eanMatch = products.find(p => p.barcode === item.ean);
            if (eanMatch) return { productId: eanMatch.id, method: 'ean' };
        }

        // 3. Tentar por SKU (Código do fabricante no nosso SKU)
        const skuMatch = products.find(p => p.sku === item.code);
        if (skuMatch) return { productId: skuMatch.id, method: 'sku' };

        return { method: 'none' };
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = nfeParser.parseNFe(content);
                setNFeData(parsedData);

                // Mapear itens iniciais
                const initialMapped = parsedData.items.map(item => {
                    const match = findBestMatch(item, parsedData.supplier.cnpj);
                    return {
                        ...item,
                        id: generateUniqueId().toString(),
                        manualProductId: match.productId,
                        isNewProduct: !match.productId,
                        editedQuantity: item.quantity,
                        editedUnitPrice: item.unitPrice,
                        matchedBy: match.method
                    };
                });

                setMappedItems(initialMapped);
                setStep('review');
                toast.success('Nota Fiscal lida com sucesso!');
            } catch (error) {
                console.error(error);
                toast.error('Erro ao ler o arquivo XML. Verifique se é uma NFe válida.');
            } finally {
                setLoading(false);
            }
        };

        reader.readAsText(file);
    };

    const handleItemProductChange = (itemId: string, productId: number | 'new') => {
        setMappedItems(items => items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    manualProductId: productId === 'new' ? undefined : productId,
                    isNewProduct: productId === 'new'
                };
            }
            return item;
        }));
    };

    const handleItemDataChange = (itemId: string, field: 'editedQuantity' | 'editedUnitPrice', value: number) => {
        setMappedItems(items => items.map(item => {
            if (item.id === itemId) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleImport = async () => {
        if (!nfeData) return;
        setStep('importing');

        try {
            // 1. Processar Fornecedor (Identificação Robusta por CNPJ)
            let supplierId: number;
            const existingSupplier = suppliers.find(s =>
                (s.cnpj && s.cnpj === nfeData.supplier.cnpj) ||
                (s.name.toLowerCase() === nfeData.supplier.name.toLowerCase())
            );

            if (existingSupplier) {
                supplierId = existingSupplier.id;
                // Atualizar CNPJ se não tiver
                if (!existingSupplier.cnpj) {
                    updateSupplier(existingSupplier.id, { cnpj: nfeData.supplier.cnpj });
                }
            } else {
                // Criar novo fornecedor
                const newSupplier = {
                    name: nfeData.supplier.tradeName || nfeData.supplier.name,
                    cnpj: nfeData.supplier.cnpj,
                    contact_person: nfeData.supplier.name,
                    address: `${nfeData.supplier.address.street}, ${nfeData.supplier.address.number} - ${nfeData.supplier.address.city}/${nfeData.supplier.address.state}`,
                    phone: nfeData.supplier.phone
                };

                // Adicionar fornecedor (Simulando fluxo síncrono para o exemplo)
                addSupplier(newSupplier as any);
                // Aguardar um pouco para garantir que o estado local foi atualizado (idêntico ao anterior para compatibilidade)
                await new Promise(resolve => setTimeout(resolve, 300));

                const updatedSuppliers = suppliers;
                const created = updatedSuppliers.find(s => s.cnpj === nfeData.supplier.cnpj);
                supplierId = created ? created.id : generateUniqueId();
            }

            // 2. Processar Produtos
            const transactionItems: any[] = [];
            let totalImportedValue = 0;

            for (const item of mappedItems) {
                let productId: number;

                if (item.isNewProduct) {
                    productId = generateUniqueId();
                    addProduct({
                        name: item.name,
                        description: `Imp. NFe: ${nfeData.number} - Cód: ${item.code}`,
                        category: 'Geral',
                        quantity: item.editedQuantity,
                        cost: item.editedUnitPrice,
                        sale_price: item.editedUnitPrice * 1.5,
                        barcode: item.ean !== "SEM GTIN" ? item.ean : undefined,
                        sku: item.code,
                        supplier_id: supplierId,
                        unit: item.uom,
                        supplier_mappings: nfeData.supplier.cnpj ? { [nfeData.supplier.cnpj]: item.code } : {}
                    } as any);
                } else if (item.manualProductId) {
                    productId = item.manualProductId;
                    const existingProduct = products.find(p => p.id === productId);

                    if (existingProduct) {
                        const newMappings = { ...(existingProduct.supplier_mappings || {}) };
                        if (nfeData.supplier.cnpj) {
                            newMappings[nfeData.supplier.cnpj] = item.code;
                        }

                        updateProduct(productId, {
                            quantity: (existingProduct.quantity || 0) + item.editedQuantity,
                            cost: item.editedUnitPrice,
                            supplier_mappings: newMappings,
                            updated_at: new Date().toISOString()
                        });
                    }
                } else {
                    continue; // Pular item se não tiver produto vinculado nem for novo
                }

                transactionItems.push({
                    product_id: productId,
                    quantity: item.editedQuantity,
                    unit_price: item.editedUnitPrice,
                    total: item.editedQuantity * item.editedUnitPrice
                });

                totalImportedValue += (item.editedQuantity * item.editedUnitPrice);
            }

            // 3. Registrar Transação
            addTransaction({
                type: 'purchase',
                payment_status: 'pending',
                description: `Importação NFe ${nfeData.number} [Aprendizado Ativo]`,
                items: transactionItems,
                total: totalImportedValue
            });

            toast.success(`Importação realizada! Sistema aprendeu ${mappedItems.filter(i => !i.isNewProduct).length} vínculos.`);
            setTimeout(() => navigate('/inventory'), 1500);

        } catch (error) {
            console.error('Erro na importação:', error);
            toast.error('Ocorreu um erro ao importar os dados.');
            setStep('review');
        }
    };

    if (step === 'upload') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Importador de NFe Inteligente</h1>
                    <p className="text-gray-600 dark:text-gray-400">Arraste o XML para entrada de estoque com aprendizado automático.</p>
                </div>

                <div
                    className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-16 text-center hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer bg-white dark:bg-gray-800 shadow-xl group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept=".xml"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <div className="bg-blue-100 dark:bg-blue-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Upload size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Carregar Nota Fiscal (XML)</h3>
                    <p className="text-gray-500">Clique ou arraste o arquivo aqui</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                            <Save size={20} />
                        </div>
                        <h4 className="font-bold mb-2">Memória Própria</h4>
                        <p className="text-xs text-gray-500">O sistema lembra quais produtos você vinculou a cada fornecedor.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
                            <Plus size={20} />
                        </div>
                        <h4 className="font-bold mb-2">Vincular e Criar</h4>
                        <p className="text-xs text-gray-500">Associe itens da nota a produtos existentes ou crie novos na hora.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                            <Truck size={20} />
                        </div>
                        <h4 className="font-bold mb-2">Gestão de Fornecedores</h4>
                        <p className="text-xs text-gray-500">Atualização automática de dados cadastrais e CNPJ via NFe.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Revisão de Importação Inteligente</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">NFe {nfeData?.number}</span>
                        <span className="text-sm text-gray-400">Emitente: {nfeData?.supplier.name}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setStep('upload')}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={step === 'importing' || loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 animate-in fade-in zoom-in"
                    >
                        {step === 'importing' ? 'Processando...' : <><Check size={20} /> Confirmar Entrada</>}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Status/Vínculo</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Item na Nota</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Qtd. Nota</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Qtd. Entrada</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Custo Un.</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {mappedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 w-64">
                                        <div className="space-y-2">
                                            {item.isNewProduct ? (
                                                <div className="flex items-center gap-2 text-purple-600 font-bold text-xs bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                                                    <Plus size={14} /> Novo Produto
                                                </div>
                                            ) : item.manualProductId ? (
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                                                    <Check size={14} /> {item.matchedBy === 'mapping' ? 'Vínculo Memorizado' : 'Encontrado no Estoque'}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                                                    <AlertCircle size={14} /> Não Identificado
                                                </div>
                                            )}

                                            <select
                                                value={item.isNewProduct ? 'new' : (item.manualProductId || '')}
                                                onChange={(e) => handleItemProductChange(item.id, e.target.value === 'new' ? 'new' : Number(e.target.value))}
                                                className="w-full text-[11px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">-- Selecionar Produto --</option>
                                                <option value="new">+ Cadastrar como Novo</option>
                                                <optgroup label="Produtos Existentes">
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Cód: {item.code} {item.ean && `| EAN: ${item.ean}`}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs text-gray-400">{item.quantity} {item.uom}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right w-32">
                                        <input
                                            type="number"
                                            value={item.editedQuantity}
                                            onChange={(e) => handleItemDataChange(item.id, 'editedQuantity', Number(e.target.value))}
                                            className="w-full text-right bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-transparent focus:border-blue-500 p-1 text-sm font-bold outline-none"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right w-32">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.editedUnitPrice}
                                            onChange={(e) => handleItemDataChange(item.id, 'editedUnitPrice', Number(e.target.value))}
                                            className="w-full text-right bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-transparent focus:border-blue-500 p-1 text-sm font-bold outline-none"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-black text-blue-600">
                                            {(item.editedQuantity * item.editedUnitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50 dark:bg-gray-900/50 font-black">
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-right text-gray-500 uppercase text-[10px]">Total da Entrada</td>
                                <td className="px-6 py-4 text-right text-xl text-emerald-600">
                                    {mappedItems.reduce((acc, item) => acc + (item.editedQuantity * item.editedUnitPrice), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NFeImporter;
