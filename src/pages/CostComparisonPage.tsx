import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import PageHeader from '../components/common/PageHeader';
import { Search, ShoppingCart } from 'lucide-react';
import CostComparisonChart from '../components/marketplace/CostComparisonChart';

const CostComparisonPage: React.FC = () => {
  const { products, marketplaceConfigs } = useLocalDatabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  
  // Filtrar produtos com base no termo de busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);
  
  // Selecionar o primeiro produto quando a lista mudar e nenhum estiver selecionado
  React.useEffect(() => {
    if (selectedProduct === null && filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProduct]);
  
  // Selecionar todos os marketplaces por padrão
  React.useEffect(() => {
    if (selectedMarketplaces.length === 0 && marketplaceConfigs.length > 0) {
      setSelectedMarketplaces(marketplaceConfigs.map(config => config.name));
    }
  }, [marketplaceConfigs, selectedMarketplaces.length]);
  
  const toggleMarketplace = (marketplaceName: string) => {
    setSelectedMarketplaces(prev => {
      if (prev.includes(marketplaceName)) {
        return prev.filter(name => name !== marketplaceName);
      } else {
        return [...prev, marketplaceName];
      }
    });
  };
  
  const selectAllMarketplaces = () => {
    setSelectedMarketplaces(marketplaceConfigs.map(config => config.name));
  };
  
  const deselectAllMarketplaces = () => {
    setSelectedMarketplaces([]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Comparação de Custos entre Marketplaces" 
        backPath="/settings"
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Compare os custos e preços sugeridos para seus produtos em diferentes marketplaces
      </p>
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Marketplaces
            </h3>
            
            <div className="flex space-x-2 mb-3">
              <button
                onClick={selectAllMarketplaces}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Todos
              </button>
              <button
                onClick={deselectAllMarketplaces}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Nenhum
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {marketplaceConfigs.map(config => (
                <div key={config.name} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`marketplace-${config.name}`}
                    checked={selectedMarketplaces.includes(config.name)}
                    onChange={() => toggleMarketplace(config.name)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`marketplace-${config.name}`} 
                    className="ml-2 block text-sm text-gray-900 dark:text-white"
                  >
                    {config.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Lista de produtos */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <li 
                    key={product.id}
                    className={`cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      selectedProduct === product.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                        : ''
                    }`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <div className="flex items-center">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          Custo: R$ {product.cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                
                {filteredProducts.length === 0 && (
                  <li className="p-8 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Nenhum produto encontrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm 
                        ? 'Tente ajustar sua busca' 
                        : 'Adicione produtos ao seu estoque'}
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Comparação de custos */}
        <div className="lg:col-span-2">
          {selectedProduct && selectedMarketplaces.length > 0 ? (
            <CostComparisonChart 
              productId={selectedProduct} 
              marketplaceNames={selectedMarketplaces} 
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {selectedProduct ? 'Selecione marketplaces' : 'Selecione um produto'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {selectedProduct 
                  ? 'Escolha os marketplaces que deseja comparar' 
                  : 'Escolha um produto da lista ao lado para ver a comparação de custos'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostComparisonPage;