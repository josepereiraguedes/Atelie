import React from 'react';
import { Trash2 } from 'lucide-react';
import { CustomCost } from '../../contexts/LocalDatabaseContext';
import AddCustomCostForm from './AddCustomCostForm';

interface CustomCostFormProps {
  customCosts: CustomCost[];
  onAddCost: (cost: CustomCost) => void;
  onRemoveCost: (index: number) => void;
}

const CustomCostForm: React.FC<CustomCostFormProps> = ({ 
  customCosts, 
  onAddCost, 
  onRemoveCost 
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
        Custos Adicionais Personalizados
      </h3>
      
      {/* Formulário para adicionar novo custo */}
      <AddCustomCostForm onAddCost={onAddCost} />
      
      {/* Lista de custos personalizados */}
      {customCosts.length > 0 && (
        <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
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
                    {cost.type === 'fixed' ? 'Valor Fixo' : 'Percentual'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {cost.type === 'fixed' ? `R$ ${cost.value.toFixed(2)}` : `${cost.value.toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium">
                    <button
                      onClick={() => onRemoveCost(index)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      title="Remover custo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomCostForm;