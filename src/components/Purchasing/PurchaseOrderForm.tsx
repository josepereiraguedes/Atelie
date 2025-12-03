import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, Package } from 'lucide-react';
import { useLocalDatabase, Product } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import FormActions from '../common/FormActions';
import { useAppNavigation } from '../../hooks/useNavigation';
import { useFormHandler } from '../../hooks/useFormHandler';
import useFormItems from '../../hooks/useFormItems';
import ErrorBoundary from '../common/ErrorBoundary';

interface PurchaseOrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string;
}

interface PurchaseOrderFormData {
  supplier_id: number;
  order_number: string;
  order_date: string;
  expected_delivery: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  notes: string;
  items: PurchaseOrderItem[];
}

const PurchaseOrderForm: React.FC = () => {
  const { id } = useParams();
  const { suppliers, products, purchaseOrders, addPurchaseOrder, updatePurchaseOrder } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Pedido de compra salvo com sucesso!',
    errorMessage: 'Erro ao salvar pedido de compra'
  });
  
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: 0,
    order_number: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    status: 'draft',
    notes: '',
    items: []
  });
  
  const {
    items: orderItems,
    setItems: setOrderItems,
    updateItem: updateOrderItem,
    addItem: addOrderItem,
    removeItem: removeOrderItem,
    calculateTotal: calculateOrderTotal,
    updateItemProduct
  } = useFormItems<PurchaseOrderItem>(formData.items);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Se estiver editando, carregar os dados do pedido
  useEffect(() => {
    if (id) {
      const order = purchaseOrders.find(o => o.id === parseInt(id));
      if (order) {
        setFormData({
          supplier_id: order.supplier_id,
          order_number: order.order_number || '',
          order_date: order.order_date,
          expected_delivery: order.delivery_date || '',
          status: order.status,
          notes: order.notes || '',
          items: order.items?.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            notes: item.notes
          })) || []
        });
      }
    }
  }, [id, purchaseOrders]);

  // Carregar produtos do fornecedor quando o fornecedor for selecionado
  useEffect(() => {
    if (formData.supplier_id > 0) {
      const supplier = suppliers.find(s => s.id === formData.supplier_id);
      if (supplier) {
        const suppliedProducts = products.filter(p => 
          p.supplier_id === formData.supplier_id
        );
        setSupplierProducts(suppliedProducts);
      } else {
        setSupplierProducts([]);
      }
    } else {
      setSupplierProducts([]);
    }
  }, [formData.supplier_id, suppliers, products]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    updateOrderItem(index, field, value);
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      items: orderItems
    }));
  }, [updateOrderItem, orderItems]);

  const handleAddItem = useCallback((productId?: number) => {
    const newItem: PurchaseOrderItem = {
      product_id: productId || 0,
      quantity: 1,
      unit_price: 0,
      total: 0
    };
    
    addOrderItem(newItem);
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      items: orderItems
    }));
  }, [addOrderItem, orderItems]);

  const addSupplierProduct = useCallback((product: Product) => {
    const newItem: PurchaseOrderItem = {
      product_id: product.id,
      quantity: 1,
      unit_price: product.cost || 0,
      total: product.cost || 0,
      notes: ''
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductSelector(false);
    setSearchTerm('');
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    removeOrderItem(index);
    // Sync with formData
    setFormData(prev => ({
      ...prev,
      items: orderItems
    }));
  }, [removeOrderItem, orderItems]);

  const calculateTotal = () => {
    return calculateOrderTotal();
  };

  // Atualizar custo unitário quando o produto for selecionado
  const handleProductSelect = useCallback((index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItemProduct(index, productId, product.cost || 0);
      // Sync with formData
      setFormData(prev => ({
        ...prev,
        items: orderItems
      }));
    } else {
      updateItemProduct(index, productId);
      // Sync with formData
      setFormData(prev => ({
        ...prev,
        items: orderItems
      }));
    }
  }, [products, updateItemProduct, orderItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se há itens no pedido
    if (formData.items.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido');
      return;
    }
    
    // Verificar se todos os itens têm produto selecionado
    const hasInvalidItem = formData.items.some(item => item.product_id === 0);
    if (hasInvalidItem) {
      toast.error('Selecione um produto para cada item do pedido');
      return;
    }

    try {
      await handleFormSubmit(async () => {
        // Preparar dados para salvar
        const orderData = {
          supplier_id: formData.supplier_id,
          order_number: formData.order_number,
          order_date: formData.order_date,
          delivery_date: formData.expected_delivery,
          status: formData.status,
          notes: formData.notes,
          total: calculateTotal(),
          items: formData.items
        };

        if (id) {
          // Atualizar pedido existente
          const orderId = parseInt(id);
          await updatePurchaseOrder(orderId, orderData);
        } else {
          // Criar novo pedido
          await addPurchaseOrder(orderData);
        }
      });
      goTo('/purchase-orders');
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader 
          title={id ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'} 
          backPath="/purchase-orders"
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações do Pedido */}
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
                Número do Pedido
              </label>
              <input
                type="text"
                name="order_number"
                value={formData.order_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Número do pedido"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data do Pedido *
              </label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Prevista de Entrega
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
                <option value="ordered">Pedido</option>
                <option value="partially_received">Parcialmente Recebido</option>
                <option value="received">Recebido</option>
                <option value="cancelled">Cancelado</option>
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
                placeholder="Informações adicionais sobre o pedido"
              />
            </div>
          </div>

          {/* Produtos do Fornecedor */}
          {formData.supplier_id > 0 && supplierProducts.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Produtos deste Fornecedor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {supplierProducts.map(product => (
                  <div 
                    key={product.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addSupplierProduct(product)}
                  >
                    <div className="flex items-start">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Custo: R$ {Number(product.cost || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Estoque: {product.quantity} unidades
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          + Adicionar
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itens do Pedido */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Itens do Pedido
              </h3>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Adicionar Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum item adicionado. Clique em "Adicionar Item" para incluir produtos no pedido.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.product_id);
                  return (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Produto *
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => handleProductSelect(index, parseInt(e.target.value))}
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
                        {product && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Estoque atual: {product.quantity} unidades
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Custo Unitário *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
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
                  );
                })}

                {/* Total do Pedido */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total do Pedido
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
            <FormActions
              cancelPath="/purchase-orders"
              submitText="Salvar Pedido"
              loading={loading}
            />
          </div>
        </form>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default PurchaseOrderForm;