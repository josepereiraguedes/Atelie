import React, { useState, useEffect } from 'react';
import { MarketplacePricingConfig, CustomCost } from '../../contexts/LocalDatabaseContext';
import FormField, { NumberInput, TextInput } from '../common/FormField';
import AdvancedCustomCostManager from './AdvancedCustomCostManager';
import { Plus } from 'lucide-react';

interface MarketplaceEditFormProps {
  config: MarketplacePricingConfig;
  onSave: (config: MarketplacePricingConfig) => void;
  onCancel: () => void;
}

const MarketplaceEditForm: React.FC<MarketplaceEditFormProps> = ({ 
  config, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<MarketplacePricingConfig>(config);
  
  // Atualizar o formulário quando a configuração mudar
  useEffect(() => {
    setFormData(config);
  }, [config]);
  
  const handleChange = (field: keyof MarketplacePricingConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCustomCostAdd = (cost: CustomCost) => {
    setFormData(prev => ({
      ...prev,
      custom_costs: [...(prev.custom_costs || []), cost]
    }));
  };
  
  const handleCustomCostRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_costs: (prev.custom_costs || []).filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Editar Configuração de Marketplace
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 overflow-x-auto pb-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Marketplace *
          </label>
          <TextInput
            value={formData.name}
            onChange={(value) => handleChange('name', value)}
            placeholder="Ex: Mercado Livre, Amazon, Shopee"
            disabled
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comissão (%)
            </label>
            <NumberInput
              value={formData.commission_rate}
              onChange={(value) => handleChange('commission_rate', value)}
              min={0}
              max={100}
              step="0.1"
              placeholder="0.0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Taxa Fixa (R$)
            </label>
            <NumberInput
              value={formData.fixed_fee}
              onChange={(value) => handleChange('fixed_fee', value)}
              min={0}
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Impostos (%)
            </label>
            <NumberInput
              value={formData.tax_rate}
              onChange={(value) => handleChange('tax_rate', value)}
              min={0}
              max={100}
              step="0.1"
              placeholder="0.0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custo Operacional (%)
            </label>
            <NumberInput
              value={formData.operational_cost_rate}
              onChange={(value) => handleChange('operational_cost_rate', value)}
              min={0}
              max={100}
              step="0.1"
              placeholder="0.0"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custo de Envio (R$)
            </label>
            <NumberInput
              value={formData.shipping_cost}
              onChange={(value) => handleChange('shipping_cost', value)}
              min={0}
              step="0.01"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Marketing (%)
            </label>
            <NumberInput
              value={formData.marketing_rate}
              onChange={(value) => handleChange('marketing_rate', value)}
              min={0}
              max={100}
              step="0.1"
              placeholder="0.0"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prazo Médio de Recebimento (dias)
          </label>
          <NumberInput
            value={formData.average_payment_term}
            onChange={(value) => handleChange('average_payment_term', value)}
            min={0}
            placeholder="0"
          />
        </div>
        
        {/* Seção de Custos Personalizados */}
        <AdvancedCustomCostManager
          customCosts={formData.custom_costs || []}
          onAddCost={handleCustomCostAdd}
          onUpdateCost={(index, cost) => {
            const updatedCosts = [...(formData.custom_costs || [])];
            updatedCosts[index] = cost;
            setFormData(prev => ({
              ...prev,
              custom_costs: updatedCosts
            }));
          }}
          onRemoveCost={handleCustomCostRemove}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Salvar Configuração
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketplaceEditForm;