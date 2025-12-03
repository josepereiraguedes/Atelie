import React, { useMemo } from 'react';
import { ArrowLeft, Printer, FileText, User, Calendar, DollarSign, Package, Check, Edit3, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocalDatabase, Client, ClientQuote, Product, ClientQuoteItem, Transaction } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';

const ClientQuoteDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { clientQuotes, clients, products, addTransaction, updateClientQuote, deleteClientQuote } = useLocalDatabase();
  
  const clientMap = useMemo(() => {
    const map: Record<number, Client> = {};
    clients.forEach(client => {
      map[client.id] = client;
    });
    
    return map;
  }, [clients]);
  
  const quote = clientQuotes.find((q: ClientQuote) => q.id === parseInt(id || '0'));
  const client = quote?.client_id ? clientMap[quote.client_id] : null;
  
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Orçamento não encontrado
          </h3>
          <button
            onClick={() => navigate('/client-quotes')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Voltar para a lista de orçamentos
          </button>
        </div>
      </div>
    );
  }

  const quoteItems = quote.items || [];
  const quoteItemsWithProducts = quoteItems.map((item: ClientQuoteItem) => {
    const product = products.find((p: Product) => p.id === item.product_id);
    return {
      ...item,
      product
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Rascunho
          </span>
        );
      case 'sent':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Enviado
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Rejeitado
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            Expirado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApproveQuote = async () => {
    if (window.confirm('Tem certeza que deseja aprovar este orçamento? Ele será convertido em uma transação de venda e removido da lista de orçamentos.')) {
      try {
        // Obter informações do cliente
        const clientInfo = clients.find(c => c.id === quote.client_id);
        
        const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
          type: 'sale' as const,
          client_id: quote.client_id,
          payment_status: 'pending' as const,
          description: `Venda gerada a partir do orçamento #${quote.id}`,
          items: quote.items?.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total
          })) || [],
          total: quote.total,
          // Adicionar informações do cliente para exibição
          client: clientInfo ? { name: clientInfo.name } : undefined
        };
        
        await addTransaction(transactionData);
        await deleteClientQuote(quote.id!);
        
        toast.success('Orçamento aprovado, convertido em transação e removido dos orçamentos!');
        navigate('/financial');
      } catch (error) {
        console.error('Erro ao aprovar orçamento:', error);
        toast.error('Erro ao aprovar orçamento');
      }
    }
  };

  const handleConvertToTransaction = async () => {
    if (window.confirm('Tem certeza que deseja converter este orçamento em uma transação de venda?')) {
      try {
        // Obter informações do cliente
        const clientInfo = clients.find(c => c.id === quote.client_id);
        console.log('Client info found:', clientInfo);
        
        const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
          type: 'sale' as const,
          client_id: quote.client_id,
          payment_status: 'pending' as const,
          description: `Venda gerada a partir do orçamento #${quote.id}`,
          items: quote.items?.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total
          })) || [],
          total: quote.total,
          // Adicionar informações do cliente para exibição
          // Garantir que o objeto client tenha a estrutura correta
          client: clientInfo ? { name: clientInfo.name } : undefined
        };
        
        console.log('Transaction data being sent:', transactionData);
        console.log('Client info in transaction data:', transactionData.client);
        
        // Verificar se as informações do cliente estão corretas antes de enviar
        if (transactionData.client_id && !transactionData.client) {
          console.warn('Transaction data is missing client info despite having client_id');
        }
        
        const result = await addTransaction(transactionData);
        console.log('Transaction added result:', result);
        
        // Verificar se a transação foi criada com as informações do cliente
        if (result.client_id && !result.client) {
          console.warn('Created transaction is missing client info despite having client_id');
        }
        
        await deleteClientQuote(quote.id!);
        
        toast.success('Orçamento convertido em transação e removido dos orçamentos!');
        navigate('/financial');
      } catch (error) {
        console.error('Erro ao converter orçamento:', error);
        toast.error('Erro ao converter orçamento');
      }
    }
  };

  const handleDeleteQuote = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o orçamento "${quote.quote_number || `#${quote.id}`}"?`)) {
      try {
        await deleteClientQuote(quote.id!);
        toast.success('Orçamento excluído com sucesso!');
        navigate('/client-quotes');
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error);
        toast.error('Erro ao excluir orçamento');
      }
    }
  };

  const handleEditQuote = () => {
    navigate(`/client-quotes/edit/${quote.id}`);
  };

  const canConvertToTransaction = quote.status !== 'approved' && quote.status !== 'rejected';

  const handleStatusChange = async (newStatus: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired') => {
    try {
      await updateClientQuote(quote.id!, { status: newStatus });
      toast.success('Status do orçamento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do orçamento');
    }
  };

  const getStatusOptions = () => {
    return [
      { value: 'draft', label: 'Rascunho' },
      { value: 'sent', label: 'Enviado' },
      { value: 'approved', label: 'Aprovado' },
      { value: 'rejected', label: 'Rejeitado' },
      { value: 'expired', label: 'Expirado' },
    ];
  };

  const renderStatusDropdown = () => {
    return (
      <div className="relative inline-block">
        <select
          value={quote.status}
          onChange={(e) => handleStatusChange(e.target.value as 'draft' | 'sent' | 'approved' | 'rejected' | 'expired')}
          className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getStatusOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const canApproveQuote = quote.status !== 'approved' && quote.status !== 'rejected';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/client-quotes')}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalhes do Orçamento
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir
          </button>
          {canApproveQuote && (
            <button
              onClick={handleConvertToTransaction}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Converter em Venda
            </button>
          )}
          <button
            onClick={handleEditQuote}
            className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-1.5" />
            Editar
          </button>
          <button
            onClick={handleDeleteQuote}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Excluir
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {quote.quote_number || `Orçamento #${quote.id}`}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Criado em {new Date(quote.created_at || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              {renderStatusDropdown()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informações do Cliente
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                  <p className="font-medium text-gray-900 dark:text-white">{client?.name || 'N/A'}</p>
                </div>
                {client?.email && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.email}</p>
                  </div>
                )}
                {client?.phone && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.phone}</p>
                  </div>
                )}
                {client?.address && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Datas
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Data do Orçamento</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(quote.quote_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {quote.validity_date && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data de Validade</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(quote.validity_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Itens do Orçamento
          </h3>
          
          {quoteItemsWithProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum item encontrado neste orçamento.
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Preço Unitário
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {quoteItemsWithProducts.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.product?.name || 'Produto não encontrado'}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        R$ {item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        R$ {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              {quote.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Observações
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {quote.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 min-w-[200px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  R$ {quoteItemsWithProducts.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  R$ {quote.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientQuoteDetails;