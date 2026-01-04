import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CustomCost } from '@/core/contexts/LocalDatabaseContext';
import FormField, { TextInput, NumberInput } from '@/shared/components/forms/FormField';
import toast from 'react-hot-toast';

interface AddCustomCostFormProps {
  onAddCost: (cost: CustomCost) => void;
}

export const AddCustomCostForm: React.FC<AddCustomCostFormProps> = ({ onAddCost }) => {
  const [newCustomCost, setNewCustomCost] = useState<CustomCost>({
    name: '',
    value: 0,
    type: 'fixed'
  });

  const handleAddCustomCost = () => {
    if (!newCustomCost.name.trim()) {
      toast.error('O nome do custo é obrigatório');
      return;
    }
    
    if (newCustomCost.type === 'percentage' && (newCustomCost.value < 0 || newCustomCost.value > 100)) {
      toast.error('O percentual deve estar entre 0 e 100');
      return;
    }
    
    if (newCustomCost.type === 'fixed' && newCustomCost.value < 0) {
      toast.error('O valor fixo não pode ser negativo');
      return;
    }
    
    onAddCost(newCustomCost);
    
    setNewCustomCost({
      name: '',
      value: 0,
      type: 'fixed'
    });
  };

  const handleCustomCostChange = (field: keyof CustomCost, value: string | number) => {
    setNewCustomCost(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
        Adicionar Custo Personalizado
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <TextInput
            value={newCustomCost.name}
            onChange={(value) => handleCustomCostChange('name', value)}
            placeholder="Nome do custo"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={newCustomCost.type}
            onChange={(e) => handleCustomCostChange('type', e.target.value as 'fixed' | 'percentage')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="fixed">Valor Fixo (R$)</option>
            <option value="percentage">Percentual (%)</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <NumberInput
            value={newCustomCost.value}
            onChange={(value) => handleCustomCostChange('value', value)}
            min={0}
            step={newCustomCost.type === 'percentage' ? '0.1' : '0.01'}
            placeholder={newCustomCost.type === 'percentage' ? '0.0' : '0.00'}
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleAddCustomCost}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};



