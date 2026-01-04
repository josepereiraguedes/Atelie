import React, { useState } from 'react';
import { MarketplacePricingConfig, CustomCost } from '@/core/contexts/LocalDatabaseContext';
import FormField, { NumberInput, TextInput } from '@/shared/components/forms/FormField';
import { CustomCostForm } from './CustomCostForm';
import { Plus } from 'lucide-react';

interface MarketplaceCreateFormProps {
  onSave: (config: MarketplacePricingConfig) => void;
  onCancel: () => void;
}

export const MarketplaceCreateForm: React.FC<MarketplaceCreateFormProps> = ({ 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<MarketplacePricingConfig>({
    name: '',
    commission_rate: 0,
    fixed_fee: 0,
    tax_rate: 0,
    operational_cost_rate: 0,
    shipping_cost: 0,
    marketing_rate: 0,
    average_payment_term: 0,
    custom_costs: []
  });
  
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
    
    if (!formData.name.trim()) {
      alert('O nome do marketplace é obrigatório');
      return;
    }
    
    onSave(formData);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Nova Configuração de Marketplace
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
        <CustomCostForm
          customCosts={formData.custom_costs || []}
          onAddCost={handleCustomCostAdd}
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
            Adicionar Configuração
          </button>
        </div>
      </form>
    </div>
  );
};



