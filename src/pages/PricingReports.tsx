import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import PageHeader from '../components/common/PageHeader';
import { Search, ShoppingCart, FileText } from 'lucide-react';
import PricingReport from '../components/marketplace/PricingReport';
import DataExport from '../components/marketplace/DataExport';

const PricingReports: React.FC = () => {
  const { products } = useLocalDatabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [profitMargin, setProfitMargin] = useState(20); // Margem de lucro padrão 20%
  const [showReport, setShowReport] = useState(false);
  
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
  
  const handleGenerateReport = () => {
    if (selectedProduct) {
      setShowReport(true);
    }
  };
  
  const handleBackToList = () => {
    setShowReport(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Relatórios de Precificação" 
        backPath="/settings"
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Gere relatórios detalhados de precificação para seus produtos em diferentes marketplaces
      </p>
      
      {!showReport ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          
          {/* Configurações do relatório */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Configurações do Relatório
                </h2>
                {selectedProduct && (
                  <DataExport 
                    data={products.filter(p => p.id === selectedProduct)} 
                    filename={`relatorio-precificacao-${products.find(p => p.id === selectedProduct)?.name || 'produto'}-${new Date().toISOString().split('T')[0]}`} 
                  />
                )}
              </div>
              
              {selectedProduct ? (
                <>
                  {/* Informações do produto selecionado */}
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
                  
                  {/* Configurações da margem de lucro */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>A margem de lucro será aplicada a todos os marketplaces no cálculo dos preços sugeridos.</p>
                    </div>
                  </div>
                  
                  {/* Botão para gerar relatório */}
                  <div className="flex justify-end space-x-3">
                    <DataExport 
                      data={products.filter(p => p.id === selectedProduct)} 
                      filename={`relatorio-precificacao-${products.find(p => p.id === selectedProduct)?.name || 'produto'}-${new Date().toISOString().split('T')[0]}`} 
                    />
                    <button
                      onClick={handleGenerateReport}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Relatório
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Selecione um produto
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Escolha um produto da lista ao lado para configurar e gerar um relatório de precificação
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Visualização do relatório */
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              ← Voltar para lista
            </button>
            {selectedProduct && (
              <DataExport 
                data={products.filter(p => p.id === selectedProduct)} 
                filename={`relatorio-precificacao-${products.find(p => p.id === selectedProduct)?.name || 'produto'}-${new Date().toISOString().split('T')[0]}`} 
              />
            )}
          </div>
          
          {selectedProduct && (
            <PricingReport 
              productId={selectedProduct} 
              profitMargin={profitMargin} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PricingReports;