import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, Download, ShoppingCart, MoreHorizontal } from 'lucide-react';
import { useLocalDatabase, Product } from '../contexts/LocalDatabaseContext';
import { handleError } from '../utils/errorHandler';
import { motion, HTMLMotionProps } from 'framer-motion';
import toast from 'react-hot-toast';
import LowStockAlerts from '../components/Inventory/LowStockAlerts';
import InventorySummary from '../components/Inventory/InventorySummary';
import { exportProductsToMercadoLivre, exportProductsToShopee } from '../services/marketplaceExport';

const Inventory: React.FC = () => {
  const { products, deleteProduct, lowStockAlerts } = useLocalDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]); // Para seleção de produtos
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false); // Para o menu de exportação

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
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, searchTerm, selectedCategory, selectedSubcategory]);

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

  // Função para verificar se um produto está com estoque baixo
  const isLowStock = (product: Product) => {
    return Number(product.quantity) <= Number(product.min_stock);
  };

  const handleCategorySelect = (category: string, subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || '');
  };

  // Funções de exportação
  const handleExportToMercadoLivre = () => {
    const productsToExport = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id!))
      : filteredProducts;
    
    if (productsToExport.length === 0) {
      toast.error('Nenhum produto para exportar');
      return;
    }
    
    try {
      exportProductsToMercadoLivre(productsToExport);
      toast.success(`Exportados ${productsToExport.length} produtos para Mercado Livre!`);
      setIsExportMenuOpen(false);
    } catch (error) {
      handleError(error, 'marketplaceExport');
      toast.error('Erro ao exportar para Mercado Livre');
    }
  };

  const handleExportToShopee = () => {
    const productsToExport = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id!))
      : filteredProducts;
    
    if (productsToExport.length === 0) {
      toast.error('Nenhum produto para exportar');
      return;
    }
    
    try {
      exportProductsToShopee(productsToExport);
      toast.success(`Exportados ${productsToExport.length} produtos para Shopee!`);
      setIsExportMenuOpen(false);
    } catch (error) {
      handleError(error, 'marketplaceExport');
      toast.error('Erro ao exportar para Shopee');
    }
  };

  // Funções para seleção de produtos
  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(productId => productId !== id) 
        : [...prev, id]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      // Se todos estão selecionados, desmarcar todos
      setSelectedProducts([]);
    } else {
      // Se nem todos estão selecionados, marcar todos os filtrados
      setSelectedProducts(filteredProducts.map(p => p.id!));
    }
  };

  // Função para exportar todos os produtos
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
      handleError(error, 'marketplaceExport');
      toast.error(`Erro ao exportar para ${platform === 'mercado_livre' ? 'Mercado Livre' : 'Shopee'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Estoque
        </h1>
        <div className="flex flex-wrap gap-2">
          {/* Botão de exportação unificado */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Exportar
              <MoreHorizontal className="w-4 h-4 ml-1" />
            </button>
            
            {/* Menu dropdown de exportação */}
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Exportar Selecionados
                </div>
                <button
                  onClick={handleExportToMercadoLivre}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  disabled={selectedProducts.length === 0 && filteredProducts.length === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-orange-500" />
                  Mercado Livre (selecionados)
                </button>
                <button
                  onClick={handleExportToShopee}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  disabled={selectedProducts.length === 0 && filteredProducts.length === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-red-500" />
                  Shopee (selecionados)
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Exportar Todos
                </div>
                <button
                  onClick={() => exportAllProducts('mercado_livre')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-orange-500" />
                  Mercado Livre (todos)
                </button>
                <button
                  onClick={() => exportAllProducts('shopee')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-red-500" />
                  Shopee (todos)
                </button>
              </div>
            )}
          </div>
          
          <Link
            to="/inventory/new"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Alerta de Estoque Baixo */}
      {lowStockAlerts.length > 0 && (
        <LowStockAlerts limit={3} />
      )}

      {/* Resumo do Estoque - Cards individuais separados */}
      <InventorySummary />

      {/* Filtros - Agora abaixo do resumo do estoque */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory(''); // Reset subcategory when category changes
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subcategoria
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Todas as subcategorias</option>
              {subcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Produtos ({filteredProducts.length})
              </h3>
              {selectedProducts.length > 0 && (
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  ({selectedProducts.length} selecionados)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllProducts}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {selectedProducts.length === filteredProducts.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Ordenar por:
              </span>
              <div className="relative">
                <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none pr-8">
                  <option>Mais recentes</option>
                  <option>Nome A-Z</option>
                  <option>Menor estoque</option>
                  <option>Maior valor</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  {...({ className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow w-full max-w-xs mx-auto relative" } as HTMLMotionProps<'div'>)}
                >
                  {/* Checkbox para seleção */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id!)}
                      onChange={() => toggleProductSelection(product.id!)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {isLowStock(product) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                        !
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {product.category}
                      {product.subcategory && ` / ${product.subcategory}`}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Estoque:</span>
                        <span className={`font-medium ${isLowStock(product) ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {product.quantity} unid
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Preço:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          R$ {Number(product.sale_price || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Custo:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          R$ {Number(product.cost || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Fornecedor:</span>
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[80px]">
                          N/A
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total: R$ {((Number(product.quantity) || 0) * (Number(product.sale_price) || 0)).toFixed(2)}
                      </div>
                      <div className="flex space-x-1">
                        <Link 
                          to={`/inventory/edit/${product.id}`} 
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteProduct(product.id!, product.name)} 
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Nenhum produto encontrado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {products.length === 0 
                  ? 'Adicione seu primeiro produto'
                  : 'Ajuste os filtros de busca'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;