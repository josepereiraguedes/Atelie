import React, { useState, useEffect, useMemo } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { useLocalDatabase } from "@/core/contexts/LocalDatabaseContext";
import { ProductCardSkeleton } from "@/shared/components";
import { CatalogPreviewModal } from "@/features/catalog/components/CatalogPreviewModal";
import { Link } from "react-router-dom";
import { Search, Plus, FileText, Download, MoreHorizontal, ShoppingCart, Brain, X, Package, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { handleError } from "@/shared/utils/errorHandler";
import { inventoryIntelligence } from "@/services/inventoryIntelligence";
import { catalogService } from "@/features/catalog/services/catalogService";
import { communicationService } from "@/services/communicationService";
import { catalogHistoryService } from "@/services/catalogHistory";
import { exportProductsToMercadoLivre, exportProductsToShopee } from "@/services/marketplaceExport";
import { Product } from "@/shared/types/database.types";
import { useConfig } from "@/core/contexts/ConfigContext";
import { WatermarkConfig, CatalogTheme } from "@/shared/types/database.types";
import { CompetitorAnalysisWidget } from "@/features/inventory/components/CompetitorAnalysisWidget";
import LowStockAlerts from "@/features/dashboard/components/LowStockAlerts";
import InventorySummary from "@/features/inventory/components/InventorySummary";
import { MercadoLivreIntegration } from "@/features/marketplace/components/MercadoLivreIntegration";

const Inventory: React.FC = () => {
  const { products, deleteProduct, addProduct, updateProduct, lowStockAlerts, isLoading, bulkUpdateProducts, transactions } = useLocalDatabase();
    const { company } = useConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [smartFilter, setSmartFilter] = useState<'all' | 'clearance' | 'premium'>('all');

  // Estado para o Modal de Inteligência
  const [isSpyModalOpen, setIsSpyModalOpen] = useState(false);
  const [spyProductData, setSpyProductData] = useState<{ name: string, price: number } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<CatalogTheme>('vibrant');
  
  // Estado para a integração com o Mercado Livre
  const [isMercadoLivreIntegrationOpen, setIsMercadoLivreIntegrationOpen] = useState(false);

  useEffect(() => {
    setSelectedProducts([]);
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
  }, []);

  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))].sort();
  }, [products]);

  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return [...new Set(products
      .filter(p => p.category === selectedCategory)
      .map(p => p.subcategory)
      .filter(Boolean))] as string[];
  }, [products, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });

    if (smartFilter === 'clearance') {
      const deadStockIds = inventoryIntelligence.analyzeDeadStock(products, transactions || [], 45).map(p => p.id);
      result = result.filter(p => deadStockIds.includes(p.id));
    } else if (smartFilter === 'premium') {
      const { productRanking } = inventoryIntelligence.analyzeProfitability(products, transactions || []);
      const premiumIds = productRanking.filter(p => p.margin >= 40).map(p => p.productId);
      result = result.filter(p => premiumIds.includes(p.id));
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedSubcategory, smartFilter, transactions]);

  const handleDeleteProduct = async (id: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      try {
        await deleteProduct(id);
        toast.success('Produto excluído!');
      } catch (error) {
        handleError(error, 'inventoryPage');
        toast.error('Erro ao excluir produto');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (window.confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produtos selecionados?`)) {
      try {
        for (const id of selectedProducts) {
          await deleteProduct(id);
        }
        toast.success(`${selectedProducts.length} produtos excluídos!`);
        setSelectedProducts([]);
      } catch (error) {
        toast.error('Erro ao excluir produtos em massa');
      }
    }
  };

  const handleQuickStockUpdate = async (product: Product, delta: number) => {
    try {
      const newQuantity = Math.max(0, (product.quantity || 0) + delta);
      await updateProduct(product.id!, { quantity: newQuantity });
      toast.success('Estoque atualizado!', { duration: 1000, icon: '📦' });
    } catch (error) {
      toast.error('Erro ao atualizar estoque');
    }
  };

  const isLowStock = (product: Product) => {
    return Number(product.quantity) <= Number(product.min_stock);
  };

  const exportAllProducts = (platform: 'mercado_livre' | 'shopee') => {
    try {
      if (platform === 'mercado_livre') {
        exportProductsToMercadoLivre(products);
        toast.success(`Exportados ${products.length} produtos para Mercado Livre!`);
      } else {
        exportProductsToShopee(products);
        toast.success(`Exportados ${products.length} produtos para Shopee!`);
      }
      setIsExportMenuOpen(false);
    } catch (error) {
      toast.error(`Erro ao exportar para ${platform === 'mercado_livre' ? 'Mercado Livre' : 'Shopee'}`);
    }
  };

  const handleBulkOffer = async () => {
    if (selectedProducts.length === 0) return;
    if (selectedProducts.length > 4) {
      toast.error("Selecione no máximo 4 produtos para o catálogo visual.");
      return;
    }

    // Abre modal de preview com personalização
    setIsPreviewModalOpen(true);
  };

  const handleCatalogConfirm = async (theme: CatalogTheme, title: string, watermark: WatermarkConfig) => {
    setIsPreviewModalOpen(false);
    const toastId = toast.loading('Gerando catálogo profissional...');

    try {
      const selectedItems = products.filter(p => selectedProducts.includes(p.id!));

      // Gerar catálogo com o novo serviço
      const result = await catalogService.generateCatalog({
        products: selectedItems.map(p => ({
          name: p.name,
          price: p.sale_price,
          image: p.image
        })),
        title,
        theme,
        watermark
      });

      // Copiar para área de transferência
      if (result.blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ [result.blob.type]: result.blob })]);
      }

      // Gerar mensagem de texto
      const templateData = {
        products: selectedItems.map(p => ({
          name: p.name,
          price: p.sale_price,
          image: p.image
        }))
      };
      const msg = communicationService.getTemplate('catalogo', templateData, company.name);
      communicationService.openWhatsApp('', msg, {}, true, company.name);

      // Salvar no histórico automaticamente
      await catalogHistoryService.saveCatalog(
        title,
        theme,
        result.layout,
        selectedItems.map(p => ({
          name: p.name,
          price: p.sale_price,
          image: p.image
        })),
        result.blob,
        watermark
      );

      toast.success(
        `Catálogo ${result.layout} gerado com tema ${theme}! Imagem copiada para área de transferência.`,
        { id: toastId, duration: 5000 }
      );
      setSelectedProducts([]);
    } catch (error) {
      toast.error('Erro ao gerar catálogo', { id: toastId });
    }
  };

  // Funções de Seleção
  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) setSelectedProducts([]);
    else setSelectedProducts(filteredProducts.map(p => p.id!));
  };

  const handleBulkStockUpdate = async () => {
    if (selectedProducts.length === 0) return;

    const quantityStr = prompt(`Definir nova quantidade para ${selectedProducts.length} produtos: `, "10");
    if (quantityStr === null) return;

    const quantity = parseInt(quantityStr);
    if (isNaN(quantity)) {
      toast.error("Quantidade inválida");
      return;
    }

    try {
      await bulkUpdateProducts(selectedProducts, { quantity });
      setSelectedProducts([]);
      toast.success('Estoque atualizado com sucesso!');
    } catch (error) {
      handleError(error, 'inventoryBulkUpdate');
    }
  };

  const selectLowStockProducts = () => {
    const lowStockIds = filteredProducts
      .filter(p => (p.quantity || 0) <= (p.min_stock || 5))
      .map(p => p.id!);

    if (lowStockIds.length === 0) {
      toast.error("Nenhum produto com estoque baixo encontrado nos filtros atuais.");
      return;
    }

    setSelectedProducts(lowStockIds);
    toast.success(`${lowStockIds.length} produtos com baixo estoque selecionados.`);
  };

  const handleDirectImport = async (importedData: any) => {
    try {
      const newProduct = {
        name: importedData.name,
        description: importedData.description || '',
        sku: `ML-${Date.now()}`,
        barcode: '',
        category_name: 'Importados ML',
        subcategory_name: '',
        supplier_id: 'Mercado Livre',
        image: importedData.image || '',
        images: importedData.images || [],
        videos: importedData.videos || [],
        cost: Number(importedData.cost) || 0,
        sale_price: Number(importedData.sale_price) || 0,
        quantity: Number(importedData.quantity) || 1,
        min_stock: 5,
        unit: 'un',
        marketplace_link: importedData.marketplace_link || '',
        brand: importedData.technicalSpecs?.brand || '',
        model: importedData.technicalSpecs?.model || '',
        weight: importedData.technicalSpecs?.weight ? parseFloat(importedData.technicalSpecs.weight) : undefined,
        technical_specs: importedData.features ? importedData.features.map((f: any) => ({ name: f.name, value: f.value })) : []
      };

      // @ts-ignore
      await addProduct(newProduct);

      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">Produto Cadastrado!</span>
          <span className="text-sm">{importedData.name}</span>
        </div>,
        { duration: 4000, icon: '👏' }
      );
      setIsSpyModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      toast.error('Erro ao importar: ' + errorMessage);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Modal de Preview e Personalização do Catálogo */}
      <CatalogPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        products={products.filter(p => selectedProducts.includes(p.id!)).map(p => ({
          name: p.name,
          price: p.sale_price,
          image: p.image
        }))}
        initialTitle="OFERTAS DA SEMANA"
        initialTheme={selectedTheme}
        onConfirm={handleCatalogConfirm}
      />

      {isSpyModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-yellow-300" />
                <div>
                  <h2 className="text-lg font-bold">
                    {spyProductData ? `Análise: ${spyProductData.name}` : 'Inteligência de Mercado ML'}
                  </h2>
                  <p className="text-xs text-indigo-100">Busque, analise e cadastre produtos em segundos.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSpyModalOpen(false);
                  setSpyProductData(null);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
              <CompetitorAnalysisWidget
                productName={spyProductData?.name || ""}
                currentPrice={spyProductData?.price || 0}
                onApplyPrice={(newPrice) => {
                  toast.success(`Preço sugerido: R$ ${newPrice.toFixed(2)}`);
                }}
                onImportProduct={handleDirectImport}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsSpyModalOpen(true)}
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
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Selecionados ({selectedProducts.length})</div>
                <button
                  onClick={() => setIsMercadoLivreIntegrationOpen(true)}
                  disabled={selectedProducts.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-yellow-500" /> Mercado Livre (API)
                </button>
                <button
                  onClick={() => exportProductsToShopee(products.filter(p => selectedProducts.includes(p.id!)))}
                  disabled={selectedProducts.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-red-500" /> Shopee
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Todos ({products.length})</div>
                <button onClick={() => exportAllProducts('mercado_livre')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-yellow-500" /> Mercado Livre (CSV)</button>
                <button onClick={() => { setIsMercadoLivreIntegrationOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-yellow-500" /> Mercado Livre (API)</button>
                <button onClick={() => exportAllProducts('shopee')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-red-500" /> Shopee (Todos)</button>
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

      {lowStockAlerts.length > 0 && <LowStockAlerts products={lowStockAlerts.slice(0, 3).map(p => ({...p, min_stock: p.min_stock || 0}))} />}
      <InventorySummary />
      
      {/* Modal de Integração com o Mercado Livre */}
      {isMercadoLivreIntegrationOpen && (
        <MercadoLivreIntegration
          products={products}
          selectedProducts={selectedProducts}
          onClose={() => setIsMercadoLivreIntegrationOpen(false)}
        />
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category, index) => (
                <option key={`${category}-${index}`} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoria</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Todas as subcategorias</option>
              {subcategories.map((subcategory, index) => (
                <option key={`${subcategory}-${index}`} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sugestões de Oferta</label>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setSmartFilter('all')}
                className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${smartFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                TUDO
              </button>
              <button
                onClick={() => setSmartFilter('clearance')}
                className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${smartFilter === 'clearance' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Itens parados há mais de 45 dias"
              >
                QUEIMA
              </button>
              <button
                onClick={() => setSmartFilter('premium')}
                className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${smartFilter === 'premium' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Itens com alta margem de lucro"
              >
                PREMIUM
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Produtos ({filteredProducts.length})</h3>
            {selectedProducts.length > 0 && <span className="text-sm text-blue-600">({selectedProducts.length} selecionados)</span>}
          </div>
          <div className="flex items-center space-x-2">
            {selectedProducts.length > 0 && (
              <>
                <button
                  onClick={handleBulkOffer}
                  className="text-sm flex items-center text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Gerar Catálogo ({selectedProducts.length})
                </button>
                <button
                  onClick={handleBulkStockUpdate}
                  className="text-sm flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                >
                  <Package className="w-4 h-4 mr-1" />
                  Ajustar Estoque
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="text-sm flex items-center text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </button>
              </>
            )}
            <button onClick={selectLowStockProducts} className="text-sm text-orange-600 hover:text-orange-800 bg-orange-50 px-2 py-1 rounded">
              Selecionar Baixo Estoque
            </button>
            <button onClick={selectAllProducts} className="text-sm text-blue-600 hover:text-blue-800">
              {selectedProducts.length === filteredProducts.length ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  {...({ className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group" } as HTMLMotionProps<'div'>)}
                >
                  <div className="relative">
                    <div className="absolute top-2 left-2 z-10 w-full flex justify-between px-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id!)}
                        onChange={() => toggleProductSelection(product.id!)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shadow-sm cursor-pointer"
                      />
                      {isLowStock(product) && <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Baixo Estoque</div>}
                    </div>

                    <div className="w-full h-40 bg-white p-4 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Package className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm" title={product.name}>{product.name}</h3>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{product.sku || 'Sem SKU'}</p>
                    </div>

                    <div className="flex items-end justify-between text-xs mb-3">
                      <div>
                        <span className="text-gray-500 block mb-0.5">Estoque</span>
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md">
                          <button onClick={() => handleQuickStockUpdate(product, -1)} className="p-1 hover:text-red-500 transition-colors disabled:opacity-30" disabled={(product.quantity || 0) <= 0}>-</button>
                          <span className={`font-bold w-6 text-center ${(product.quantity || 0) <= (product.min_stock || 0) ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{product.quantity || 0}</span>
                          <button onClick={() => handleQuickStockUpdate(product, 1)} className="p-1 hover:text-green-500 transition-colors">+</button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 block mb-0.5">Venda</span>
                        <span className="font-bold text-green-600 text-sm">R$ {Number(product.sale_price).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Link to={`/inventory/edit/${product.id}`} className="flex-1 flex items-center justify-center p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-[10px] font-black uppercase transition-colors">
                        <Edit className="w-3 h-3 mr-1" /> Editar
                      </Link>
                      <button
                        onClick={() => {
                          setSpyProductData({ name: product.name, price: Number(product.sale_price) });
                          setIsSpyModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded text-[10px] font-black uppercase transition-colors"
                        title="Análise de Mercado"
                      >
                        <Brain className="w-3 h-3 mr-1" /> Market IA
                      </button>
                      <button
                        onClick={() => {
                          const templateData = {
                            product: product.name,
                            price: product.sale_price,
                            image: product.image,
                            description: product.description,
                            stock: product.quantity
                          };
                          const msg = communicationService.getTemplate('oferta', templateData, company.name);
                          communicationService.openWhatsApp('', msg, templateData, true, company.name);
                          toast.success('Pronto! Dê Ctrl+V e Enter no WhatsApp para enviar o anúncio.', { duration: 6000, icon: '🚀' });
                        }}
                        className="flex-1 flex items-center justify-center p-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded text-[10px] font-black uppercase transition-colors"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" /> Oferta
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id!, product.name)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Excluir">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;