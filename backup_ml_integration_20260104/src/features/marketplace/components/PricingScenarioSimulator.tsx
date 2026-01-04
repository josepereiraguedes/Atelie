import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { BarChart3, TrendingUp, Calculator, RefreshCw } from 'lucide-react';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    profitMargin: number;
    customCostsAdjustment: number; // percentual de ajuste nos custos personalizados
    commissionAdjustment: number; // percentual de ajuste na comissão
    shippingCostAdjustment: number; // percentual de ajuste no custo de envio
  };
}

interface SimulationResult {
  marketplace: string;
  originalPrice: number;
  simulatedPrice: number;
  originalProfit: number;
  simulatedProfit: number;
  originalMargin: number;
  simulatedMargin: number;
  priceDifference: number;
  profitDifference: number;
  competitiveness: 'high' | 'medium' | 'low';
}

interface PricingScenarioSimulatorProps {
  productId: number;
}

export const PricingScenarioSimulator: React.FC<PricingScenarioSimulatorProps> = ({ productId }) => {
  const { products, marketplaceConfigs, calculateMarketplacePricing } = useLocalDatabase();
  
  const product = products.find(p => p.id === productId);
  
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([
    {
      id: 'conservative',
      name: 'Conservador',
      description: 'Menor margem, maior competitividade',
      parameters: {
        profitMargin: 15,
        customCostsAdjustment: 0,
        commissionAdjustment: 0,
        shippingCostAdjustment: 0
      }
    },
    {
      id: 'aggressive',
      name: 'Agressivo',
      description: 'Maior margem, menor competitividade',
      parameters: {
        profitMargin: 30,
        customCostsAdjustment: 0,
        commissionAdjustment: 0,
        shippingCostAdjustment: 0
      }
    },
    {
      id: 'cost_optimized',
      name: 'Otimizado por Custo',
      description: 'Redução de custos operacionais',
      parameters: {
        profitMargin: 20,
        customCostsAdjustment: -10,
        commissionAdjustment: -5,
        shippingCostAdjustment: -15
      }
    }
  ]);
  
  const [selectedScenario, setSelectedScenario] = useState<string>('conservative');
  const [customScenario, setCustomScenario] = useState({
    name: 'Personalizado',
    profitMargin: 20,
    customCostsAdjustment: 0,
    commissionAdjustment: 0,
    shippingCostAdjustment: 0
  });
  
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  
  // Calcular resultados da simulação
  const simulationResults = useMemo(() => {
    if (!product) return [];
    
    const scenario = activeTab === 'presets' 
      ? scenarios.find(s => s.id === selectedScenario) 
      : {
          id: 'custom',
          name: 'Personalizado',
          description: 'Cenário personalizado',
          parameters: customScenario
        };
    
    if (!scenario) return [];
    
    const results: SimulationResult[] = [];
    
    marketplaceConfigs.forEach(config => {
      // Cálculo original
      const originalPricing = calculateMarketplacePricing(product, config.name, 20);
      
      // Cálculo simulado com parâmetros ajustados
      const simulatedConfig = {
        ...config,
        commission_rate: config.commission_rate * (1 + scenario.parameters.commissionAdjustment / 100),
        shipping_cost: config.shipping_cost * (1 + scenario.parameters.shippingCostAdjustment / 100),
        custom_costs: config.custom_costs?.map(cost => ({
          ...cost,
          value: cost.type === 'fixed' 
            ? cost.value * (1 + scenario.parameters.customCostsAdjustment / 100)
            : cost.value // Para percentuais, mantemos o valor original
        }))
      };
      
      // Criar uma versão simulada da função de cálculo
      const calculateSimulatedPricing = (
        product: any, 
        marketplaceName: string, 
        desiredProfitMargin: number = 20
      ) => {
        const marketplaceConfig = simulatedConfig;
        
        if (!marketplaceConfig) {
          throw new Error(`Configuração não encontrada para o marketplace: ${marketplaceName}`);
        }
        
        const productCost = product.cost;
        const commissionCost = (marketplaceConfig.commission_rate / 100) * productCost;
        const fixedFee = marketplaceConfig.fixed_fee;
        const taxCost = (marketplaceConfig.tax_rate / 100) * productCost;
        const operationalCost = (marketplaceConfig.operational_cost_rate / 100) * productCost;
        const shippingCost = marketplaceConfig.shipping_cost;
        const marketingCost = (marketplaceConfig.marketing_rate / 100) * productCost;
        
        let customCostsTotal = 0;
        const customCostsDetails: { name: string; cost: number }[] = [];
        
        if (marketplaceConfig.custom_costs && marketplaceConfig.custom_costs.length > 0) {
          marketplaceConfig.custom_costs.forEach(cost => {
            let costValue = 0;
            if (cost.type === 'fixed') {
              costValue = cost.value;
            } else if (cost.type === 'percentage') {
              costValue = (cost.value / 100) * productCost;
            }
            
            customCostsTotal += costValue;
            customCostsDetails.push({ name: cost.name, cost: costValue });
          });
        }
        
        const totalCost = productCost + commissionCost + fixedFee + taxCost + operationalCost + shippingCost + marketingCost + customCostsTotal;
        const suggestedPrice = totalCost / (1 - (desiredProfitMargin / 100));
        const actualProfitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;
        const grossProfit = suggestedPrice - totalCost;
        
        return {
          marketplace: marketplaceConfig.name,
          productCost,
          commissionCost,
          fixedFee,
          taxCost,
          operationalCost,
          shippingCost,
          marketingCost,
          customCosts: customCostsDetails,
          customCostsTotal,
          totalCost,
          suggestedPrice,
          desiredProfitMargin,
          actualProfitMargin,
          grossProfit,
          averagePaymentTerm: marketplaceConfig.average_payment_term
        };
      };
      
      const simulatedPricing = calculateSimulatedPricing(product, config.name, scenario.parameters.profitMargin);
      
      // Determinar competitividade com base na diferença de preço
      let competitiveness: 'high' | 'medium' | 'low' = 'medium';
      const priceDifferencePercent = ((simulatedPricing.suggestedPrice - originalPricing.suggestedPrice) / originalPricing.suggestedPrice) * 100;
      
      if (priceDifferencePercent < -5) {
        competitiveness = 'high';
      } else if (priceDifferencePercent > 5) {
        competitiveness = 'low';
      }
      
      results.push({
        marketplace: config.name,
        originalPrice: originalPricing.suggestedPrice,
        simulatedPrice: simulatedPricing.suggestedPrice,
        originalProfit: originalPricing.grossProfit,
        simulatedProfit: simulatedPricing.grossProfit,
        originalMargin: originalPricing.actualProfitMargin,
        simulatedMargin: simulatedPricing.actualProfitMargin,
        priceDifference: simulatedPricing.suggestedPrice - originalPricing.suggestedPrice,
        profitDifference: simulatedPricing.grossProfit - originalPricing.grossProfit,
        competitiveness
      });
    });
    
    return results;
  }, [product, marketplaceConfigs, selectedScenario, scenarios, activeTab, customScenario, calculateMarketplacePricing]);
  
  const handleCustomScenarioChange = (field: string, value: number) => {
    setCustomScenario(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const resetCustomScenario = () => {
    setCustomScenario({
      name: 'Personalizado',
      profitMargin: 20,
      customCostsAdjustment: 0,
      commissionAdjustment: 0,
      shippingCostAdjustment: 0
    });
  };
  
  const getCompetitivenessColor = (competitiveness: string) => {
    switch (competitiveness) {
      case 'high': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getCompetitivenessBg = (competitiveness: string) => {
    switch (competitiveness) {
      case 'high': return 'bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };
  
  if (!product) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
        Simulador de Cenários de Precificação
      </h3>
      
      {/* Tabs para seleção de cenário */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'presets'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Cenários Pré-definidos
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Cenário Personalizado
          </button>
        </nav>
      </div>
      
      {/* Conteúdo das tabs */}
      {activeTab === 'presets' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedScenario === scenario.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <h4 className="font-medium text-gray-900 dark:text-white">{scenario.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{scenario.description}</p>
              <div className="mt-3 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  Margem: <span className="font-medium">{scenario.parameters.profitMargin}%</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Configuração Personalizada</h4>
            <button
              onClick={resetCustomScenario}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Resetar
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margem de Lucro (%)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={customScenario.profitMargin}
                onChange={(e) => handleCustomScenarioChange('profitMargin', Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>5%</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {customScenario.profitMargin}%
                </span>
                <span>50%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ajuste de Custos Personalizados (%)
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={customScenario.customCostsAdjustment}
                onChange={(e) => handleCustomScenarioChange('customCostsAdjustment', Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>-50%</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {customScenario.customCostsAdjustment}%
                </span>
                <span>+50%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ajuste de Comissão (%)
              </label>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={customScenario.commissionAdjustment}
                onChange={(e) => handleCustomScenarioChange('commissionAdjustment', Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>-30%</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {customScenario.commissionAdjustment}%
                </span>
                <span>+30%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ajuste de Custo de Envio (%)
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={customScenario.shippingCostAdjustment}
                onChange={(e) => handleCustomScenarioChange('shippingCostAdjustment', Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>-50%</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {customScenario.shippingCostAdjustment}%
                </span>
                <span>+50%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Resultados da simulação */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Marketplace
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Preço Original
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Preço Simulado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Diferença
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lucro Original
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lucro Simulado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Competitividade
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {simulationResults.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {result.marketplace}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  R$ {result.originalPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  R$ {result.simulatedPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={
                    result.priceDifference > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : result.priceDifference < 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                  }>
                    {result.priceDifference > 0 ? '+' : ''}{result.priceDifference.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  R$ {result.originalProfit.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  R$ {result.simulatedProfit.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompetitivenessBg(result.competitiveness)} ${getCompetitivenessColor(result.competitiveness)}`}>
                    {result.competitiveness === 'high' && 'Alta'}
                    {result.competitiveness === 'medium' && 'Média'}
                    {result.competitiveness === 'low' && 'Baixa'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Resumo da simulação */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Média de Preço
            </h4>
          </div>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200 mt-1">
            R$ {(simulationResults.reduce((sum, r) => sum + r.simulatedPrice, 0) / simulationResults.length || 0).toFixed(2)}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Original: R$ {(simulationResults.reduce((sum, r) => sum + r.originalPrice, 0) / simulationResults.length || 0).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              Média de Lucro
            </h4>
          </div>
          <p className="text-lg font-bold text-green-800 dark:text-green-200 mt-1">
            R$ {(simulationResults.reduce((sum, r) => sum + r.simulatedProfit, 0) / simulationResults.length || 0).toFixed(2)}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            Original: R$ {(simulationResults.reduce((sum, r) => sum + r.originalProfit, 0) / simulationResults.length || 0).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Competitividade
            </h4>
          </div>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200 mt-1">
            {simulationResults.filter(r => r.competitiveness === 'high').length} marketplaces
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            com alta competitividade
          </p>
        </div>
      </div>
    </div>
  );
};


