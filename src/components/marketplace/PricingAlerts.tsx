import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';

interface PricingAlert {
  id: string;
  type: 'low_margin' | 'high_price' | 'long_payment' | 'low_stock' | 'high_commission';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  productId?: number;
  productName?: string;
  marketplace?: string;
  createdAt: Date;
}

const PricingAlerts: React.FC = () => {
  const { products, marketplaceConfigs, calculateAllMarketplacePricing } = useLocalDatabase();
  const [alerts, setAlerts] = useState<PricingAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  
  // Verificar condições de alerta
  useEffect(() => {
    const newAlerts: PricingAlert[] = [];
    const now = new Date();
    
    // Verificar margens de lucro baixas
    products.forEach(product => {
      const pricingData = calculateAllMarketplacePricing(product, 20); // Margem desejada padrão 20%
      
      pricingData.forEach(pricing => {
        // Alerta para margem muito baixa (menos de 70% da desejada)
        if (pricing.actualProfitMargin < 14) {
          newAlerts.push({
            id: `low_margin_${product.id}_${pricing.marketplace}`,
            type: 'low_margin',
            severity: pricing.actualProfitMargin < 7 ? 'high' : 'medium',
            title: 'Margem de Lucro Baixa',
            message: `O produto "${product.name}" no marketplace "${pricing.marketplace}" tem uma margem de lucro de ${pricing.actualProfitMargin.toFixed(2)}%, abaixo do recomendado.`,
            productId: product.id,
            productName: product.name,
            marketplace: pricing.marketplace,
            createdAt: now
          });
        }
        
        // Alerta para preços muito altos (acima de 150% do custo total)
        if (pricing.suggestedPrice > pricing.totalCost * 1.5) {
          newAlerts.push({
            id: `high_price_${product.id}_${pricing.marketplace}`,
            type: 'high_price',
            severity: pricing.suggestedPrice > pricing.totalCost * 2 ? 'high' : 'medium',
            title: 'Preço Elevado',
            message: `O preço sugerido para "${product.name}" no marketplace "${pricing.marketplace}" é ${((pricing.suggestedPrice / pricing.totalCost - 1) * 100).toFixed(0)}% acima do custo total, o que pode afetar a competitividade.`,
            productId: product.id,
            productName: product.name,
            marketplace: pricing.marketplace,
            createdAt: now
          });
        }
      });
    });
    
    // Verificar marketplaces com comissões muito altas
    marketplaceConfigs.forEach(config => {
      if (config.commission_rate > 25) {
        newAlerts.push({
          id: `high_commission_${config.name}`,
          type: 'high_commission',
          severity: config.commission_rate > 30 ? 'high' : 'medium',
          title: 'Comissão Elevada',
          message: `O marketplace "${config.name}" tem uma comissão de ${config.commission_rate}%, o que pode impactar significativamente a margem de lucro.`,
          marketplace: config.name,
          createdAt: now
        });
      }
      
      // Alerta para prazos de recebimento longos
      if (config.average_payment_term > 30) {
        newAlerts.push({
          id: `long_payment_${config.name}`,
          type: 'long_payment',
          severity: config.average_payment_term > 45 ? 'high' : 'medium',
          title: 'Prazo de Recebimento Longo',
          message: `O marketplace "${config.name}" tem um prazo de recebimento de ${config.average_payment_term} dias, o que pode impactar o fluxo de caixa.`,
          marketplace: config.name,
          createdAt: now
        });
      }
    });
    
    // Verificar produtos com estoque baixo
    products.forEach(product => {
      if (product.min_stock !== undefined && product.quantity <= product.min_stock) {
        newAlerts.push({
          id: `low_stock_${product.id}`,
          type: 'low_stock',
          severity: product.quantity === 0 ? 'high' : product.quantity <= product.min_stock * 0.5 ? 'high' : 'medium',
          title: 'Estoque Baixo',
          message: `O produto "${product.name}" está com estoque baixo (${product.quantity} unidades disponíveis).`,
          productId: product.id,
          productName: product.name,
          createdAt: now
        });
      }
    });
    
    setAlerts(newAlerts);
    
    // Mostrar notificações para alertas de alta severidade
    const highSeverityAlerts = newAlerts.filter(alert => alert.severity === 'high');
    if (highSeverityAlerts.length > 0) {
      highSeverityAlerts.slice(0, 3).forEach(alert => {
        toast.error(alert.message, {
          duration: 5000,
          position: 'top-right'
        });
      });
    }
  }, [products, marketplaceConfigs, calculateAllMarketplacePricing]);
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_margin':
        return <TrendingDown className="w-4 h-4" />;
      case 'high_price':
        return <DollarSign className="w-4 h-4" />;
      case 'long_payment':
        return <Clock className="w-4 h-4" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high_commission':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };
  
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    }
  };
  
  const getAlertTextColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-800 dark:text-red-200';
      case 'medium':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };
  
  const clearAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };
  
  if (alerts.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão para mostrar/ocultar alertas */}
      <button
        onClick={() => setShowAlerts(!showAlerts)}
        className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors mb-2"
      >
        <Bell className="w-6 h-6" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>
      
      {/* Lista de alertas */}
      {showAlerts && (
        <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Alertas de Precificação ({alerts.length})
            </h3>
            <button 
              onClick={() => setShowAlerts(false)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 ${getAlertColor(alert.severity)} relative`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 mt-0.5 ${getAlertTextColor(alert.severity)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="ml-2 flex-1">
                    <h4 className={`text-xs font-medium ${getAlertTextColor(alert.severity)}`}>
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {alert.createdAt.toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  <button 
                    onClick={() => clearAlert(alert.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-2 bg-gray-50 dark:bg-gray-700/30 text-center">
            <button 
              onClick={() => setAlerts([])}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Limpar todos os alertas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingAlerts;