import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, Clock, CheckCircle, DollarSign, XCircle } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';

const PurchaseOrders: React.FC = () => {
  const { purchaseOrders, deletePurchaseOrder, updatePurchaseOrder, addGoodsReceipt } = useLocalDatabase();
  console.log('Pedidos de compra carregados:', purchaseOrders);
  console.log('Total de pedidos de compra:', purchaseOrders.length);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Calcular estatísticas
  const stats = useMemo(() => {
    return {
      totalOrders: purchaseOrders.length,
      draftOrders: purchaseOrders.filter(o => o.status === 'draft').length,
      orderedOrders: purchaseOrders.filter(o => o.status === 'ordered').length,
      receivedOrders: purchaseOrders.filter(o => o.status === 'received').length,
      cancelledOrders: purchaseOrders.filter(o => o.status === 'cancelled').length,
      totalOrderValue: purchaseOrders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [purchaseOrders]);

  const filteredOrders = useMemo(() => {
    console.log('Filtrando pedidos com termo:', searchTerm);
    console.log('Todos os pedidos:', purchaseOrders);
    const filtered = purchaseOrders.filter(order => 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.supplier && order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log('Pedidos filtrados:', filtered);
    console.log('Detalhes dos pedidos filtrados:');
    filtered.forEach(order => {
      console.log('- ID:', order.id, 'Número:', order.order_number, 'Status:', order.status);
    });
    return filtered;
  }, [purchaseOrders, searchTerm]);

  const handleDeletePurchaseOrder = async (id: number, orderNumber: string) => {
    const displayOrderNumber = orderNumber || `#${id}`;
    if (window.confirm(`Tem certeza que deseja excluir o pedido "${displayOrderNumber}"?`)) {
      try {
        await deletePurchaseOrder(id);
        toast.success('Pedido excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir pedido');
        console.error('Erro ao excluir pedido:', error);
      }
    }
  };

  // Função para atualizar o status do pedido
  const handleStatusChange = async (orderId: number, newStatus: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled') => {
    console.log('Função handleStatusChange chamada:', orderId, newStatus);
    try {
      console.log('Atualizando status do pedido:', orderId, newStatus);
      // Atualizar status no banco de dados
      await updatePurchaseOrder(orderId, { status: newStatus });
      console.log('Status do pedido atualizado com sucesso');
      
      // Se status for "received", criar registro em recebimentos e redirecionar
      if (newStatus === 'received') {
        console.log('Status é "received", criando recebimento automático');
        // Encontrar o pedido
        const order = purchaseOrders.find(o => o.id === orderId);
        console.log('Pedido encontrado:', order);
        if (order) {
          // Criar recebimento automaticamente
          const receiptData = {
            purchase_order_id: orderId,
            receipt_date: new Date().toISOString().split('T')[0],
            notes: `Recebimento automático do pedido #${order.order_number || orderId}`,
            total: order.total,
            status: 'pending' as 'pending',
            // Adicionar informações do pedido de compra para exibição
            purchase_order: {
              id: orderId,
              order_number: order.order_number || `#${orderId}`
            },
            items: order.items?.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total
            })) || []
          };
          
          console.log('Dados do recebimento a ser criado:', receiptData);
          
          // Adicionar o recebimento
          const result = await addGoodsReceipt(receiptData);
          console.log('Resultado da criação do recebimento:', result);
          
          // Mostrar mensagem e redirecionar
          toast.success('Pedido marcado como recebido! Recebimento criado automaticamente.');
          setTimeout(() => {
            navigate('/goods-receipts');
          }, 1500);
        } else {
          toast.error('Pedido não encontrado');
        }
      } else {
        toast.success('Status atualizado com sucesso!');
      }
      
      // Atualizar lista
      // refreshOrders(); // Esta função precisaria ser implementada
    } catch (error) {
      toast.error('Erro ao atualizar status do pedido');
      console.error('Erro ao atualizar status do pedido:', error);
    }
  };
  // Função para alternar status (mantida para compatibilidade)
  const toggleStatus = (id: number, currentStatus: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled' | undefined) => {
    console.log('Função toggleStatus chamada:', id, currentStatus);
    const statusOrder: ('draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled')[] = 
      ['draft', 'ordered', 'partially_received', 'received', 'cancelled'];
    const currentIndex = statusOrder.indexOf(currentStatus || 'draft');
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];
    console.log('Novo status calculado:', newStatus);
    handleStatusChange(id, newStatus);
  };

  // Função para converter pedido em venda
  const handleConvertToSale = async (orderId: number) => {
    // Implementação temporária - esta função precisa ser implementada no contexto
    toast.error('Função não implementada');
    console.warn('Função convertPurchaseOrderToSale não está disponível no contexto');
  };

  return (
    <div className="space-y-6">
      {(() => {
        console.log('Renderizando página de pedidos de compra');
        console.log('Todos os pedidos:', purchaseOrders);
        return null;
      })()}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pedidos de Compra
        </h1>
        <button
          onClick={() => navigate('/purchase-orders/create')}
          className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Pedido
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rascunho</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.draftOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pedidos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.orderedOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Recebidos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.receivedOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Cancelados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.cancelledOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número do pedido ou fornecedor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-700/30">
                  <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">#</th>
                  <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">Fornecedor</th>
                  <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">Data</th>
                  <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">Valor Total</th>
                  <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => navigate(`/purchase-orders/${order.id}/edit`)}
                  >
                    {(() => {
                      console.log('Renderizando pedido:', order);
                      console.log('Detalhes do pedido - ID:', order.id, 'Número:', order.order_number, 'Status:', order.status);
                      return null;
                    })()}
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      #{order.order_number || order.id}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {order.supplier?.name || 'N/A'}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {order.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                    </td>
                    <td className="py-3">
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                          order.status === 'draft' 
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : order.status === 'ordered' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : order.status === 'partially_received' 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : order.status === 'received' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/330 dark:text-red-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Clicou no status do pedido:', order.id, order.status);
                          // Permitir mudança de status clicando diretamente no badge
                          const statusOrder: ('draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled')[] = 
                            ['draft', 'ordered', 'partially_received', 'received', 'cancelled'];
                          const currentIndex = statusOrder.indexOf(order.status || 'draft');
                          const nextIndex = (currentIndex + 1) % statusOrder.length;
                          const newStatus = statusOrder[nextIndex];
                          console.log('Novo status:', newStatus);
                          if (order.id) {
                            handleStatusChange(order.id, newStatus);
                          }
                        }}
                      >
                        {order.status === 'draft' ? 'Rascunho' : 
                         order.status === 'ordered' ? 'Pedido' : 
                         order.status === 'partially_received' ? 'Parcialmente Recebido' : 
                         order.status === 'received' ? 'Recebido' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/purchase-orders/${order.id}/edit`);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
                              handleDeletePurchaseOrder(order.id!, order.order_number || '');
                            }
                          }}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Nenhum pedido corresponde à sua pesquisa.' : 'Não há pedidos cadastrados no momento.'}
            </p>
            <button
              onClick={() => navigate('/purchase-orders/create')}
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrders;
