import React, { useState } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';

interface PriceSensitivityAnalysisProps {
  productId: number;
  marketplaceName: string;
}

export const PriceSensitivityAnalysis: React.FC<PriceSensitivityAnalysisProps> = ({ 
  productId, 
  marketplaceName 
}) => {
  const { products, calculateMarketplacePricing } = useLocalDatabase();
  
  const product = products.find(p => p.id === productId);
  
  const [priceAdjustment, setPriceAdjustment] = useState(0); // Percentual de ajuste de preço
  
  if (!product) {
    return null;
  }
  
  // Calcular precificação base
  const basePricing = calculateMarketplacePricing(product, marketplaceName, 20);
  
  // Calcular precificação com ajuste de preço
  const adjustedPrice = basePricing.suggestedPrice * (1 + priceAdjustment / 100);
  const adjustedProfit = adjustedPrice - basePricing.totalCost;
  const adjustedMargin = (adjustedProfit / adjustedPrice) * 100;
  
  // Calcular diferentes cenários de preço
  const scenarios = [-20, -15, -10, -5, 0, 5, 10, 15, 20].map(adjustment => {
    const scenarioPrice = basePricing.suggestedPrice * (1 + adjustment / 100);
    const scenarioProfit = scenarioPrice - basePricing.totalCost;
    const scenarioMargin = (scenarioProfit / scenarioPrice) * 100;
    
    return {
      adjustment,
      price: scenarioPrice,
      profit: scenarioProfit,
      margin: scenarioMargin
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Análise de Sensibilidade de Preços
      </h2>
      
      {/* Informações do produto e marketplace */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Produto</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Marketplace</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{marketplaceName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Preço Base Sugerido</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">R$ {basePricing.suggestedPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      {/* Ajuste de preço */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ajuste de Preço (%)
        </label>
        <div className="flex items-center">
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={priceAdjustment}
            onChange={(e) => setPriceAdjustment(Number(e.target.value))}
            className="w-full mr-3"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[50px]">
            {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <p>Veja como o ajuste de preço afeta sua margem de lucro e lucro bruto.</p>
        </div>
      </div>
      
      {/* Resultados do ajuste */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-md font-medium text-blue-800 dark:text-blue-200 mb-2">
          Resultados com Ajuste de {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Novo Preço</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              R$ {adjustedPrice.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Lucro Bruto</p>
            <p className={`text-lg font-bold ${
              adjustedProfit >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              R$ {adjustedProfit.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Margem de Lucro</p>
            <p className={`text-lg font-bold ${
              adjustedMargin >= 20 
                ? 'text-green-600 dark:text-green-400' 
                : adjustedMargin >= 10 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {adjustedMargin.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabela de cenários */}
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Cenários de Preço
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ajuste
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lucro Bruto
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Margem
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {scenarios.map((scenario, index) => (
                <tr 
                  key={index} 
                  className={`${
                    scenario.adjustment === priceAdjustment 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {scenario.adjustment > 0 ? '+' : ''}{scenario.adjustment}%
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    R$ {scenario.price.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2 text-sm ${
                    scenario.profit >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    R$ {scenario.profit.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2 text-sm ${
                    scenario.margin >= 20 
                      ? 'text-green-600 dark:text-green-400' 
                      : scenario.margin >= 10 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {scenario.margin.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recomendações */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
          Recomendações
        </h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• Mantenha a margem de lucro acima de 15% para garantir a sustentabilidade do negócio.</li>
          <li>• Considere o impacto da concorrência ao ajustar preços.</li>
          <li>• Avalie o volume de vendas esperado com diferentes níveis de preço.</li>
          <li>• Monitore regularmente os custos para manter a precificação atualizada.</li>
        </ul>
      </div>
    </div>
  );
};


