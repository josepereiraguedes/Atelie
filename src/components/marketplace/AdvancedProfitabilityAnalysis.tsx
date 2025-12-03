import React from 'react';
import { BarChart, PieChart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';

interface ProfitabilityMetrics {
  marketplace: string;
  totalCost: number;
  suggestedPrice: number;
  grossProfit: number;
  actualProfitMargin: number;
  roi: number;
  breakEvenPoint: number;
  profitabilityRating: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AdvancedProfitabilityAnalysisProps {
  productId: number;
  desiredProfitMargin: number;
}

const AdvancedProfitabilityAnalysis: React.FC<AdvancedProfitabilityAnalysisProps> = ({ 
  productId, 
  desiredProfitMargin 
}) => {
  const { products, calculateAllMarketplacePricing } = useLocalDatabase();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return null;
  }
  
  const pricingData = calculateAllMarketplacePricing(product, desiredProfitMargin);
  
  // Calcular métricas avançadas de rentabilidade
  const profitabilityMetrics: ProfitabilityMetrics[] = pricingData.map(data => {
    // ROI (Retorno sobre Investimento)
    const roi = ((data.suggestedPrice - data.totalCost) / data.totalCost) * 100;
    
    // Ponto de equilíbrio (quantidade necessária para cobrir custos fixos)
    // Para simplificação, assumimos custos fixos como 10% do custo do produto
    const fixedCosts = data.productCost * 0.1;
    const breakEvenPoint = fixedCosts / (data.suggestedPrice - data.totalCost);
    
    // Classificação de rentabilidade
    let profitabilityRating: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (data.actualProfitMargin >= desiredProfitMargin * 1.2) {
      profitabilityRating = 'excellent';
    } else if (data.actualProfitMargin >= desiredProfitMargin * 0.9) {
      profitabilityRating = 'good';
    } else if (data.actualProfitMargin >= desiredProfitMargin * 0.7) {
      profitabilityRating = 'fair';
    }
    
    return {
      ...data,
      roi,
      breakEvenPoint: isNaN(breakEvenPoint) || !isFinite(breakEvenPoint) ? 0 : breakEvenPoint,
      profitabilityRating
    };
  });
  
  // Encontrar marketplace com melhor ROI
  const bestROIMarketplace = [...profitabilityMetrics].sort((a, b) => b.roi - a.roi)[0];
  
  // Encontrar marketplace com menor ponto de equilíbrio
  const bestBreakEvenMarketplace = [...profitabilityMetrics]
    .filter(m => m.breakEvenPoint > 0)
    .sort((a, b) => a.breakEvenPoint - b.breakEvenPoint)[0];
  
  // Calcular médias
  const avgROI = profitabilityMetrics.reduce((sum, data) => sum + data.roi, 0) / profitabilityMetrics.length;
  const avgBreakEven = profitabilityMetrics
    .filter(m => m.breakEvenPoint > 0)
    .reduce((sum, data) => sum + data.breakEvenPoint, 0) / 
    profitabilityMetrics.filter(m => m.breakEvenPoint > 0).length;
  
  // Contar classificações de rentabilidade
  const ratingCounts = {
    excellent: profitabilityMetrics.filter(m => m.profitabilityRating === 'excellent').length,
    good: profitabilityMetrics.filter(m => m.profitabilityRating === 'good').length,
    fair: profitabilityMetrics.filter(m => m.profitabilityRating === 'fair').length,
    poor: profitabilityMetrics.filter(m => m.profitabilityRating === 'poor').length
  };
  
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getRatingBgColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 dark:bg-green-900/30';
      case 'good': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'fair': return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'poor': return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
        Análise Avançada de Rentabilidade
      </h3>
      
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              Melhor ROI
            </h4>
          </div>
          <p className="text-lg font-bold text-green-800 dark:text-green-200">
            {bestROIMarketplace?.marketplace}
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            {bestROIMarketplace?.roi.toFixed(2)}% de retorno
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Menor Ponto de Equilíbrio
            </h4>
          </div>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {bestBreakEvenMarketplace?.marketplace}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {bestBreakEvenMarketplace?.breakEvenPoint.toFixed(0) || '0'} unidades
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center mb-2">
            <BarChart className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Média de ROI
            </h4>
          </div>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
            {avgROI.toFixed(2)}%
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Média de equilíbrio: {avgBreakEven.toFixed(0)} unidades
          </p>
        </div>
      </div>
      
      {/* Classificação de rentabilidade */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Classificação de Rentabilidade por Marketplace
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`flex flex-col items-center p-3 rounded-lg ${getRatingBgColor('excellent')} border border-green-200 dark:border-green-800`}>
            <span className={`text-2xl font-bold ${getRatingColor('excellent')}`}>
              {ratingCounts.excellent}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Excelente</span>
          </div>
          <div className={`flex flex-col items-center p-3 rounded-lg ${getRatingBgColor('good')} border border-blue-200 dark:border-blue-800`}>
            <span className={`text-2xl font-bold ${getRatingColor('good')}`}>
              {ratingCounts.good}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Bom</span>
          </div>
          <div className={`flex flex-col items-center p-3 rounded-lg ${getRatingBgColor('fair')} border border-yellow-200 dark:border-yellow-800`}>
            <span className={`text-2xl font-bold ${getRatingColor('fair')}`}>
              {ratingCounts.fair}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Razoável</span>
          </div>
          <div className={`flex flex-col items-center p-3 rounded-lg ${getRatingBgColor('poor')} border border-red-200 dark:border-red-800`}>
            <span className={`text-2xl font-bold ${getRatingColor('poor')}`}>
              {ratingCounts.poor}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Ruim</span>
          </div>
        </div>
      </div>
      
      {/* Tabela detalhada */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Marketplace
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ROI
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ponto de Equilíbrio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Margem Real
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Classificação
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {profitabilityMetrics.map((metric, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {metric.marketplace}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className={metric.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {metric.roi.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {metric.breakEvenPoint > 0 ? `${metric.breakEvenPoint.toFixed(0)} unid.` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className={
                    metric.actualProfitMargin >= desiredProfitMargin * 1.2 ? 'text-green-600 dark:text-green-400' :
                    metric.actualProfitMargin >= desiredProfitMargin * 0.9 ? 'text-blue-600 dark:text-blue-400' :
                    metric.actualProfitMargin >= desiredProfitMargin * 0.7 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }>
                    {metric.actualProfitMargin.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    metric.profitabilityRating === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    metric.profitabilityRating === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    metric.profitabilityRating === 'fair' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {metric.profitabilityRating === 'excellent' && 'Excelente'}
                    {metric.profitabilityRating === 'good' && 'Bom'}
                    {metric.profitabilityRating === 'fair' && 'Razoável'}
                    {metric.profitabilityRating === 'poor' && 'Ruim'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Insights */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Insights de Rentabilidade
        </h4>
        <div className="space-y-2">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {ratingCounts.poor > 0 ? (
                <>
                  <span className="font-medium">{ratingCounts.poor} marketplace(s)</span> com rentabilidade ruim. 
                  Considere revisar os custos ou aumentar os preços nestes canais.
                </>
              ) : (
                "Nenhum marketplace com rentabilidade ruim identificado."
              )}
            </p>
          </div>
          <div className="flex items-start">
            <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {bestROIMarketplace && (
                <>
                  <span className="font-medium">{bestROIMarketplace.marketplace}</span> oferece o melhor retorno 
                  sobre investimento ({bestROIMarketplace.roi.toFixed(2)}%).
                </>
              )}
            </p>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A média de ROI é de {avgROI.toFixed(2)}%, o que indica uma rentabilidade 
              {avgROI > 20 ? ' excelente' : avgROI > 10 ? ' boa' : ' razoável'} em geral.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedProfitabilityAnalysis;