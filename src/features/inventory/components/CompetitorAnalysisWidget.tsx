
import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Loader2, ExternalLink, Eye, Download, Image as ImageIcon, X } from 'lucide-react';
import { marketSpy } from '@/services/marketSpy';

interface CompetitorAnalysisWidgetProps {
    productName: string;
    currentPrice: number;
    onApplyPrice: (newPrice: number) => void;
    onImportProduct?: (productData: any) => void;
}

export const CompetitorAnalysisWidget: React.FC<CompetitorAnalysisWidgetProps> = ({ productName, currentPrice, onApplyPrice, onImportProduct }) => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(productName || '');
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [productDetails, setProductDetails] = useState<any>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [margin, setMargin] = useState(30);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [importingBatch, setImportingBatch] = useState(false);

    useEffect(() => {
        if (productName && !searchTerm) setSearchTerm(productName);
    }, [productName]);

    const handleAnalyze = async () => {
        if (!searchTerm.trim()) {
            setError('Digite algo para buscar.');
            return;
        }
        setLoading(true);
        setError('');
        setCompetitors([]);
        setStats(null);
        setSelectedIds(new Set());
        try {
            const data = await marketSpy.analyzeMercadoLivre(searchTerm);
            setCompetitors(data.competitors || []);
            setStats({
                minPrice: data.minPrice,
                averagePrice: data.averagePrice,
                suggestedPrice: data.suggestedPrice
            });
        } catch (err: any) {
            setError(err.message || 'Erro ao analisar concorrência');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (product: any) => {
        setSelectedProduct(product);
        setProductDetails(null);
        setDetailsLoading(true);
        setActiveImageIndex(0);
        try {
            const response = await fetch(`http://localhost:3001/api/market-spy/details?url=${encodeURIComponent(product.permalink)}`);
            const details = await response.json();
            setProductDetails(details);
        } catch (err) {
            console.error(err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === competitors.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(competitors.map(c => c.id)));
        }
    };

    const downloadImageLocally = async (url: string, fileName?: string): Promise<string> => {
        if (!url || !url.startsWith('http')) return url || '';
        try {
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, fileName, folder: 'ml-imports' })
            });
            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('Erro ao baixar imagem:', error);
            return url;
        }
    };

    const handleImportToStock = async (compOverride?: any, detailsOverride?: any) => {
        const targetComp = compOverride || selectedProduct;
        const targetDetails = detailsOverride || productDetails;
        if (!targetDetails || !targetComp) return;

        setLoading(true);
        try {
            // Processar Galeria de Imagens Completa
            const productImages = targetDetails.images || (targetComp.thumbnail ? [targetComp.thumbnail] : []);
            const localImages = [];

            // Baixar todas as imagens para o servidor local
            for (let i = 0; i < productImages.length; i++) {
                const imgUrl = productImages[i];
                if (imgUrl?.startsWith('http')) {
                    // Limita a 10 imagens para não sobrecarregar
                    if (i >= 10) break;
                    const localUrl = await downloadImageLocally(imgUrl, `${targetComp.id}-${i}.jpg`);
                    localImages.push(localUrl);
                } else if (imgUrl) {
                    localImages.push(imgUrl);
                }
            }

            const mainImageUrl = localImages[0] || (targetComp.thumbnail);

            const calculatedSalePrice = targetComp.price * (1 + margin / 100);
            const newProduct = {
                name: targetComp.title,
                description: targetDetails.description,
                sale_price: Number(calculatedSalePrice.toFixed(2)),
                cost: targetComp.price,
                quantity: 0,
                image: mainImageUrl,   // Imagem principal para a listagem
                images: localImages,   // Nova Galeria completa
                videos: targetDetails.videos || [],
                barcode: targetDetails.ean,
                category: targetDetails.category_path?.[targetDetails.category_path.length - 1] || 'Importados ML',
                supplier: 'Mercado Livre',
                features: targetDetails.item_attributes || targetDetails.technicalSpecs,
                technicalSpecs: targetDetails.technicalSpecs || targetDetails.item_attributes,
                marketplace_link: targetComp.permalink
            };

            if (onImportProduct) {
                await onImportProduct(newProduct);
                if (!compOverride) setSelectedProduct(null);
            }
        } catch (err) {
            console.error('Erro ao importar:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImport = async () => {
        if (selectedIds.size === 0) return;
        setImportingBatch(true);
        const toImport = competitors.filter(c => selectedIds.has(c.id));
        let successCount = 0;
        for (const comp of toImport) {
            try {
                const response = await fetch(`http://localhost:3001/api/market-spy/details?url=${encodeURIComponent(comp.permalink)}`);
                const details = await response.json();
                await handleImportToStock(comp, details);
                successCount++;
            } catch (err) {
                console.error(`Erro ao importar ${comp.title}:`, err);
            }
        }
        setImportingBatch(false);
        setSelectedIds(new Set());
        alert(`${successCount} produtos importados com sucesso!`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Análise Competitiva
                </h3>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder="Pesquise no Mercado Livre..."
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={loading || !searchTerm.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Buscar
                    </button>
                </div>

                {competitors.length > 0 && (
                    <div className="flex items-center justify-between py-2 px-3 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={selectedIds.size === competitors.length} onChange={toggleSelectAll} className="w-4 h-4" />
                            <span className="text-sm font-medium text-blue-800">{selectedIds.size > 0 ? `${selectedIds.size} selecionados` : 'Selecionar Tudo'}</span>
                        </div>
                        {selectedIds.size > 0 && (
                            <button onClick={handleBulkImport} disabled={importingBatch} className="px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center gap-2">
                                {importingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Importar {selectedIds.size}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Mínimo</div>
                        <div className="text-xl font-bold text-green-600">R$ {stats.minPrice.toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Média</div>
                        <div className="text-xl font-bold text-blue-600">R$ {stats.averagePrice.toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-xs text-purple-700 uppercase font-bold mb-1">Sugestão</div>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-purple-700">R$ {stats.suggestedPrice.toFixed(2)}</span>
                            <button onClick={() => onApplyPrice(stats.suggestedPrice)} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            {competitors.length > 0 && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {competitors.map((comp, index) => (
                        <div key={`${comp.id}-${index}`} onClick={() => toggleSelect(comp.id)} className={`flex items-center justify-between p-3 cursor-pointer rounded-lg border transition-all ${selectedIds.has(comp.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input type="checkbox" checked={selectedIds.has(comp.id)} readOnly className="w-4 h-4" />
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 p-1">
                                    {comp.thumbnail ? <img src={comp.thumbnail} className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-gray-300" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-gray-900 truncate">{comp.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-sm font-bold ${comp.price < currentPrice ? 'text-red-500' : 'text-green-600'}`}>R$ {comp.price.toFixed(2)}</span>
                                        {comp.shipping?.free_shipping && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Frete Grátis</span>}
                                        {comp.ean && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">EAN</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleViewDetails(comp)} className="p-2 text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                                <a href={comp.permalink} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-gray-600"><ExternalLink className="w-4 h-4" /></a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedProduct && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 truncate pr-4">{selectedProduct.title}</h3>
                            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            {detailsLoading ? (
                                <div className="flex flex-col items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" /><p className="text-gray-500">Analisando produto...</p></div>
                            ) : productDetails ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="aspect-square bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-4">
                                            {productDetails.images?.[activeImageIndex] ? <img src={productDetails.images[activeImageIndex]} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-20 h-20 text-gray-300" />}
                                        </div>
                                        {productDetails.images?.length > 1 && (
                                            <div className="grid grid-cols-5 gap-2">
                                                {productDetails.images.slice(0, 5).map((img: string, i: number) => (
                                                    <div key={i} onClick={() => setActiveImageIndex(i)} className={`aspect-square bg-white border rounded-xl overflow-hidden cursor-pointer p-1 ${activeImageIndex === i ? 'border-blue-500' : 'border-gray-200'}`}><img src={img} className="w-full h-full object-contain" /></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-8">
                                        <div className="text-3xl font-bold text-gray-900">R$ {selectedProduct.price.toFixed(2)}</div>
                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold">Ficha Técnica</div>
                                            <div className="divide-y divide-gray-100">
                                                {productDetails.item_attributes?.slice(0, 8).map((attr: any, i: number) => (
                                                    <div key={i} className="flex justify-between p-3 text-sm"><span className="text-gray-500">{attr.name}</span><span className="font-medium text-right ml-4">{attr.value}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-600 max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed">{productDetails.description || 'Sem descrição.'}</div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        {productDetails && (
                            <div className="bg-blue-50 p-4 border-t border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Custo (ML)</label><div className="text-gray-900 font-medium">R$ {selectedProduct.price.toFixed(2)}</div></div>
                                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Margem (%)</label><input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-20 px-2 py-1 border border-blue-200 rounded text-sm" /></div>
                                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Venda Sugerida</label><div className="text-xl font-bold text-green-700">R$ {(selectedProduct.price * (1 + margin / 100)).toFixed(2)}</div></div>
                                <button type="button" onClick={() => handleImportToStock()} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 justify-center"><Download className="w-5 h-5" /> IMPORTAR</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

