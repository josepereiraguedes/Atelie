import React, { useState } from 'react';
import { CustomCost } from '@/shared/types/database.types';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdvancedCustomCostManagerProps {
  customCosts: CustomCost[];
  onAddCost: (cost: CustomCost) => void;
  onUpdateCost: (index: number, cost: CustomCost) => void;
  onRemoveCost: (index: number) => void;
}

export const AdvancedCustomCostManager: React.FC<AdvancedCustomCostManagerProps> = ({ 
  customCosts, 
  onAddCost, 
  onUpdateCost,
  onRemoveCost 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCustomCost, setNewCustomCost] = useState<CustomCost>({
    name: '',
    value: 0,
    type: 'fixed',
    category: ''
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
      type: 'fixed',
      category: ''
    });
    setIsAdding(false);
  };

  const handleUpdateCustomCost = () => {
    if (editingIndex === null) return;
    
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
    
    onUpdateCost(editingIndex, newCustomCost);
    
    setNewCustomCost({
      name: '',
      value: 0,
      type: 'fixed',
      category: ''
    });
    setEditingIndex(null);
  };

  const handleEdit = (index: number, cost: CustomCost) => {
    setNewCustomCost(cost);
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setNewCustomCost({
      name: '',
      value: 0,
      type: 'fixed',
      category: ''
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleCustomCostChange = (field: keyof CustomCost, value: string | number) => {
    // Se for o campo de valor, tratar como número
    if (field === 'value') {
      // Converter string para número se necessário
      const numericValue = typeof value === 'string' ? (value === '' ? 0 : parseFloat(value) || 0) : value;
      setNewCustomCost(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      // Para outros campos, usar o valor diretamente
      setNewCustomCost(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-900 dark:text-white">
          Custos Adicionais Personalizados
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Custo
        </button>
      </div>
      
      {/* Formulário para adicionar/editar custo */}
      {(isAdding || editingIndex !== null) && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {editingIndex !== null ? 'Editar Custo Personalizado' : 'Adicionar Custo Personalizado'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 overflow-x-auto pb-2">
            <div className="md:col-span-4 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Custo *
              </label>
              <input
                type="text"
                value={newCustomCost.name}
                onChange={(e) => handleCustomCostChange('name', e.target.value)}
                placeholder="Ex: Taxa de Processamento, Embalagem"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={newCustomCost.type}
                onChange={(e) => handleCustomCostChange('type', e.target.value as 'fixed' | 'percentage')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="fixed">Valor Fixo (R$)</option>
                <option value="percentage">Percentual (%)</option>
              </select>
            </div>
            <div className="md:col-span-2 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor *
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={newCustomCost.value === 0 ? '' : newCustomCost.value.toString()}
                onChange={(e) => handleCustomCostChange('value', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleCustomCostChange('value', 0);
                  } else {
                    const numericValue = parseFloat(value) || 0;
                    handleCustomCostChange('value', numericValue);
                  }
                }}
                min={0}
                step={newCustomCost.type === 'percentage' ? '0.1' : '0.01'}
                placeholder={newCustomCost.type === 'percentage' ? '0.0' : '0.00'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-3 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria (opcional)
              </label>
              <input
                type="text"
                value={newCustomCost.category || ''}
                onChange={(e) => handleCustomCostChange('category', e.target.value)}
                placeholder="Ex: Logística, Marketing"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-1 flex items-end min-w-[120px]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={editingIndex !== null ? handleUpdateCustomCost : handleAddCustomCost}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                >
                  {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm whitespace-nowrap"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de custos personalizados */}
      {customCosts.length > 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customCosts.map((cost, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{cost.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {cost.category || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {cost.type === 'fixed' ? 'Valor Fixo' : 'Percentual'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {cost.type === 'fixed' ? `R$ ${cost.value.toFixed(2)}` : `${cost.value.toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleEdit(index, cost)}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                          title="Editar custo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveCost(index)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Remover custo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum custo personalizado adicionado ainda
          </p>
        </div>
      )}
    </div>
  );
};

