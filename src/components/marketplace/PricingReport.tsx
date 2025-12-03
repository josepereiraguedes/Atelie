import React from 'react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';
import { Download, Printer } from 'lucide-react';
import DataExport from './DataExport';

interface PricingReportProps {
  productId: number;
  profitMargin: number;
}

const PricingReport: React.FC<PricingReportProps> = ({ productId, profitMargin }) => {
  const { products, calculateAllMarketplacePricing } = useLocalDatabase();
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return null;
  }
  
  const pricingData = calculateAllMarketplacePricing(product, profitMargin);
  
  // Calcular totais
  const totalCommissionCost = pricingData.reduce((sum, data) => sum + data.commissionCost, 0);
  const totalFixedFee = pricingData.reduce((sum, data) => sum + data.fixedFee, 0);
  const totalTaxCost = pricingData.reduce((sum, data) => sum + data.taxCost, 0);
  const totalOperationalCost = pricingData.reduce((sum, data) => sum + data.operationalCost, 0);
  const totalShippingCost = pricingData.reduce((sum, data) => sum + data.shippingCost, 0);
  const totalMarketingCost = pricingData.reduce((sum, data) => sum + data.marketingCost, 0);
  const totalCustomCosts = pricingData.reduce((sum, data) => sum + data.customCostsTotal, 0);
  
  const handleExportPDF = () => {
    // Implementar exportação para PDF
    alert('Exportação para PDF ainda não implementada');
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 print:p-0">
      <div className="print:hidden flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Relatório de Precificação
        </h2>
        <div className="flex space-x-2">
          <DataExport 
            data={pricingData} 
            filename={`relatorio-precificacao-${product.name}-${new Date().toISOString().split('T')[0]}`} 
          />
          <button
            onClick={handleExportPDF}
            className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <Printer className="w-4 h-4 mr-1" />
            Imprimir
          </button>
        </div>
      </div>
      
      {/* Informações do produto */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg print:bg-white print:dark:bg-gray-800">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
          Informações do Produto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Custo do Produto</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">R$ {product.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Margem de Lucro Desejada</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{profitMargin}%</p>
          </div>
        </div>
      </div>
      
      {/* Tabela de precificação por marketplace */}
      <div className="mb-6 overflow-x-auto">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Precificação por Marketplace
        </h3>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 print:text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700 print:bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-gray-700">
                Marketplace
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-gray-700">
                Custo Total
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-gray-700">
                Preço Sugerido
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-gray-700">
                Lucro Bruto
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-gray-700">
                Margem
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-gray-700">
                Recebimento
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {pricingData.map((pricing, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 print:hover:bg-none">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white print:text-gray-900">
                  {pricing.marketplace}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white print:text-gray-900">
                  R$ {pricing.totalCost.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white print:text-gray-900">
                  R$ {pricing.suggestedPrice.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white print:text-gray-900">
                  R$ {pricing.grossProfit.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 print:bg-none print:text-gray-900">
                    {pricing.actualProfitMargin.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 print:text-gray-500">
                  {pricing.averagePaymentTerm} dias
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Resumo de custos totais */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg print:bg-white print:dark:bg-gray-800">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Resumo de Custos Totais (Todos os Marketplaces)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Comissões</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalCommissionCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Taxas Fixas</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalFixedFee.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Impostos</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalTaxCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Custos Operacionais</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalOperationalCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Envio</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalShippingCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Marketing</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalMarketingCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Custos Personalizados</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              R$ {totalCustomCosts.toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">Custo Total Acumulado</p>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
              R$ {(totalCommissionCost + totalFixedFee + totalTaxCost + totalOperationalCost + totalShippingCost + totalMarketingCost + totalCustomCosts).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Notas */}
      <div className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500">
        <p>Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        <p className="mt-1">* Os valores são calculados com base na margem de lucro desejada de {profitMargin}%</p>
      </div>
    </div>
  );
};

export default PricingReport;