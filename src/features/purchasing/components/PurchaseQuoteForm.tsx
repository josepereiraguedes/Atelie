import React, { useState, useEffect, memo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, Package } from 'lucide-react';
import { useLocalDatabase, PurchaseQuoteItem as PurchaseQuoteItemInterface } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/forms/PageHeader';
import FormActions from '@/shared/components/forms/FormActions';
import { useAppNavigation } from '@/shared/hooks/useNavigation';
import { useFormHandler } from '@/shared/hooks/useFormHandler';

type PurchaseQuoteItemForm = PurchaseQuoteItemInterface;

interface PurchaseQuoteFormData {
  supplier_id: number;
  quote_number: string;
  quote_date: string;
  expected_delivery: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes: string;
  items: PurchaseQuoteItemForm[];
}

const PurchaseQuoteForm: React.FC = () => {
  const { id } = useParams();
  const { suppliers, products, purchaseQuotes, addPurchaseQuote, updatePurchaseQuote } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Orçamento salvo com sucesso!',
    errorMessage: 'Erro ao salvar orçamento'
  });
  
  console.log('Renderizando PurchaseQuoteForm com id:', id);

  const [formData, setFormData] = useState<PurchaseQuoteFormData>({
    supplier_id: 0,
    quote_number: '',
    quote_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    status: 'draft',
    notes: '',
    items: []
  });

  // Se estiver editando, carregar os dados do orçamento
  useEffect(() => {
    if (id) {
      const quote = purchaseQuotes.find(q => q.id === parseInt(id));
      if (quote) {
        setFormData({
          supplier_id: quote.supplier_id,
          quote_number: quote.quote_number || '',
          quote_date: quote.quote_date,
          expected_delivery: quote.validity_date || '', // Corrigido para usar validity_date
          status: quote.status,
          notes: quote.notes || '',
          items: [] // Os itens seriam carregados separadamente
        });
      }
    }
  }, [id, purchaseQuotes]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof PurchaseQuoteItemForm, value: string | number) => {
    const updatedItems = [...formData.items];
    const currentItem = { ...updatedItems[index] };
    
    // Apenas atualizar o valor no estado sem conversão imediata
    if (field === 'quantity') {
      // Armazenar o valor como string durante a digitação
      currentItem.quantity = value as number;
    } else if (field === 'unit_price') {
      // Armazenar o valor como string durante a digitação
      currentItem.unit_price = value as number;
    } else if (field === 'product_id') {
      currentItem.product_id = value as number;
    } else if (field === 'total') {
      currentItem.total = value as number;
    }
    
    // Recalcular total apenas quando tivermos valores numéricos válidos
    const quantity = typeof currentItem.quantity === 'string' ? parseFloat(currentItem.quantity) || 0 : currentItem.quantity;
    const unit_price = typeof currentItem.unit_price === 'string' ? parseFloat(currentItem.unit_price) || 0 : currentItem.unit_price;
    
    if (!isNaN(quantity) && !isNaN(unit_price)) {
      currentItem.total = quantity * unit_price;
    }
    
    updatedItems[index] = currentItem;
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  }, [formData.items]);

  const addItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: 0,
          quantity: 1,
          unit_price: 0,
          total: 0
        }
      ]
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return {
        ...prev,
        items: newItems
      };
    });
  }, []);

  const calculateTotal = useCallback(() => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  }, [formData.items]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar dados obrigatórios
    if (!formData.supplier_id) {
      toast.error('Selecione um fornecedor');
      return;
    }
    
    if (!formData.quote_date) {
      toast.error('Informe a data do orçamento');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    
    // Validar itens e converter valores
    const validatedItems = formData.items.map(item => {
      // Converter valores para números no momento do envio
      const quantity = typeof item.quantity === 'string' ? (item.quantity === '' ? 0 : parseFloat(item.quantity) || 0) : item.quantity;
      const unit_price = typeof item.unit_price === 'string' ? (item.unit_price === '' ? 0 : parseFloat(item.unit_price) || 0) : item.unit_price;
      const total = typeof item.total === 'string' ? (item.total === '' ? 0 : parseFloat(item.total) || 0) : item.total;
      
      return {
        ...item,
        quantity: Math.max(0, quantity),
        unit_price: Math.max(0, unit_price),
        total: Math.max(0, total)
      };
    });
    
    // Verificar se todos os itens têm produto selecionado
    for (const item of validatedItems) {
      if (!item.product_id) {
        toast.error('Selecione um produto para todos os itens');
        return;
      }
    }
    
    try {
      await handleFormSubmit(async () => {
        const quoteData = {
          ...formData,
          items: validatedItems,
          total: validatedItems.reduce((sum, item) => sum + item.total, 0)
        };
        
        if (id) {
          return await updatePurchaseQuote(parseInt(id), quoteData);
        } else {
          return await addPurchaseQuote(quoteData);
        }
      });
      goTo('/purchase-quotes');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    }
  }, [formData, id, handleFormSubmit, updatePurchaseQuote, addPurchaseQuote, goTo]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={id ? 'Editar Orçamento' : 'Novo Orçamento'} 
        backPath="/purchase-quotes"
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações do Orçamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fornecedor *
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
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
                name="expected_delivery"
                value={formData.expected_delivery}
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
          </div>

          {/* Itens do Orçamento */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Itens do Orçamento
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </button>
            </div>

            {formData.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Preço Unitário
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.items.map((item, index) => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <select
                              value={item.product_id}
                              onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">Selecione um produto</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            R$ {item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum item adicionado</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Adicione itens ao orçamento clicando no botão "Adicionar Item".
                </p>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Observações sobre o orçamento"
            />
          </div>

          <FormActions
            cancelPath="/purchase-quotes"
            submitText="Salvar Orçamento"
            loading={loading}
          />
        </form>
      </div>
    </div>
  );
};

export default PurchaseQuoteForm;


