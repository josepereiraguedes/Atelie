import React, { useState, useEffect, memo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLocalDatabase, GoodsReceiptItem as GoodsReceiptItemInterface, Product } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import FormActions from '../common/FormActions';
import { useAppNavigation } from '../../hooks/useNavigation';
import { useFormHandler } from '../../hooks/useFormHandler';

interface GoodsReceiptItemForm {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string;
  damaged_quantity?: number; // Adicionando a propriedade que estava faltando
}

interface GoodsReceiptFormData {
  purchase_order_id: number;
  receipt_date: string;
  received_by: string;
  notes: string;
  status: 'pending' | 'received' | 'partially_received' | 'rejected';
  items: GoodsReceiptItemForm[];
}

const GoodsReceiptForm: React.FC = memo(() => {
  const { id } = useParams();
  const { purchaseOrders, products, addGoodsReceipt, updateGoodsReceipt } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Recebimento salvo com sucesso!',
    errorMessage: 'Erro ao salvar recebimento'
  });
  
  const [formData, setFormData] = useState<GoodsReceiptFormData>({
    purchase_order_id: 0,
    receipt_date: new Date().toISOString().split('T')[0],
    received_by: '',
    notes: '',
    status: 'pending',
    items: []
  });
  
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<number | null>(null);
  const [items, setItems] = useState<GoodsReceiptItemForm[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar itens do pedido quando um pedido é selecionado
  useEffect(() => {
    if (selectedPurchaseOrder) {
      // Encontrar o pedido selecionado
      const order = purchaseOrders.find(o => o.id === selectedPurchaseOrder);
      if (order && order.items) {
        // Converter itens do pedido em itens de recebimento
        const receiptItems = order.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
          notes: ''
        }));
        
        setItems(receiptItems);
      }
    }
  }, [selectedPurchaseOrder, purchaseOrders]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof GoodsReceiptItemForm, value: string | number) => {
    const updatedItems = [...items];
    const currentItem = { ...updatedItems[index] };
    
    // Garantir que os valores sejam números válidos
    if (field === 'quantity') {
      const quantity = parseInt(value as string) || 0;
      currentItem.quantity = Math.max(0, quantity);
      currentItem.total = currentItem.quantity * currentItem.unit_price;
    } else if (field === 'unit_price') {
      const price = parseFloat(value as string) || 0;
      currentItem.unit_price = Math.max(0, price);
      currentItem.total = currentItem.quantity * currentItem.unit_price;
    } else if (field === 'product_id') {
      currentItem.product_id = value as number;
    } else if (field === 'total') {
      currentItem.total = value as number;
    }
    
    updatedItems[index] = currentItem;
    setItems(updatedItems);
  }, [items]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se há itens no recebimento
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item ao recebimento');
      return;
    }
    
    // Verificar se todos os itens têm produto selecionado
    const hasInvalidItem = items.some(item => item.product_id === 0);
    if (hasInvalidItem) {
      toast.error('Selecione um produto para cada item do recebimento');
      return;
    }
    
    try {
      await handleFormSubmit(async () => {
        const goodsReceiptData = {
          purchase_order_id: formData.purchase_order_id,
          receipt_date: formData.receipt_date,
          received_by: formData.received_by,
          notes: formData.notes,
          total: items.reduce((sum, item) => sum + item.total, 0), // Calcular total
          items: [] // Os itens serão adicionados separadamente
        };
        
        if (id) {
          // Atualizar recebimento existente
          return await updateGoodsReceipt(parseInt(id), goodsReceiptData);
        } else {
          // Criar novo recebimento
          return await addGoodsReceipt(goodsReceiptData);
        }
      });
      goTo('/goods-receipts');
    } catch (error) {
      console.error('Erro ao salvar recebimento:', error);
    }
  }, [items, formData, id, handleFormSubmit, updateGoodsReceipt, addGoodsReceipt, goTo]);

  const getProductById = useCallback((productId: number) => {
    return products.find(p => p.id === productId);
  }, [products]);

  const addSupplierProduct = useCallback((product: Product) => {
    const newItem: GoodsReceiptItemForm = {
      product_id: product.id,
      quantity: 1,
      unit_price: product.cost || 0,
      total: product.cost || 0,
      notes: ''
    };
    
    setItems([...items, newItem]);
    setShowProductSelector(false);
    setSearchTerm('');
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={id ? 'Editar Recebimento' : 'Novo Recebimento'} 
        backPath="/goods-receipts"
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações do Recebimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pedido de Compra *
              </label>
              <select
                value={selectedPurchaseOrder || ''}
                onChange={(e) => setSelectedPurchaseOrder(parseInt(e.target.value) || null)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione um pedido de compra</option>
                {purchaseOrders
                  .filter(order => order.status === 'ordered')
                  .map(order => (
                    <option key={order.id} value={order.id}>
                      Pedido #{order.order_number || order.id} - {order.supplier?.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data do Recebimento *
              </label>
              <input
                type="date"
                name="receipt_date"
                value={formData.receipt_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recebido por
              </label>
              <input
                type="text"
                name="received_by"
                value={formData.received_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nome do responsável pelo recebimento"
              />
            </div>
          </div>

          {/* Itens do Recebimento */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Itens do Recebimento
              </h3>
              <button
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </button>
            </div>

            {items.length > 0 ? (
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
                    {items.map((item, index) => {
                      const product = getProductById(item.product_id);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {product ? (
                              <div className="flex items-center">
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-8 h-8 object-cover rounded-md mr-3" 
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md mr-3 flex items-center justify-center">
                                    <Package size={16} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                                    {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-500 dark:text-gray-400">Produto não encontrado</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            R$ {item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = [...items];
                                updatedItems.splice(index, 1);
                                setItems(updatedItems);
                              }}
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
                  Adicione itens ao recebimento clicando no botão "Adicionar Item".
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
              placeholder="Observações sobre o recebimento"
            />
          </div>

          <FormActions
            cancelPath="/goods-receipts"
            submitText="Salvar Recebimento"
            loading={loading}
          />
        </form>
      </div>
    </div>
  );
});

export default GoodsReceiptForm;