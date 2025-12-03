import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import PageHeader from '../components/common/PageHeader';
import { Search, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react';
import SelectMarketplace from '../components/common/SelectMarketplace';
import PriceComparisonTable from '../components/marketplace/PriceComparisonTable';
import MarketplaceComparisonAnalysis from '../components/marketplace/MarketplaceComparisonAnalysis';

const MarketplaceComparison: React.FC = () => {
  const { products, calculateMarketplacePricing, marketplaceConfigs } = useLocalDatabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [profitMargin, setProfitMargin] = useState(20); // Margem de lucro padrão 20%
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
  
  // Calcular precificação para o produto selecionado nos marketplaces selecionados
  const pricingData = useMemo(() => {
    if (selectedProduct === null || selectedMarketplaces.length === 0) return [];
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return [];
    
    return selectedMarketplaces.map(marketplaceName => 
      calculateMarketplacePricing(product, marketplaceName, profitMargin)
    );
  }, [selectedProduct, products, selectedMarketplaces, profitMargin, calculateMarketplacePricing]);
  
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
  
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Comparação de Marketplaces" 
        backPath="/settings"
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Compare preços e lucros entre diferentes marketplaces para seus produtos
      </p>
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Filtros
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margem de Lucro Desejada
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  className="w-full mr-3"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[40px]">
                  {profitMargin}%
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marketplaces
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
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
        
        {/* Comparação de preços */}
        <div className="lg:col-span-2">
          {selectedProduct && selectedMarketplaces.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Comparação de Preços
                </h2>
                
                {/* Informações do produto */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <div className="flex items-center">
                    {products.find(p => p.id === selectedProduct)?.image ? (
                      <img 
                        src={products.find(p => p.id === selectedProduct)?.image} 
                        alt={products.find(p => p.id === selectedProduct)?.name} 
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {products.find(p => p.id === selectedProduct)?.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Custo do Produto</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            R$ {products.find(p => p.id === selectedProduct)?.cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tabela de comparação */}
                <PriceComparisonTable 
                  comparisonData={pricingData.map(pricing => ({
                    marketplace: pricing.marketplace,
                    totalCost: pricing.totalCost,
                    suggestedPrice: pricing.suggestedPrice,
                    grossProfit: pricing.grossProfit,
                    actualProfitMargin: pricing.actualProfitMargin,
                    averagePaymentTerm: pricing.averagePaymentTerm
                  }))}
                />
                
                {/* Análise comparativa */}
                <MarketplaceComparisonAnalysis
                  comparisonData={pricingData.map(pricing => ({
                    marketplace: pricing.marketplace,
                    totalCost: pricing.totalCost,
                    suggestedPrice: pricing.suggestedPrice,
                    grossProfit: pricing.grossProfit,
                    actualProfitMargin: pricing.actualProfitMargin,
                    averagePaymentTerm: pricing.averagePaymentTerm
                  }))}
                />
                

              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-12 text-center">
                <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {selectedProduct ? 'Selecione marketplaces para comparar' : 'Selecione um produto'}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {selectedProduct 
                    ? 'Escolha os marketplaces que deseja comparar na lista de filtros' 
                    : 'Escolha um produto da lista ao lado para ver a comparação de preços'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceComparison;