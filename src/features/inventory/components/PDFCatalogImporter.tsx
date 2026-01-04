import React, { useState, useRef } from 'react';
import { FileText, Check, AlertCircle, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { pdfExtractionService, ExtractedPDFItem } from '@/services/pdfExtractionService';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { generateUniqueId } from '@/shared/utils/idGenerator';
import PageHeader from '@/shared/components/forms/PageHeader';

const PDFCatalogImporter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [items, setItems] = useState<ExtractedPDFItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [processingProgress, setProcessingProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { addProduct } = useLocalDatabase();
    const navigate = useNavigate();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setStep('review');

        try {
            const { items: extractedItems } = await pdfExtractionService.extractData(selectedFile);

            // Tentar capturar imagens para os primeiros itens (para não pesar muito)
            const itemsWithImages = [...extractedItems];
            for (let i = 0; i < Math.min(itemsWithImages.length, 10); i++) {
                setProcessingProgress(Math.round(((i + 1) / Math.min(itemsWithImages.length, 10)) * 100));
                try {
                    const imgData = await pdfExtractionService.captureImageArea(
                        selectedFile,
                        itemsWithImages[i].page,
                        itemsWithImages[i].x,
                        itemsWithImages[i].y
                    );
                    itemsWithImages[i].image = imgData;
                } catch (e) {
                    console.error("Erro ao capturar imagem:", e);
                }
            }

            setItems(itemsWithImages);
            toast.success(`${extractedItems.length} produtos detectados no catálogo!`);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar PDF. Tente um arquivo diferente.');
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleItemChange = (id: string, field: keyof ExtractedPDFItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleImport = async () => {
        setLoading(true);
        try {
            for (const item of items) {
                await addProduct({
                    name: item.name,
                    description: `Importado de Catálogo PDF`,
                    category: item.category || 'Catálogo PDF',
                    quantity: 0,
                    cost: item.price,
                    sale_price: item.price * 1.5,
                    image: item.image,
                    sku: item.sku || `PDF-${generateUniqueId().toString().substring(0, 6)}`,
                    barcode: item.barcode,
                } as any);
            }
            toast.success(`${items.length} produtos adicionados ao estoque!`);
            navigate('/inventory');
        } catch (error) {
            toast.error('Erro ao salvar produtos.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'upload') {
        return (
            <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
                <PageHeader title="Importador de Catálogo PDF" subtitle="Extraia automaticamente fotos e informações de catálogos desestruturados." />

                <div
                    className="mt-8 border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-20 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer bg-white dark:bg-gray-800 shadow-2xl group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <div className="bg-blue-100 dark:bg-blue-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <FileText size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Selecione o Catálogo PDF</h3>
                    <p className="text-gray-500 dark:text-gray-400">O sistema usará análise estrutural para identificar campos e imagens.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Revisão do Catálogo 🧐</h1>
                    <p className="text-gray-500">{items.length} itens encontrados em "{file?.name}"</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setStep('upload')} className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold transition-colors">
                        Recomeçar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={loading || items.length === 0}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-xl shadow-blue-600/30 flex items-center gap-2"
                    >
                        {loading ? 'Importando...' : <><Check size={20} /> Importar Tudo</>}
                    </button>
                </div>
            </div>

            {loading && step === 'review' && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Analisando estrutura do PDF... {processingProgress}%</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <ImageIcon size={48} />
                                        <span className="text-xs mt-2 italic">Processando imagem...</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Produto</label>
                                    <input
                                        className="w-full font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-100 dark:border-gray-700 focus:border-blue-500 outline-none"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Preço</label>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400 text-xs font-bold">R$</span>
                                            <input
                                                type="number"
                                                className="w-full font-black text-blue-600 bg-transparent outline-none"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">REF/SKU</label>
                                        <input
                                            className="w-full font-medium text-gray-600 dark:text-gray-300 text-xs bg-transparent border-b border-gray-100 dark:border-gray-700 focus:border-blue-500 outline-none"
                                            value={item.sku || ''}
                                            placeholder="Detectando..."
                                            onChange={(e) => handleItemChange(item.id, 'sku', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Cód. de Barras (EAN)</label>
                                    <input
                                        className="w-full font-medium text-gray-600 dark:text-gray-300 text-xs bg-transparent border-b border-gray-100 dark:border-gray-700 focus:border-blue-500 outline-none"
                                        value={item.barcode || ''}
                                        placeholder="Detectando..."
                                        onChange={(e) => handleItemChange(item.id, 'barcode', e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2">
                                    <span>Página {item.page}</span>
                                    <span className="flex items-center gap-1">
                                        <AlertCircle size={10} /> Precisão: {Math.round(item.confidence * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50/50 transition-all h-full min-h-[300px]"
                    >
                        <Plus size={32} />
                        <span className="font-bold mt-2">Adicionar mais</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default PDFCatalogImporter;


