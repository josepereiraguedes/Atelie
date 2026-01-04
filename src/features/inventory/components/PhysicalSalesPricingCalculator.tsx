import React, { useState, useEffect } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Save, Calculator, RefreshCw } from 'lucide-react';

interface PricingFormula {
  id: string;
  name: string;
  description: string;
  formula: string; // Ex: "cost * (1 + margin/100) + fixedFee"
  parameters: {
    margin: number;
    fixedFee: number;
    percentageFee: number;
    minProfit: number;
  };
  isActive: boolean;
}

const PhysicalSalesPricingCalculator: React.FC = () => {
  const { products } = useLocalDatabase();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [formulas, setFormulas] = useState<PricingFormula[]>([
    {
      id: 'default',
      name: 'Fórmula Padrão',
      description: 'Custo + Margem (%) + Taxa Fixa',
      formula: 'cost * (1 + margin/100) + fixedFee',
      parameters: {
        margin: 30,
        fixedFee: 2.5,
        percentageFee: 0,
        minProfit: 1
      },
      isActive: true
    }
  ]);
  const [currentFormula, setCurrentFormula] = useState<PricingFormula>(formulas[0]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);
  const [profitMargin, setProfitMargin] = useState<number | null>(null);

  // Calcular preço quando o produto ou fórmula mudar
  useEffect(() => {
    if (selectedProduct === null) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Calcular o preço usando a fórmula
    const cost = product.cost;
    const { margin, fixedFee, percentageFee, minProfit } = currentFormula.parameters;
    
    // Fórmula básica: custo * (1 + margem%) + taxa fixa
    let price = cost * (1 + margin / 100) + fixedFee;
    
    // Adicionar taxa percentual adicional
    price = price * (1 + percentageFee / 100);
    
    // Garantir lucro mínimo
    const calculatedProfit = price - cost;
    if (calculatedProfit < minProfit) {
      price = cost + minProfit;
    }
    
    setCalculatedPrice(price);
    
    // Calcular lucro e margem
    const finalProfit = price - cost;
    const finalMargin = (finalProfit / price) * 100;
    
    setProfit(finalProfit);
    setProfitMargin(finalMargin);
  }, [selectedProduct, currentFormula, products]);

  const handleSaveFormula = () => {
    // Salvar fórmula no localStorage
    localStorage.setItem('physical-sales-pricing-formulas', JSON.stringify(formulas));
    alert('Fórmula salva com sucesso!');
  };

  const handleResetFormula = () => {
    const defaultFormula = formulas.find(f => f.id === 'default');
    if (defaultFormula) {
      setCurrentFormula(defaultFormula);
    }
  };

  const handleParameterChange = (param: keyof typeof currentFormula.parameters, value: number | string) => {
    // Converter string vazia para 0 ou manter o valor numérico
    const numericValue = value === '' ? 0 : Number(value);
    
    setCurrentFormula(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: numericValue
      }
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          <Calculator className="w-5 h-5 inline mr-2" />
          Calculadora de Precificação para Vendas Físicas
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleResetFormula}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </button>
          <button
            onClick={handleSaveFormula}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção de produto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecione um Produto
          </label>
          <select
            value={selectedProduct || ''}
            onChange={(e) => setSelectedProduct(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Selecione um produto</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (Custo: R$ {product.cost.toFixed(2)})
              </option>
            ))}
          </select>

          {selectedProduct !== null && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Informações do Produto
              </h4>
              {(() => {
                const product = products.find(p => p.id === selectedProduct);
                if (!product) return null;
                
                return (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500 dark:text-gray-400">Nome:</span> {product.name}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Categoria:</span> {product.category}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Custo:</span> R$ {product.cost.toFixed(2)}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Estoque:</span> {product.quantity} unidades</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Parâmetros da fórmula */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Parâmetros de Precificação
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margem de Lucro (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentFormula.parameters.margin === 0 ? '' : currentFormula.parameters.margin.toString()}
                onChange={(e) => handleParameterChange('margin', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleParameterChange('margin', 0);
                  } else {
                    const numericValue = parseFloat(value) || 0;
                    handleParameterChange('margin', numericValue);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taxa Fixa (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentFormula.parameters.fixedFee === 0 ? '' : currentFormula.parameters.fixedFee.toString()}
                onChange={(e) => handleParameterChange('fixedFee', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleParameterChange('fixedFee', 0);
                  } else {
                    const numericValue = parseFloat(value) || 0;
                    handleParameterChange('fixedFee', numericValue);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taxa Percentual Adicional (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentFormula.parameters.percentageFee === 0 ? '' : currentFormula.parameters.percentageFee.toString()}
                onChange={(e) => handleParameterChange('percentageFee', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleParameterChange('percentageFee', 0);
                  } else {
                    const numericValue = parseFloat(value) || 0;
                    handleParameterChange('percentageFee', numericValue);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lucro Mínimo (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentFormula.parameters.minProfit === 0 ? '' : currentFormula.parameters.minProfit.toString()}
                onChange={(e) => handleParameterChange('minProfit', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleParameterChange('minProfit', 0);
                  } else {
                    const numericValue = parseFloat(value) || 0;
                    handleParameterChange('minProfit', numericValue);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resultado do cálculo */}
      {calculatedPrice !== null && profit !== null && profitMargin !== null && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
            Resultado da Precificação
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Preço Sugerido</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                R$ {calculatedPrice.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Lucro</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                R$ {profit.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Margem de Lucro</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {profitMargin.toFixed(2)}%
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-blue-700 dark:text-blue-300">
            <p>
              Fórmula utilizada: Custo × (1 + {currentFormula.parameters.margin}%) + R$ {currentFormula.parameters.fixedFee}
              {currentFormula.parameters.percentageFee > 0 && ` × (1 + {currentFormula.parameters.percentageFee}%)`}
            </p>
          </div>
        </div>
      )}

      {/* Explicação da fórmula */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Como funciona a precificação?
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Esta calculadora ajuda você a determinar o preço ideal para vender seus produtos fisicamente. 
          A fórmula leva em conta o custo do produto, uma margem de lucro desejada, taxas fixas e 
          percentuais adicionais, garantindo que você obtenha um lucro mínimo em cada venda.
        </p>
      </div>
    </div>
  );
};

export default PhysicalSalesPricingCalculator;
