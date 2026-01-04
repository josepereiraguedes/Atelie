import React, { useState, useEffect, useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { PageHeader } from '@/shared/components';
import { Search, ShoppingCart, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomCostBreakdown, CustomCostCategorySummary, CostBreakdownChart, PricingRecommendations, AdvancedProfitabilityAnalysis, PricingScenarioSimulator, DataExport } from '@/features/marketplace/components';

const ProductPricing: React.FC = () => {
  const { products, calculateAllMarketplacePricing } = useLocalDatabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [profitMargin, setProfitMargin] = useState(20); // Margem de lucro padrão 20%
  const [activeTab, setActiveTab] = useState<'pricing' | 'analysis' | 'simulation'>('pricing');
  
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
  
  // Calcular precificação para o produto selecionado
  const pricingData = useMemo(() => {
    if (selectedProduct === null) return null;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return null;
    
    return calculateAllMarketplacePricing(product, profitMargin);
  }, [selectedProduct, products, profitMargin, calculateAllMarketplacePricing]);
  
  // Selecionar o primeiro produto quando a lista mudar e nenhum estiver selecionado
  React.useEffect(() => {
    if (selectedProduct === null && filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProduct]);
  
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Precificação de Produtos" 
        backPath="/inventory"
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Calcule preços otimizados para seus produtos em diferentes marketplaces
      </p>
      
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
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
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
        
        {/* Detalhes da precificação */}
        <div className="lg:col-span-2">
          {selectedProduct ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                {/* Controles */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Precificação Detalhada
                  </h2>
                  <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                    <div>
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
                          className="w-32 mr-3"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[40px]">
                          {profitMargin}%
                        </span>
                      </div>
                    </div>
                    <DataExport 
                      data={pricingData || []} 
                      filename={`precificacao-${products.find(p => p.id === selectedProduct)?.name || 'produto'}-${new Date().toISOString().split('T')[0]}`} 
                    />
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'pricing'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Precificação
                    </button>
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'analysis'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Análise Avançada
                    </button>
                    <button
                      onClick={() => setActiveTab('simulation')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'simulation'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Simulação
                    </button>
                  </nav>
                </div>
                
                {activeTab === 'pricing' && (
                  <>
                    {/* Informações do produto */}
                    {pricingData && pricingData.length > 0 && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="flex items-center">
                          {pricingData[0].productCost && (
                            <div className="flex-shrink-0">
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
                                  R$ {pricingData[0].productCost.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Custo Total</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  R$ {pricingData[0].totalCost.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Margem Real</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pricingData[0].actualProfitMargin.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Tabela de precificação por marketplace */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Marketplace
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Custo Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Preço Sugerido
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Lucro Bruto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Margem
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Recebimento
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {pricingData && pricingData.map((pricing, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {pricing.marketplace}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                R$ {pricing.totalCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  R$ {pricing.suggestedPrice.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                R$ {pricing.grossProfit.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  {pricing.actualProfitMargin.toFixed(2)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {pricing.averagePaymentTerm} dias
                              </td>
                            </tr>
                          ))}
                          
                          {(!pricingData || pricingData.length === 0) && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center">
                                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                  Nenhuma configuração de marketplace encontrada
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  Adicione configurações de marketplaces para calcular preços
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Detalhamento dos custos */}
                    {pricingData && pricingData.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                          Detalhamento dos Custos ({pricingData[0].marketplace})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Custo do Produto</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].productCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Comissão</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].commissionCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Taxa Fixa</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].fixedFee.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Impostos</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].taxCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Custo Operacional</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].operationalCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Envio</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].shippingCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Marketing</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {pricingData[0].marketingCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-600 dark:text-blue-400">Custo Total</p>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                              R$ {pricingData[0].totalCost.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Custos personalizados */}
                        <CustomCostBreakdown 
                          customCosts={pricingData[0].customCosts}
                          totalCustomCosts={pricingData[0].customCostsTotal}
                        />
                        
                        {/* Resumo de custos por categoria */}
                        <CustomCostCategorySummary
                          customCosts={pricingData[0].customCosts}
                          totalCustomCosts={pricingData[0].customCostsTotal}
                          productCost={pricingData[0].productCost}
                        />
                        
                        {/* Gráfico de distribuição de custos */}
                        <div className="mt-6">
                          <CostBreakdownChart
                            productCost={pricingData[0].productCost}
                            commissionCost={pricingData[0].commissionCost}
                            fixedFee={pricingData[0].fixedFee}
                            taxCost={pricingData[0].taxCost}
                            operationalCost={pricingData[0].operationalCost}
                            shippingCost={pricingData[0].shippingCost}
                            marketingCost={pricingData[0].marketingCost}
                            customCosts={pricingData[0].customCosts}
                            customCostsTotal={pricingData[0].customCostsTotal}
                            totalCost={pricingData[0].totalCost}
                          />
                        </div>
                        
                        {/* Recomendações de precificação */}
                        <PricingRecommendations
                          productCost={pricingData[0].productCost}
                          pricingData={pricingData}
                          desiredProfitMargin={profitMargin}
                        />
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === 'analysis' && selectedProduct && (
                  <AdvancedProfitabilityAnalysis 
                    productId={selectedProduct} 
                    desiredProfitMargin={profitMargin} 
                  />
                )}
                
                {activeTab === 'simulation' && selectedProduct && (
                  <PricingScenarioSimulator 
                    productId={selectedProduct} 
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-12 text-center">
                <TrendingUp className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Selecione um produto para calcular preços
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Escolha um produto da lista ao lado para ver a precificação detalhada para cada marketplace
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPricing;