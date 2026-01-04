import React, { useState, useEffect } from 'react';
import { History, Trash2, Send, Copy, RefreshCw } from 'lucide-react';
import { catalogHistoryService, CatalogHistoryItem } from '@/services/catalogHistory';
import { catalogThemes } from '@/services/catalogThemes';
import toast from 'react-hot-toast';

interface HistoryGalleryProps {
    onReuse: (item: CatalogHistoryItem) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ onReuse }) => {
    const [history, setHistory] = useState<CatalogHistoryItem[]>([]);
    const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const items = catalogHistoryService.getHistory();
        setHistory(items);

        // Carregar blobs e criar URLs
        const urls = new Map<string, string>();
        for (const item of items.slice(0, 20)) { // Carregar apenas os 20 mais recentes
            const blob = await catalogHistoryService.getCatalogBlob(item.id);
            if (blob) {
                urls.set(item.id, URL.createObjectURL(blob));
            }
        }
        setPreviewUrls(urls);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja realmente excluir este catálogo do histórico?')) {
            await catalogHistoryService.deleteCatalog(id);

            // Revogar URL
            const url = previewUrls.get(id);
            if (url) URL.revokeObjectURL(url);

            loadHistory();
            toast.success('Catálogo removido do histórico');
        }
    };

    const handleCopyImage = async (id: string) => {
        const blob = await catalogHistoryService.getCatalogBlob(id);
        if (blob && navigator.clipboard && window.ClipboardItem) {
            try {
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                toast.success('Imagem copiada para área de transferência!');
            } catch (error) {
                toast.error('Erro ao copiar imagem');
            }
        }
    };

    const handleReuse = (item: CatalogHistoryItem) => {
        onReuse(item);
        toast.success('Catálogo carregado! Ajuste e regenere se necessário.');
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    if (history.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum catálogo gerado ainda</p>
                <p className="text-sm mt-2">Seus catálogos aparecerão aqui automaticamente</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico de Catálogos ({history.length})
                </h3>
                {history.length > 0 && (
                    <button
                        onClick={() => {
                            if (window.confirm('Deseja limpar todo o histórico?')) {
                                catalogHistoryService.clearHistory();
                                previewUrls.forEach(url => URL.revokeObjectURL(url));
                                loadHistory();
                                toast.success('Histórico limpo');
                            }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                        Limpar Tudo
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => {
                    const theme = catalogThemes[item.theme];
                    const previewUrl = previewUrls.get(item.id);

                    return (
                        <div
                            key={item.id}
                            className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
                        >
                            {/* Preview */}
                            <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                )}

                                {/* Overlay com ações */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleReuse(item)}
                                        className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                                        title="Reutilizar"
                                    >
                                        <RefreshCw className="w-4 h-4 text-purple-600" />
                                    </button>
                                    <button
                                        onClick={() => handleCopyImage(item.id)}
                                        className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                                        title="Copiar Imagem"
                                    >
                                        <Copy className="w-4 h-4 text-blue-600" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                    {item.title}
                                </h4>
                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{theme.name}</span>
                                    <span>{formatDate(item.createdAt)}</span>
                                </div>
                                {item.sentCount > 0 && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                        <Send className="w-3 h-3" />
                                        <span>Enviado {item.sentCount}x</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
