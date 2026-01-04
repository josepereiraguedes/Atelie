import React, { useState, useEffect } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { PageHeader, FormField, FormActions, SelectMarketplace } from '@/shared/components';
import { NumberInput, TextInput } from '@/shared/components/forms';
import { Plus, Trash2, Edit3, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdvancedCustomCostManager } from '@/features/marketplace/components';
import { MarketplaceCreateForm } from '@/features/marketplace/components';
import { MarketplaceList } from '@/features/marketplace/components';
import { DataExport } from '@/features/marketplace/components';

const MarketplaceSettings: React.FC = () => {
  const { marketplaceConfigs, addMarketplaceConfig, updateMarketplaceConfig, removeMarketplaceConfig } = useLocalDatabase();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MarketplacePricingConfig | null>(null);
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
  
  const handleEdit = (config: MarketplacePricingConfig) => {
    setEditingConfig(config);
    setFormData(config);
    setIsEditing(true);
  };

  const handleDelete = (marketplaceName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a configuração do marketplace ${marketplaceName}?`)) {
      removeMarketplaceConfig(marketplaceName);
      toast.success('Configuração removida com sucesso!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('O nome do marketplace é obrigatório');
      return;
    }
    
    try {
      if (isEditing && editingConfig) {
        updateMarketplaceConfig(formData);
        toast.success('Configuração atualizada com sucesso!');
      } else {
        // Verificar se já existe um marketplace com o mesmo nome
        if (marketplaceConfigs.some(config => config.name === formData.name)) {
          toast.error('Já existe um marketplace com este nome');
          return;
        }
        addMarketplaceConfig(formData);
        toast.success('Configuração adicionada com sucesso!');
      }
      
      // Resetar formulário
      setFormData({
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
      setIsEditing(false);
      setEditingConfig(null);
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleCancel = () => {
    setFormData({
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
    setIsEditing(false);
    setEditingConfig(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Configurações de Marketplaces" 
        backPath="/settings"
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Configure as taxas e custos para cada marketplace onde você vende
      </p>
      
      {/* Formulário de configuração */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEditing ? 'Editar Configuração' : 'Nova Configuração de Marketplace'}
          </h2>
          <DataExport 
            data={marketplaceConfigs} 
            filename={`configuracoes-marketplaces-${new Date().toISOString().split('T')[0]}`} 
          />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-x-auto pb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Marketplace *
            </label>
            <TextInput
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="Ex: Mercado Livre, Amazon, Shopee"
              disabled={isEditing}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comissão (%)
              </label>
              <NumberInput
                value={formData.commission_rate}
                onChange={(value) => setFormData({ ...formData, commission_rate: value })}
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
                onChange={(value) => setFormData({ ...formData, fixed_fee: value })}
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
                onChange={(value) => setFormData({ ...formData, tax_rate: value })}
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
                onChange={(value) => setFormData({ ...formData, operational_cost_rate: value })}
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
                onChange={(value) => setFormData({ ...formData, shipping_cost: value })}
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
                onChange={(value) => setFormData({ ...formData, marketing_rate: value })}
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
              onChange={(value) => setFormData({ ...formData, average_payment_term: value })}
              min={0}
              placeholder="0"
            />
          </div>
          
          {/* Seção de Custos Personalizados */}
          <AdvancedCustomCostManager
            customCosts={formData.custom_costs || []}
            onAddCost={(cost: CustomCost) => {
              setFormData(prev => ({
                ...prev,
                custom_costs: [...(prev.custom_costs || []), cost]
              }));
            }}
            onUpdateCost={(index: number, cost: CustomCost) => {
              const updatedCosts = [...(formData.custom_costs || [])];
              updatedCosts[index] = cost;
              setFormData(prev => ({
                ...prev,
                custom_costs: updatedCosts
              }));
            }}
            onRemoveCost={(index: number) => {
              setFormData(prev => ({
                ...prev,
                custom_costs: (prev.custom_costs || []).filter((_, i) => i !== index)
              }));
            }}
          />
          
          <FormActions
            cancelPath="/settings"
            onCancel={isEditing ? handleCancel : undefined}
            submitText={isEditing ? "Atualizar Configuração" : "Adicionar Configuração"}
          />
        </form>
      </div>
      
      {/* Lista de configurações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Configurações Cadastradas
          </h2>
          <DataExport 
            data={marketplaceConfigs} 
            filename={`configuracoes-marketplaces-${new Date().toISOString().split('T')[0]}`} 
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Marketplace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Taxa Fixa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Impostos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Custo Envio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {marketplaceConfigs.map((config) => (
                <tr key={config.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {config.commission_rate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      R$ {config.fixed_fee.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {config.tax_rate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      R$ {config.shipping_cost.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.name)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {marketplaceConfigs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        Nenhuma configuração cadastrada
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Adicione sua primeira configuração de marketplace
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSettings;
