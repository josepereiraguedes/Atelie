import React, { useState, useEffect } from 'react';
import { X, Download, Sparkles, Settings, Star, History as HistoryIcon, Zap, Users } from 'lucide-react';
import { CatalogTheme, CatalogProduct, WatermarkConfig } from '@/shared/types/database.types';
import { catalogService } from '@/features/catalog/services/catalogService';
import { catalogThemes } from '@/services/catalogThemes';
import { catalogHistoryService, CatalogHistoryItem, CatalogTemplate } from '@/services/catalogHistory';
import { animatedCatalogService } from '@/services/animatedCatalogService';
import { TemplateManager } from './TemplateManager';
import { HistoryGallery } from './HistoryGallery';
import { BroadcastListManager } from './BroadcastListManager';
import toast from 'react-hot-toast';

interface CatalogPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: CatalogProduct[];
    initialTitle: string;
    initialTheme: CatalogTheme;
    onConfirm: (theme: CatalogTheme, title: string, watermark: WatermarkConfig) => void;
}

export const CatalogPreviewModal: React.FC<CatalogPreviewModalProps> = ({
    isOpen,
    onClose,
    products,
    initialTitle,
    initialTheme,
    onConfirm
}) => {
    const [selectedTheme, setSelectedTheme] = useState<CatalogTheme>(initialTheme);
    const [title, setTitle] = useState(initialTitle);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [watermarkEnabled, setWatermarkEnabled] = useState(false);
    const [instagram, setInstagram] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [activeTab, setActiveTab] = useState<'customize' | 'templates' | 'history' | 'advanced'>('customize');
    const [showBroadcast, setShowBroadcast] = useState(false);

    // Gerar preview quando tema ou título mudar
    useEffect(() => {
        if (isOpen && products.length > 0) {
            generatePreview();
        }
    }, [selectedTheme, isOpen]);

    const generatePreview = async () => {
        setIsGenerating(true);
        try {
            const watermark: WatermarkConfig = {
                enabled: watermarkEnabled,
                type: 'text',
                content: 'Preview',
                position: 'bottom-right',
                opacity: 0.5,
                socialMedia: {
                    instagram: instagram || undefined,
                    whatsapp: whatsapp || undefined
                }
            };

            const result = await catalogService.generateCatalog({
                products,
                title,
                theme: selectedTheme,
                watermark
            });

            const url = URL.createObjectURL(result.blob);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(url);
        } catch (error) {
            toast.error('Erro ao gerar preview');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        const watermark: WatermarkConfig = {
            enabled: watermarkEnabled,
            type: 'text',
            content: '',
            position: 'bottom-right',
            opacity: 0.6,
            socialMedia: {
                instagram: instagram || undefined,
                whatsapp: whatsapp || undefined
            }
        };
        onConfirm(selectedTheme, title, watermark);
    };

    const handleApplyTemplate = (template: CatalogTemplate) => {
        setSelectedTheme(template.theme);
        setTitle(template.titlePattern);
        if (template.watermark) {
            setWatermarkEnabled(template.watermark.enabled);
            setInstagram(template.watermark.socialMedia?.instagram || '');
            setWhatsapp(template.watermark.socialMedia?.whatsapp || '');
        }
        setActiveTab('customize');
    };

    const handleReuseHistory = (item: CatalogHistoryItem) => {
        setSelectedTheme(item.theme);
        setTitle(item.title);
        if (item.watermark) {
            setWatermarkEnabled(item.watermark.enabled);
            setInstagram(item.watermark.socialMedia?.instagram || '');
            setWhatsapp(item.watermark.socialMedia?.whatsapp || '');
        }
        setActiveTab('customize');
    };

    const handleGenerateSequence = async () => {
        const toastId = toast.loading('Gerando sequência animada...');
        try {
            const result = await animatedCatalogService.generateAnimatedSequence(
                products,
                title,
                selectedTheme
            );

            // Baixar todos os frames
            await animatedCatalogService.downloadSequenceAsZip(
                result.frames,
                title.toLowerCase().replace(/\s+/g, '_')
            );

            toast.success(
                `Sequência de ${result.totalFrames} frames gerada! Baixando...`,
                { id: toastId, duration: 5000 }
            );
        } catch (error) {
            toast.error('Erro ao gerar sequência', { id: toastId });
        }
    };

    const handleSendToList = (listId: string, listName: string) => {
        toast.success(`Preparando envio para lista: ${listName}`);
        setShowBroadcast(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="w-6 h-6" />
                            Personalize seu Catálogo
                        </h2>
                        <p className="text-sm text-blue-100 mt-1">
                            Escolha o tema perfeito e veja o preview em tempo real
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('customize')}
                            className={`px-4 py-2 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'customize'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Personalizar
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`px-4 py-2 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'templates'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Star className="w-4 h-4" />
                            Templates
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'history'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <HistoryIcon className="w-4 h-4" />
                            Histórico
                        </button>
                        <button
                            onClick={() => setActiveTab('advanced')}
                            className={`px-4 py-2 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'advanced'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Zap className="w-4 h-4" />
                            Avançado
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Conteúdo das Tabs */}
                        <div className="space-y-6">
                            {activeTab === 'customize' && (
                                <>
                                    {/* Título */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Título da Campanha
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white font-bold text-center"
                                            maxLength={30}
                                        />
                                    </div>

                                    {/* Seletor de Temas */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            Escolha o Tema
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.values(catalogThemes).map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setSelectedTheme(theme.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all ${selectedTheme === theme.id
                                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div
                                                            className="w-8 h-8 rounded-lg"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${theme.colors.headerGradient[0]}, ${theme.colors.headerGradient[theme.colors.headerGradient.length - 1]})`
                                                            }}
                                                        />
                                                        <div className="text-left">
                                                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                                {theme.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {theme.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Marca d'água */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Marca d'água
                                            </label>
                                            <button
                                                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${watermarkEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${watermarkEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>

                                        {watermarkEnabled && (
                                            <div className="space-y-3 animate-in slide-in-from-top duration-200">
                                                <input
                                                    type="text"
                                                    value={instagram}
                                                    onChange={(e) => setInstagram(e.target.value)}
                                                    placeholder="@seu_instagram"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                                />
                                                <input
                                                    type="text"
                                                    value={whatsapp}
                                                    onChange={(e) => setWhatsapp(e.target.value)}
                                                    placeholder="(00) 00000-0000"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão Regenerar */}
                                    <button
                                        onClick={generatePreview}
                                        disabled={isGenerating}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? 'Gerando Preview...' : '🔄 Atualizar Preview'}
                                    </button>
                                </>
                            )}

                            {activeTab === 'templates' && (
                                <TemplateManager
                                    onApplyTemplate={handleApplyTemplate}
                                    currentTheme={selectedTheme}
                                    currentTitle={title}
                                    currentWatermark={watermarkEnabled ? {
                                        enabled: true,
                                        type: 'text',
                                        content: '',
                                        position: 'bottom-right',
                                        opacity: 0.6,
                                        socialMedia: {
                                            instagram: instagram || undefined,
                                            whatsapp: whatsapp || undefined
                                        }
                                    } : undefined}
                                />
                            )}

                            {activeTab === 'history' && (
                                <HistoryGallery onReuse={handleReuseHistory} />
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-6">
                                    {/* Sequências Animadas */}
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-600" />
                                            Sequência para Stories
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Gera múltiplas imagens (1 por produto) otimizadas para Stories do Instagram
                                        </p>
                                        <button
                                            onClick={handleGenerateSequence}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            Gerar Sequência ({products.length} frames)
                                        </button>
                                    </div>

                                    {/* Listas de Transmissão */}
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-600" />
                                            Compartilhamento Direto
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Gerencie listas de transmissão e envie para múltiplos contatos
                                        </p>
                                        <button
                                            onClick={() => setShowBroadcast(!showBroadcast)}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Users className="w-5 h-5" />
                                            {showBroadcast ? 'Fechar' : 'Gerenciar Listas'}
                                        </button>
                                    </div>

                                    {/* Gerenciador de Broadcast */}
                                    {showBroadcast && (
                                        <div className="animate-in slide-in-from-top duration-200">
                                            <BroadcastListManager onSendToList={handleSendToList} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center min-h-[500px]">
                            {isGenerating ? (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">Gerando preview...</p>
                                </div>
                            ) : previewUrl ? (
                                <div className="w-full">
                                    <img
                                        src={previewUrl}
                                        alt="Preview do catálogo"
                                        className="w-full rounded-lg shadow-2xl"
                                    />
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                        Layout: {products.length} produto{products.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400">
                                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Clique em "Atualizar Preview" para visualizar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Gerar Catálogo Final
                    </button>
                </div>
            </div>
        </div>
    );
};

