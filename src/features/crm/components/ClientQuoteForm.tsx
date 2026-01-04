import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, Package } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { ClientQuote, Product, ClientQuoteItem } from '@/shared/types/database.types';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/forms/PageHeader';
import FormActions from '@/shared/components/forms/FormActions';
import { useAppNavigation } from '@/shared/hooks/useNavigation';
import { useFormHandler } from '@/shared/hooks/useFormHandler';
import useFormItems from '@/shared/hooks/useFormItems';
import ErrorBoundary from '@/shared/components/forms/ErrorBoundary';

interface ClientQuoteItemForm {
  id?: number;
  client_quote_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string;
}

interface ClientQuoteFormData {
  client_id: number;
  quote_number: string;
  quote_date: string;
  validity_date: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes: string;
  items: ClientQuoteItemForm[];
}

const ClientQuoteForm: React.FC = () => {
  const { id } = useParams();
  const { clients, products, clientQuotes, addClientQuote, updateClientQuote } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Orçamento salvo com sucesso!',
    errorMessage: 'Erro ao salvar orçamento'
  });
  
  console.log('Renderizando ClientQuoteForm com id:', id);

  const [formData, setFormData] = useState<ClientQuoteFormData>({
    client_id: 0,
    quote_number: '',
    quote_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    status: 'draft',
    notes: '',
    items: []
  });
  
  const {
    items: quoteItems,
    updateItem: updateQuoteItem,
    addItem: addQuoteItem,
    removeItem: removeQuoteItem
  } = useFormItems<ClientQuoteItemForm>(formData.items);

  // Se estiver editando, carregar os dados do orçamento
  useEffect(() => {
    if (id) {
      const quote = clientQuotes.find(q => q.id === parseInt(id));
      if (quote) {
        // Garantir que os itens sejam um array válido
        const items = Array.isArray(quote.items) ? quote.items : [];
        
        setFormData({
          client_id: quote.client_id,
          quote_number: quote.quote_number || '',
          quote_date: quote.quote_date,
          validity_date: quote.validity_date || '',
          status: quote.status,
          notes: quote.notes || '',
          items: items // Carregar os itens do orçamento
        });
      }
    }
  }, [id, clientQuotes]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof ClientQuoteItemForm, value: string | number) => {
    // Se estiver mudando o produto, preencher o preço unitário com o preço de venda
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updateQuoteItem(index, 'product_id', value as number);
        updateQuoteItem(index, 'unit_price', product.sale_price || 0);
        updateQuoteItem(index, 'total', (quoteItems[index]?.quantity || 0) * (product.sale_price || 0));
      } else {
        updateQuoteItem(index, 'product_id', value as number);
      }
    } else {
      updateQuoteItem(index, field, value);
    }
    
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      items: quoteItems
    }));
  }, [products, updateQuoteItem, quoteItems]);

  const handleAddItem = useCallback(() => {
    const newItem: ClientQuoteItemForm = {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total: 0
    };
    
    addQuoteItem(newItem);
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      items: quoteItems
    }));
  }, [addQuoteItem, quoteItems]);

  const handleRemoveItem = useCallback((index: number) => {
    removeQuoteItem(index);
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      items: quoteItems
    }));
  }, [removeQuoteItem, quoteItems]);

  const calculateTotal = useCallback(() => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  }, [quoteItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se há itens no orçamento
    if (formData.items.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento');
      return;
    }
    
    // Verificar se todos os itens têm produto selecionado
    const hasInvalidItem = formData.items.some(item => item.product_id === 0);
    if (hasInvalidItem) {
      toast.error('Selecione um produto para cada item do orçamento');
      return;
    }
    
    try {
      await handleFormSubmit(async () => {
        const quoteData = {
          client_id: formData.client_id,
          quote_number: formData.quote_number,
          quote_date: formData.quote_date,
          validity_date: formData.validity_date,
          status: formData.status,
          notes: formData.notes,
          total: calculateTotal(),
          items: formData.items // Incluir os itens no orçamento
        };
        
        if (id) {
          // Atualizar orçamento existente
          return await updateClientQuote(parseInt(id), quoteData);
        } else {
          // Criar novo orçamento
          return await addClientQuote(quoteData);
        }
      });
      goTo('/client-quotes');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader 
          title={id ? 'Editar Orçamento de Cliente' : 'Novo Orçamento de Cliente'} 
          backPath="/client-quotes"
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informações do Orçamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente *
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número do Orçamento
                </label>
                <input
                  type="text"
                  name="quote_number"
                  value={formData.quote_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Número do orçamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data do Orçamento *
                </label>
                <input
                  type="date"
                  name="quote_date"
                  value={formData.quote_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Validade
                </label>
                <input
                  type="date"
                  name="validity_date"
                  value={formData.validity_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviado</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="expired">Expirado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Informações adicionais sobre o orçamento"
                />
              </div>
            </div>

            {/* Itens do Orçamento */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Itens do Orçamento
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Adicionar Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum item adicionado. Clique em "Adicionar Item" para incluir produtos no orçamento.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Produto *
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Selecione um produto</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.quantity === 0 ? '' : item.quantity.toString()}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleItemChange(index, 'quantity', 0);
                            } else {
                              const numericValue = parseFloat(value) || 0;
                              handleItemChange(index, 'quantity', numericValue);
                            }
                          }}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Preço Unitário *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.unit_price === 0 ? '' : item.unit_price.toString()}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleItemChange(index, 'unit_price', 0);
                            } else {
                              const numericValue = parseFloat(value) || 0;
                              handleItemChange(index, 'unit_price', numericValue);
                            }
                          }}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Total
                        </label>
                        <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                          R$ {item.total.toFixed(2)}
                        </div>
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total do Orçamento */}
                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total do Orçamento
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {calculateTotal().toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => goTo('/client-quotes')}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Orçamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ClientQuoteForm;

