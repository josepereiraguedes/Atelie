import React, { useState, useEffect } from 'react';
import { catalogHistoryService, CatalogTemplate } from '@/services/catalogHistory';
import { catalogThemes } from '@/services/catalogThemes';
import { CatalogThemeConfig } from '@/shared/types/database.types';
import { CatalogTheme, WatermarkConfig } from '@/shared/types/database.types';
import toast from 'react-hot-toast';
import { Star, Plus, Save, X, Trash2 } from 'lucide-react';

interface TemplateManagerProps {
    onApplyTemplate: (template: CatalogTemplate) => void;
    currentTheme?: CatalogTheme;
    currentTitle?: string;
    currentWatermark?: WatermarkConfig;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
    onApplyTemplate,
    currentTheme,
    currentTitle,
    currentWatermark
}) => {
    const [templates, setTemplates] = useState<CatalogTemplate[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const items = catalogHistoryService.getTemplates();
        setTemplates(items);
    };

    const handleSaveAsTemplate = () => {
        if (!newTemplateName.trim()) {
            toast.error('Digite um nome para o template');
            return;
        }

        if (!currentTheme || !currentTitle) {
            toast.error('Configure tema e título primeiro');
            return;
        }

        catalogHistoryService.saveTemplate({
            name: newTemplateName,
            theme: currentTheme,
            titlePattern: currentTitle,
            watermark: currentWatermark
        });

        setNewTemplateName('');
        setIsCreating(false);
        loadTemplates();
        toast.success('Template salvo com sucesso!');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Deseja realmente excluir este template?')) {
            catalogHistoryService.deleteTemplate(id);
            loadTemplates();
            toast.success('Template excluído');
        }
    };

    const handleApply = (template: CatalogTemplate) => {
        onApplyTemplate(template);
        toast.success(`Template "${template.name}" aplicado!`);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Templates Salvos
                </h3>
                {!isCreating && currentTheme && currentTitle && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                        <Plus className="w-3 h-3" />
                        Salvar Atual
                    </button>
                )}
            </div>

            {/* Formulário de criação */}
            {isCreating && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="Nome do template..."
                            className="flex-1 px-3 py-2 text-sm border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveAsTemplate()}
                        />
                        <button
                            onClick={handleSaveAsTemplate}
                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            title="Salvar"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setNewTemplateName('');
                            }}
                            className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Cancelar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Salvará: {catalogThemes[currentTheme!]?.name} + "{currentTitle}"
                    </p>
                </div>
            )}

            {/* Lista de templates */}
            <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => {
                    const theme = catalogThemes[template.theme];

                    return (
                        <button
                            key={template.id}
                            onClick={() => handleApply(template)}
                            className="group relative p-3 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-md"
                        >
                            {/* Indicador de tema */}
                            <div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.colors.headerGradient[0]}, ${theme.colors.headerGradient[theme.colors.headerGradient.length - 1]})`
                                }}
                            />

                            {/* Conteúdo */}
                            <div className="pr-8">
                                <div className="flex items-center gap-1 mb-1">
                                    {template.isSystem && (
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    )}
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                        {template.name}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {theme.name}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                                    "{template.titlePattern}"
                                </p>
                            </div>

                            {/* Botão deletar (apenas customizados) */}
                            {!template.isSystem && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(template.id);
                                    }}
                                    className="absolute bottom-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded transition-all"
                                    title="Excluir template"
                                >
                                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                </button>
                            )}
                        </button>
                    );
                })}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum template salvo</p>
                    <p className="text-xs mt-1">Configure e salve seus favoritos!</p>
                </div>
            )}
        </div>
    );
};
