
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  Box,
  FileText
} from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';

const GoodsReceipts: React.FC = () => {
  const { goodsReceipts, deleteGoodsReceipt, updateGoodsReceipt, products, updateProduct } = useLocalDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending');
  const navigate = useNavigate();

  const stats = useMemo(() => {
    return {
      totalReceipts: goodsReceipts.length,
      pendingReceipts: goodsReceipts.filter(r => (r.status || 'pending') === 'pending').length,
      receivedReceipts: goodsReceipts.filter(r => r.status === 'received').length,
      partiallyReceivedReceipts: goodsReceipts.filter(r => r.status === 'partially_received').length,
      rejectedReceipts: goodsReceipts.filter(r => r.status === 'rejected').length,
    };
  }, [goodsReceipts]);

  const filteredGoodsReceipts = useMemo(() => {
    // Primeiro filtro: Status (se estiver na aba Pendentes)
    let baseList = goodsReceipts;

    if (viewMode === 'pending') {
      baseList = goodsReceipts.filter(r => {
        if ((r.status || 'pending') === 'pending') return true;
        if (r.status === 'received' && r.notes?.includes('Recebimento automático')) return true; // Exceção para automáticos recentes
        return false;
      });
    }

    // Segundo filtro: Busca
    if (!searchTerm) return baseList;

    return baseList.filter(receipt =>
      receipt.purchase_order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.purchase_order?.supplier && receipt.purchase_order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (receipt.id && receipt.id.toString().includes(searchTerm))
    );
  }, [goodsReceipts, searchTerm, viewMode]);

  const handleDeleteGoodsReceipt = async (id: number, receiptNumber: string) => {
    const displayReceiptNumber = receiptNumber || `#${id}`;
    if (window.confirm(`Tem certeza que deseja excluir o controle de recebimento "${displayReceiptNumber}"?`)) {
      try {
        await deleteGoodsReceipt(id);
        toast.success('Controle de recebimento excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir controle de recebimento');
      }
    }
  };

  const handleConfirmReceipt = async (receiptId: number) => {
    try {
      const receipt = goodsReceipts.find(r => r.id === receiptId);
      if (!receipt) {
        toast.error('Recebimento não encontrado');
        return;
      }

      if (receipt.status === 'received') {
        toast.error('Este recebimento já foi confirmado');
        return;
      }

      if (receipt.items && receipt.items.length > 0) {
        for (const item of receipt.items) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const newQuantity = product.quantity + item.quantity;
            await updateProduct(item.product_id, { quantity: newQuantity });
          }
        }
      }

      await updateGoodsReceipt(receiptId, { status: 'received' });
      toast.success('Recebimento confirmado e estoque atualizado!');
    } catch (error) {
      toast.error('Erro ao confirmar recebimento');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Recebido';
      case 'pending': return 'Pendente';
      case 'partially_received': return 'Parcial';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'partially_received': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recebimento de Mercadorias
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie a entrada de produtos e conferência de pedidos
          </p>
        </div>
        <Link
          to="/goods-receipts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Recebimento
        </Link>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-4">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReceipts}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mr-4">
            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingReceipts}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mr-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Recebidos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.receivedReceipts}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg mr-4">
            <Box className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Parciais</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.partiallyReceivedReceipts}</p>
          </div>
        </div>
      </div>

      {/* Navegação de Abas e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full md:w-auto">
            <button
              onClick={() => setViewMode('pending')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'pending' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
              </div>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'all' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Histórico Completo
              </div>
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar pedido, fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        {filteredGoodsReceipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Pedido</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Fornecedor</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Data</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredGoodsReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      #{receipt.id}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {receipt.purchase_order?.order_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {receipt.purchase_order?.supplier?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(receipt.receipt_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {receipt.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(receipt.status || 'pending')}`}>
                        {getStatusLabel(receipt.status || 'pending')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/goods-receipts/${receipt.id}`)} // Assumindo rota de view
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {receipt.status !== 'received' && (
                          <button
                            onClick={() => handleConfirmReceipt(receipt.id!)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Confirmar Recebimento"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGoodsReceipt(receipt.id!, receipt.id?.toString() || '')}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum recebimento encontrado</p>
            <p className="text-sm text-gray-400">Tente ajustar os filtros ou crie um novo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoodsReceipts;
