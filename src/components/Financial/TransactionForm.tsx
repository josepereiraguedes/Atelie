import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLocalDatabase, Product, Client, Transaction, TransactionItem } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import FormActions from '../common/FormActions';
import { useAppNavigation } from '../../hooks/useNavigation';
import { useFormHandler } from '../../hooks/useFormHandler';
import useFormItems from '../../hooks/useFormItems';
import ErrorBoundary from '../common/ErrorBoundary';

interface TransactionItemForm {
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

interface TransactionFormProps {
  isEditing?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const { products, clients, transactions, addTransaction, updateTransaction } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Transação salva com sucesso!',
    errorMessage: 'Erro ao salvar transação'
  });
  
  const [type, setType] = useState<'sale' | 'purchase' | 'adjustment'>('sale');
  const [clientId, setClientId] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('pending');
  const [description, setDescription] = useState<string>('');
  const {
    items,
    setItems,
    updateItem,
    addItem,
    removeItem,
    calculateTotal
  } = useFormItems<TransactionItemForm>([
    { product_id: 0, quantity: 1, unit_price: 0, total: 0 }
  ]);

  // Carregar dados para edição
  useEffect(() => {
    if (isEditing && id) {
      const transactionId = parseInt(id);
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (transaction) {
        // Carregar dados básicos
        setType(transaction.type || 'sale');
        setClientId(transaction.client_id || 0);
        setPaymentStatus(transaction.payment_status || 'pending');
        setDescription(transaction.description || '');
        
        // Carregar itens da transação
        if (transaction.items && transaction.items.length > 0) {
          // Transação com múltiplos itens
          const loadedItems = transaction.items.map(item => ({
            product_id: item.product_id || 0,
            quantity: item.quantity || 0,
            unit_price: item.unit_price || 0,
            total: item.total || 0
          }));
          setItems(loadedItems);
        } else if (transaction.product_id !== undefined) {
          // Transação com item único (compatibilidade com versão anterior)
          setItems([{
            product_id: transaction.product_id || 0,
            quantity: transaction.quantity || 0,
            unit_price: transaction.unit_price || 0,
            total: transaction.total || 0
          }]);
        }
      } else {
        toast.error('Transação não encontrada');
        goTo('/sales');
      }
    }
  }, [isEditing, id, transactions, goTo]);

  const handleItemChange = useCallback((index: number, field: keyof TransactionItemForm, value: string | number) => {
    updateItem(index, field, value);
  }, [updateItem]);

  const handleAddItem = useCallback(() => {
    addItem({ product_id: 0, quantity: 1, unit_price: 0, total: 0 });
  }, [addItem]);

  const handleRemoveItem = useCallback((index: number) => {
    if (items.length > 1) {
      removeItem(index);
    } else {
      toast.error('Deve haver pelo menos um item na transação');
    }
  }, [items.length, removeItem]);

  // Use the calculateTotal function from useFormItems

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verificar se todos os itens têm produto selecionado
      const hasInvalidItem = items.some(item => item.product_id === 0);
      if (hasInvalidItem) {
        toast.error('Selecione um produto para cada item');
        return;
      }

      // Verificar se todos os itens têm quantidade válida
      const hasInvalidQuantity = items.some(item => item.quantity <= 0);
      if (hasInvalidQuantity) {
        toast.error('A quantidade de cada item deve ser maior que zero');
        return;
      }

      await handleFormSubmit(async () => {
        if (isEditing && id) {
          // Atualizar transação existente (mantendo compatibilidade com versão anterior para itens únicos)
          if (items.length === 1) {
            // Transação com item único (compatibilidade com versão anterior)
            return await updateTransaction(parseInt(id), {
              type,
              product_id: items[0].product_id,
              client_id: clientId || undefined,
              quantity: items[0].quantity,
              unit_price: items[0].unit_price,
              total: items[0].total,
              payment_status: paymentStatus,
              description: description || undefined
            });
          } else {
            // Transação com múltiplos itens
            return await updateTransaction(parseInt(id), {
              type,
              client_id: clientId || undefined,
              payment_status: paymentStatus,
              description: description || undefined,
              items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: item.total
              })),
              total: calculateTotal()
            });
          }
        } else {
          // Criar nova transação
          return await addTransaction({
            type,
            client_id: clientId || undefined,
            payment_status: paymentStatus,
            description: description || undefined,
            items: items.length > 1 ? items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total
            })) : undefined,
            // Para compatibilidade com versão anterior, manter os campos individuais quando há apenas um item
            ...(items.length === 1 ? {
              product_id: items[0].product_id,
              quantity: items[0].quantity,
              unit_price: items[0].unit_price,
              total: items[0].total
            } : { total: calculateTotal() })
          });
        }
      });
      goTo('/sales');
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  // Atualizar preço unitário quando o produto mudar
  const handleProductChange = useCallback((index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...items];
      const currentItem = { ...updatedItems[index] };
      
      currentItem.product_id = productId;
      currentItem.unit_price = type === 'sale' ? (product.sale_price || 0) : (product.cost || 0);
      currentItem.total = currentItem.quantity * currentItem.unit_price;
      
      updatedItems[index] = currentItem;
      setItems(updatedItems);
    }
  }, [products, items, type, setItems]);

  // Atualizar tipo de transação
  const handleTypeChange = useCallback((newType: 'sale' | 'purchase' | 'adjustment') => {
    setType(newType);
    // Resetar cliente para ajustes
    if (newType === 'adjustment') {
      setClientId(0);
    }
    // Atualizar preço unitário de todos os itens com base no tipo
    const updatedItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        return {
          ...item,
          unit_price: newType === 'sale' ? (product.sale_price || 0) : (product.cost || 0),
          total: item.quantity * (newType === 'sale' ? (product.sale_price || 0) : (product.cost || 0))
        };
      }
      return item;
    });
    setItems(updatedItems);
  }, [products, items, setItems]);

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader 
          title={isEditing ? 'Editar Transação' : 'Nova Transação'} 
          backPath="/sales"
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tipo de Transação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Transação
              </label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as 'sale' | 'purchase' | 'adjustment')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="sale">Venda</option>
                <option value="purchase">Compra</option>
                <option value="adjustment">Ajuste de Estoque</option>
              </select>
            </div>

            {/* Cliente (apenas para vendas) */}
            {type === 'sale' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cliente
                </label>
                <select
                  value={clientId || 0}
                  onChange={(e) => setClientId(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="0">Selecione um cliente (opcional)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id || 0}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status de Pagamento
              </label>
              <select
                value={paymentStatus || 'pending'}
                onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'pending')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>

          {/* Itens da Transação */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Itens da Transação
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

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  {/* Produto */}
                  <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Produto *
                    </label>
                    <select
                      value={item.product_id || 0}
                      onChange={(e) => handleProductChange(index, parseInt(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="0">Selecione um produto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id || 0}>
                          {product.name} (Estoque: {product.quantity || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || 0}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Preço Unitário */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preço Unitário *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price || 0}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Total */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                      <span className="font-medium text-gray-900 dark:text-white">
                        R$ {item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Remover Item */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Geral */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total da Transação
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Detalhes adicionais sobre a transação..."
            />
          </div>

          {/* Botões */}
          <FormActions
            cancelPath="/sales"
            submitText="Salvar Transação"
            loading={loading}
            onSubmit={() => handleSubmit({} as React.FormEvent)}
          />
        </form>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default TransactionForm;