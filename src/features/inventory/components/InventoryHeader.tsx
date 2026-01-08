
import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Download, MoreHorizontal, ShoppingCart, FileText, Plus } from 'lucide-react';


interface InventoryHeaderProps {
    onOpenSpyModal: () => void;
    isExportMenuOpen: boolean;
    setIsExportMenuOpen: (isOpen: boolean) => void;
    selectedCount: number;
    totalCount: number;
    onOpenMLIntegration: () => void;
    onExportShopee: (selectedOnly: boolean) => void;
    onExportMLCSV: () => void;
    onExportShopeeAll: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
    onOpenSpyModal,
    isExportMenuOpen,
    setIsExportMenuOpen,
    selectedCount,
    totalCount,
    onOpenMLIntegration,
    onExportShopee,
    onExportMLCSV,
    onExportShopeeAll
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={onOpenSpyModal}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <Brain className="w-4 h-4 mr-2" />
                    Importar do ML
                </button>

                <div className="relative">
                    <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-1.5" />
                        Exportar
                        <MoreHorizontal className="w-4 h-4 ml-1" />
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-20 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Selecionados ({selectedCount})</div>
                            <button
                                onClick={onOpenMLIntegration}
                                disabled={selectedCount === 0}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-4 h-4 mr-2 text-yellow-500" /> Mercado Livre (API)
                            </button>
                            <button
                                onClick={() => onExportShopee(true)}
                                disabled={selectedCount === 0}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-4 h-4 mr-2 text-red-500" /> Shopee
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Todos ({totalCount})</div>
                            <button onClick={onExportMLCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-yellow-500" /> Mercado Livre (CSV)</button>
                            <button onClick={onOpenMLIntegration} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-yellow-500" /> Mercado Livre (API)</button>
                            <button onClick={onExportShopeeAll} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-red-500" /> Shopee (Todos)</button>
                        </div>
                    )}
                </div>
                <Link to="/import-nfe" className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
                    <FileText className="w-4 h-4 mr-1.5" /> Importar NFe
                </Link>
                <Link to="/import-pdf" className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                    <FileText className="w-4 h-4 mr-1.5" /> Importar Catálogo
                </Link>
                <Link to="/inventory/new" className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors ml-2">
                    <Plus className="w-4 h-4 mr-1.5" /> Novo Produto
                </Link>
            </div>
        </div>
    );
};
