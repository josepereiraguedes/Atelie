import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalDatabase, Transaction, Product, Client } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import FormActions from '../common/FormActions';

const EditTransactionForm: React.FC = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, clients, transactions, updateTransaction } = useLocalDatabase();
  
  const [formData, setFormData] = useState({
    type: 'sale' as 'sale' | 'purchase' | 'adjustment',
    client_id: 0,
    payment_status: 'pending' as 'paid' | 'pending',
    description: '',
    product_id: 0,
    quantity: 0,
    unit_price: 0,
    total: 0
  });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const transactionId = parseInt(id);
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (transaction) {
        setFormData({
          type: transaction.type,
          product_id: transaction.product_id || 0,
          client_id: transaction.client_id || 0,
          quantity: transaction.quantity || 0,
          unit_price: transaction.unit_price || 0,
          total: transaction.total || 0,
          payment_status: transaction.payment_status,
          description: transaction.description || ''
        });
      }
    }
    setInitialLoading(false);
  }, [id, transactions]);

  const calculateTotal = useCallback((quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  }, []);

  const handleProductChange = useCallback((productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const unitPrice = formData.type === 'sale' ? product.sale_price : product.cost;
      const total = calculateTotal(formData.quantity, unitPrice);
      
      setFormData({
        ...formData,
        product_id: productId,
        unit_price: unitPrice,
        total
      });
    }
  }, [products, formData, calculateTotal]);

  const handleQuantityChange = useCallback((quantity: number) => {
    const total = calculateTotal(quantity, formData.unit_price);
    setFormData({
      ...formData,
      quantity,
      total
    });
  }, [formData, calculateTotal]);

  const handleUnitPriceChange = useCallback((unitPrice: number) => {
    const total = calculateTotal(formData.quantity, unitPrice);
    setFormData({
      ...formData,
      unit_price: unitPrice,
      total
    });
  }, [formData, calculateTotal]);

  const handleTypeChange = useCallback((value: 'sale' | 'purchase' | 'adjustment') => {
    setFormData({ ...formData, type: value });
  }, [formData]);

  const handlePaymentStatusChange = useCallback((value: 'paid' | 'pending') => {
    setFormData({ ...formData, payment_status: value });
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast.error('ID da transação não encontrado');
      return;
    }

    try {
      // Validar dados obrigatórios
      if (formData.type !== 'adjustment' && !formData.product_id) {
        toast.error('Selecione um produto');
        return;
      }
      
      if (formData.quantity <= 0) {
        toast.error('A quantidade deve ser maior que zero');
        return;
      }
      
      if (formData.unit_price < 0) {
        toast.error('O preço unitário não pode ser negativo');
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

  // Filtrar produtos com estoque disponível para vendas
  const availableProducts = useMemo(() => {
    return formData.type === 'sale' 
      ? products.filter(p => p.quantity > 0)
      : products;
  }, [formData.type, products]);

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader 
          title="Editar Transação" 
          backPath="/sales"
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader 
        title="Editar Transação" 
        backPath="/sales"
      />
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Transação *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value as 'sale' | 'purchase' | 'adjustment')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="sale">Venda</option>
              <option value="purchase">Compra</option>
              <option value="adjustment">Ajuste de Estoque</option>
            </select>
          </div>
          
          {formData.type !== 'adjustment' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Produto *
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {availableProducts.map((product: Product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Estoque: {product.quantity} - 
                      {formData.type === 'sale' ? ` Venda: R$${product.sale_price.toFixed(2)}` : ` Custo: R$${product.cost.toFixed(2)}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity || ''}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço Unitário *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price || ''}
                  onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecione um cliente (opcional)</option>
              {clients.map((client: Client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status do Pagamento
            </label>
            <select
              value={formData.payment_status}
              onChange={(e) => handlePaymentStatusChange(e.target.value as 'paid' | 'pending')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descrição da transação (opcional)"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                Total:
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {formData.total.toFixed(2)}
              </span>
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

export default EditTransactionForm;