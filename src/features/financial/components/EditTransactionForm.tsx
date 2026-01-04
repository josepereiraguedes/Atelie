import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalDatabase, Transaction, Product, Client } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/shared/components/forms/PageHeader';
import FormActions from '@/shared/components/forms/FormActions';

export const EditTransactionForm: React.FC = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, clients, transactions, updateTransaction } = useLocalDatabase();
  
  console.log('Renderizando EditTransactionForm com id:', id);

  const [formData, setFormData] = useState({
    type: 'sale' as 'sale' | 'purchase' | 'adjustment',
    client_id: 0,
    payment_status: 'pending' as 'paid' | 'pending',
    description: '',
    transaction_date: '',
    items: [] as {
      product_id: number;
      quantity: number;
      unit_price: number;
      total: number;
    }[]
  });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const transaction = transactions.find(t => t.id === parseInt(id));
      if (transaction) {
        setFormData({
          type: transaction.type,
          client_id: transaction.client_id || 0,
          payment_status: transaction.payment_status,
          description: transaction.description || '',
          transaction_date: transaction.created_at ? transaction.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          items: transaction.items?.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total
          })) || []
        });
      }
    }
  }, [id, transactions]);

  const calculateTotal = useCallback(() => {
    return formData.items.reduce((acc, item) => acc + item.total, 0);
  }, [formData.items]);

  const addItem = useCallback(() => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: 0,
          quantity: 0,
          unit_price: 0,
          total: 0
        }
      ]
    });
  }, [formData.items]);

  const removeItem = useCallback((index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  }, [formData.items]);

  const updateItem = useCallback((index: number, field: 'product_id' | 'quantity' | 'unit_price', value: number) => {
    const items = formData.items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: value,
          total: item.quantity * item.unit_price
        };
      }
      return item;
    });

    setFormData({
      ...formData,
      items
    });
  }, [formData.items]);

  // Filtrar produtos com estoque disponível para vendas
  const availableProducts = useMemo(() => {
    return formData.type === 'sale' 
      ? products.filter(p => p.quantity > 0)
      : products;
  }, [formData.type, products]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('ID da transação não encontrado');
      return;
    }

    try {
      // Validar dados obrigatórios
      if (formData.items.length === 0) {
        toast.error('Adicione pelo menos um item à transação');
        return;
      }

      await updateTransaction(parseInt(id), {
        ...formData,
        client_id: formData.client_id || undefined
      });
      toast.success('Transação atualizada com sucesso!');
      navigate('/sales');
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  }, [id, formData, updateTransaction, navigate]);

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader 
          title="Editar Transação"
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Editar Transação"
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Conteúdo do formulário */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Transação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Transação
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'sale' | 'purchase' | 'adjustment'})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="sale">Venda</option>
                <option value="purchase">Compra</option>
                <option value="adjustment">Ajuste de Estoque</option>
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="0">Selecione um cliente</option>
                {clients.map((client: Client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status do Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status do Pagamento
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({...formData, payment_status: e.target.value as 'paid' | 'pending'})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Data da Transação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data da Transação
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Itens da Transação */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Itens da Transação</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                {/* Produto */}
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Produto
                  </label>
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="0">Selecione um produto</option>
                    {availableProducts.map((product: Product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Estoque: {product.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantidade */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>

                {/* Preço Unitário */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço Unitário
                  </label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Total do Item */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    R$ {item.total.toFixed(2)}
                  </div>
                </div>

                {/* Botão Remover */}
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Remover item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo da Transação */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resumo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total de itens: {formData.items.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {calculateTotal().toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Valor total da transação
              </p>
            </div>
          </div>
        </div>

        <FormActions
          cancelPath="/sales"
          submitText="Atualizar Transação"
        />
      </form>
    </div>
  );
});



