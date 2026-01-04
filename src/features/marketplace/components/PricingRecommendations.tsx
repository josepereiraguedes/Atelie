import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface PricingRecommendation {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface PricingRecommendationsProps {
  productCost: number;
  pricingData: {
    marketplace: string;
    productCost: number;
    totalCost: number;
    suggestedPrice: number;
    grossProfit: number;
    actualProfitMargin: number;
    averagePaymentTerm: number;
  }[];
  desiredProfitMargin: number;
}

export const PricingRecommendations: React.FC<PricingRecommendationsProps> = ({ 
  productCost,
  pricingData,
  desiredProfitMargin
}) => {
  const recommendations: PricingRecommendation[] = [];
  
  // Verificar se há marketplaces com margem muito baixa
  const lowMarginMarketplaces = pricingData.filter(data => data.actualProfitMargin < desiredProfitMargin * 0.7);
  if (lowMarginMarketplaces.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Margem de Lucro Baixa',
      message: `Os seguintes marketplaces têm margem de lucro abaixo de 70% da desejada (${desiredProfitMargin}%): ${lowMarginMarketplaces.map(d => d.marketplace).join(', ')}. Considere aumentar os preços ou reduzir custos.`,
      priority: 'high'
    });
  }
  
  // Verificar se há marketplaces com margem muito alta
  const highMarginMarketplaces = pricingData.filter(data => data.actualProfitMargin > desiredProfitMargin * 1.5);
  if (highMarginMarketplaces.length > 0) {
    recommendations.push({
      type: 'info',
      title: 'Margem de Lucro Alta',
      message: `Os seguintes marketplaces têm margem de lucro acima de 150% da desejada (${desiredProfitMargin}%): ${highMarginMarketplaces.map(d => d.marketplace).join(', ')}. Considere reduzir preços para aumentar competitividade.`,
      priority: 'medium'
    });
  }
  
  // Verificar marketplaces com prazo de recebimento muito longo
  const longPaymentTermMarketplaces = pricingData.filter(data => data.averagePaymentTerm > 30);
  if (longPaymentTermMarketplaces.length > 0) {
    recommendations.push({
      type: 'info',
      title: 'Prazo de Recebimento Longo',
      message: `Os seguintes marketplaces têm prazo de recebimento superior a 30 dias: ${longPaymentTermMarketplaces.map(d => d.marketplace).join(', ')}. Considere o impacto no fluxo de caixa.`,
      priority: 'medium'
    });
  }
  
  // Verificar se o custo do produto é muito alto em relação ao preço sugerido
  const highCostMarketplaces = pricingData.filter(data => 
    data.productCost > data.suggestedPrice * 0.7
  );
  if (highCostMarketplaces.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Custo do Produto Elevado',
      message: `O custo do produto representa mais de 70% do preço sugerido nos seguintes marketplaces: ${highCostMarketplaces.map(d => d.marketplace).join(', ')}. Avalie a viabilidade comercial.`,
      priority: 'high'
    });
  }
  
  // Recomendação positiva se todas as margens forem boas
  if (lowMarginMarketplaces.length === 0 && highCostMarketplaces.length === 0) {
    recommendations.push({
      type: 'success',
      title: 'Precificação Saudável',
      message: 'A precificação está bem equilibrada em todos os marketplaces. As margens de lucro estão dentro dos parâmetros desejados.',
      priority: 'low'
    });
  }
  
  // Ordenar recomendações por prioridade
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (sortedRecommendations.length === 0) {
    return null;
  }

  const getIcon = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return '';
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
        Recomendações de Precificação
      </h3>
      
      <div className="space-y-3">
        {sortedRecommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`flex items-start p-4 rounded-lg border ${getBackgroundColor(rec.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(rec.type)}
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                rec.type === 'success' ? 'text-green-800 dark:text-green-200' :
                rec.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                'text-blue-800 dark:text-blue-200'
              }`}>
                {rec.title}
              </h4>
              <p className={`mt-1 text-sm ${
                rec.type === 'success' ? 'text-green-700 dark:text-green-300' :
                rec.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                'text-blue-700 dark:text-blue-300'
              }`}>
                {rec.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



