import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Box, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';

const GoodsReceipts: React.FC = () => {
  const { goodsReceipts, purchaseOrders, deleteGoodsReceipt } = useLocalDatabase();
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular estatísticas
  const stats = useMemo(() => {
    return {
      totalReceipts: goodsReceipts.length,
      pendingReceipts: goodsReceipts.filter(r => r.status === 'pending').length,
      receivedReceipts: goodsReceipts.filter(r => r.status === 'received').length,
      partiallyReceivedReceipts: goodsReceipts.filter(r => r.status === 'partially_received').length,
      rejectedReceipts: goodsReceipts.filter(r => r.status === 'rejected').length,
    };
  }, [goodsReceipts]);

  const filteredGoodsReceipts = useMemo(() => {
    return goodsReceipts.filter(receipt => 
      receipt.purchase_order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.purchase_order?.supplier && receipt.purchase_order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [goodsReceipts, searchTerm]);

  const handleDeleteGoodsReceipt = async (id: number, receiptNumber: string) => {
    const displayReceiptNumber = receiptNumber || `#${id}`;
    if (window.confirm(`Tem certeza que deseja excluir o controle de recebimento "${displayReceiptNumber}"?`)) {
      try {
        await deleteGoodsReceipt(id);
        toast.success('Controle de recebimento excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir controle de recebimento');
        console.error('Erro ao excluir controle de recebimento:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recebimentos
        </h1>
        <Link
          to="/goods-receipts/new"
          className="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Recebimento
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalReceipts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.pendingReceipts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Recebidos</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.receivedReceipts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Box className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Parcial</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.partiallyReceivedReceipts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Rejeitados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.rejectedReceipts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar recebimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Lista de Recebimentos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filteredGoodsReceipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Recebimento</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Pedido</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Fornecedor</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Data</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredGoodsReceipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      #{receipt.id}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {receipt.purchase_order?.order_number || 'N/A'}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {receipt.purchase_order?.supplier?.name || 'N/A'}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(receipt.receipt_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        receipt.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : receipt.status === 'received' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : receipt.status === 'partially_received' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {receipt.status === 'pending' ? 'Pendente' : 
                         receipt.status === 'received' ? 'Recebido' : 
                         receipt.status === 'partially_received' ? 'Parcialmente Recebido' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-1">
                        <Link 
                          to={`/goods-receipts/edit/${receipt.id}`} 
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteGoodsReceipt(receipt.id!, receipt.id?.toString() || '')} 
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
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
            <Box className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Nenhum controle de recebimento encontrado
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {goodsReceipts.length === 0 
                ? 'Registre seu primeiro recebimento de mercadorias'
                : 'Ajuste os filtros de busca'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoodsReceipts;