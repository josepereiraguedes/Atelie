import React from 'react';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';

interface DataExportProps {
  data: any;
  filename: string;
  onExportComplete?: () => void;
}

const DataExport: React.FC<DataExportProps> = ({ data, filename, onExportComplete }) => {
  const { products, marketplaceConfigs } = useLocalDatabase();
  
  const exportToCSV = () => {
    try {
      // Converter dados para formato CSV
      let csvContent = '';
      
      // Se for um array de objetos, converter para CSV
      if (Array.isArray(data)) {
        if (data.length > 0) {
          // Cabeçalhos
          const headers = Object.keys(data[0]);
          csvContent += headers.join(',') + '\n';
          
          // Linhas de dados
          data.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              // Se for uma string, colocar entre aspas
              if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
      } else {
        // Se for um objeto simples, converter para CSV com chave,valor
        csvContent += 'Campo,Valor\n';
        Object.entries(data).forEach(([key, value]) => {
          csvContent += `"${key}",${JSON.stringify(value)}\n`;
        });
      }
      
      // Criar e baixar o arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportComplete) onExportComplete();
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      alert('Erro ao exportar dados para CSV');
    }
  };
  
  const exportToExcel = () => {
    try {
      // Para uma implementação mais completa, seria necessário usar uma biblioteca
      // como xlsx, mas para manter as dependências mínimas, vamos exportar como CSV
      // com extensão .xlsx
      let csvContent = '';
      
      if (Array.isArray(data)) {
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          csvContent += headers.join(',') + '\n';
          
          data.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
      } else {
        csvContent += 'Campo,Valor\n';
        Object.entries(data).forEach(([key, value]) => {
          csvContent += `"${key}",${JSON.stringify(value)}\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportComplete) onExportComplete();
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar dados para Excel');
    }
  };
  
  const exportToJSON = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportComplete) onExportComplete();
    } catch (error) {
      console.error('Erro ao exportar para JSON:', error);
      alert('Erro ao exportar dados para JSON');
    }
  };
  
  const exportProductPricingReport = () => {
    try {
      // Criar um relatório detalhado de precificação para todos os produtos
      const reportData = products.map(product => {
        const pricingInfo: Record<string, any> = {
          'ID do Produto': product.id,
          'Nome do Produto': product.name,
          'Custo do Produto': product.cost,
          'Categoria': product.category,
          'Quantidade em Estoque': product.quantity
        };
        
        // Adicionar informações de precificação para cada marketplace
        marketplaceConfigs.forEach(config => {
          try {
            // Aqui precisaríamos de uma função para calcular a precificação
            // Vamos simular com dados genéricos
            pricingInfo[`${config.name} - Preço Sugerido`] = 'N/A';
            pricingInfo[`${config.name} - Margem`] = 'N/A';
            pricingInfo[`${config.name} - Lucro`] = 'N/A';
          } catch (error) {
            pricingInfo[`${config.name} - Preço Sugerido`] = 'Erro no cálculo';
            pricingInfo[`${config.name} - Margem`] = 'Erro no cálculo';
            pricingInfo[`${config.name} - Lucro`] = 'Erro no cálculo';
          }
        });
        
        return pricingInfo;
      });
      
      // Converter para CSV
      let csvContent = '';
      
      if (reportData.length > 0) {
        const headers = Object.keys(reportData[0]);
        csvContent += headers.join(',') + '\n';
        
        reportData.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            if (typeof value === 'string') {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-precificacao-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportComplete) onExportComplete();
    } catch (error) {
      console.error('Erro ao exportar relatório de precificação:', error);
      alert('Erro ao exportar relatório de precificação');
    }
  };
  
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        onClick={exportToCSV}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white transition-colors"
      >
        <FileText className="w-3 h-3 mr-1" />
        CSV
      </button>
      <button
        type="button"
        onClick={exportToExcel}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white transition-colors"
      >
        <FileSpreadsheet className="w-3 h-3 mr-1" />
        Excel
      </button>
      <button
        type="button"
        onClick={exportToJSON}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white transition-colors"
      >
        <FileJson className="w-3 h-3 mr-1" />
        JSON
      </button>
      {products && marketplaceConfigs && (
        <button
          type="button"
          onClick={exportProductPricingReport}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white transition-colors ml-2"
        >
          <Download className="w-3 h-3 mr-1" />
          Relatório Completo
        </button>
      )}
    </div>
  );
};

export default DataExport;