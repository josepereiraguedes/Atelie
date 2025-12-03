import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FileText, Clock, CheckCircle, DollarSign, User } from 'lucide-react';
import { useLocalDatabase, ClientQuote as ClientQuoteType, Product } from '../contexts/LocalDatabaseContext'; // Importar a interface ClientQuote do contexto
import toast from 'react-hot-toast';

const ClientQuotes: React.FC = () => {
  const { clientQuotes, clients, products, deleteClientQuote } = useLocalDatabase();
  
  // Criar um mapa de clientes para acesso rápido
  const clientMap = useMemo(() => {
    const map: Record<number, any> = {};
    clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular estatísticas
  const stats = useMemo(() => {
    return {
      totalQuotes: clientQuotes.length,
      draftQuotes: clientQuotes.filter(q => q.status === 'draft').length,
      sentQuotes: clientQuotes.filter(q => q.status === 'sent').length,
      approvedQuotes: clientQuotes.filter(q => q.status === 'approved').length,
      rejectedQuotes: clientQuotes.filter(q => q.status === 'rejected').length,
      expiredQuotes: clientQuotes.filter(q => q.status === 'expired').length,
      totalQuoteValue: clientQuotes.reduce((sum, quote) => sum + quote.total, 0),
      // Contar clientes únicos
      uniqueClients: new Set(clientQuotes.map(q => q.client_id)).size,
    };
  }, [clientQuotes]);

  const filteredClientQuotes = useMemo(() => {
    return clientQuotes.filter(quote => {
      const matchesQuoteNumber = quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const client = quote.client_id ? clientMap[quote.client_id] : null;
      const matchesClientName = client && client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClientEmail = client && client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClientPhone = client && client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesQuoteNumber || matchesClientName || matchesClientEmail || matchesClientPhone;
    });
  }, [clientQuotes, searchTerm, clientMap]);

  const handleDeleteClientQuote = async (id: number, quoteNumber: string) => {
    const displayQuoteNumber = quoteNumber || `#${id}`;
    if (window.confirm(`Tem certeza que deseja excluir o orçamento "${displayQuoteNumber}"?`)) {
      try {
        await deleteClientQuote(id);
        toast.success('Orçamento excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir orçamento');
        console.error('Erro ao excluir orçamento:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orçamentos de Clientes
        </h1>
        <Link
          to="/client-quotes/new"
          className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Orçamento
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalQuotes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Clock className="w-5 h-5 text-gray-800 dark:text-gray-300" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Rascunho</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.draftQuotes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Enviados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.sentQuotes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Aprovados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.approvedQuotes}</p>
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
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.rejectedQuotes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                R$ {stats.totalQuoteValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Clientes</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.uniqueClients}
              </p>
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
            placeholder="Buscar orçamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filteredClientQuotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Produto</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Cliente</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Quantidade</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Total</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Data</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-3">
                      <div className="flex flex-col">
                        {quote.items && quote.items.length > 0 && (
                          <>
                            {quote.items.slice(0, 2).map((item, index) => {
                              const product = products.find((p: Product) => p.id === item.product_id);
                              return (
                                <div key={index} className="flex items-center mb-1 last:mb-0">
                                  {product?.image ? (
                                    <img 
                                      src={product.image} 
                                      alt={product.name} 
                                      className="w-6 h-6 object-cover rounded-md mr-2" 
                                    /> 
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-md mr-2" />
                                  )}
                                  <span className="text-gray-900 dark:text-white text-xs truncate max-w-[100px]">
                                    {product?.name || 'N/A'} ({item.quantity})
                                  </span>
                                </div>
                              );
                            })}
                            {quote.items.length > 2 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                                +{quote.items.length - 2} itens
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      <div className="font-medium">{(quote.client_id && clientMap[quote.client_id]?.name) || 'N/A'}</div>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {quote.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Orçamento
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        quote.status === 'draft' 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : quote.status === 'sent' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : quote.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : quote.status === 'rejected' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {quote.status === 'draft' ? 'Rascunho' : 
                         quote.status === 'sent' ? 'Enviado' : 
                         quote.status === 'approved' ? 'Aprovado' : 
                         quote.status === 'rejected' ? 'Rejeitado' : 'Expirado'}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      R$ {quote.total.toFixed(2)}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(quote.quote_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-1">
                        <Link 
                          to={`/client-quotes/details/${quote.id}`} 
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          title="Visualizar"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/client-quotes/edit/${quote.id}`} 
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClientQuote(quote.id!, quote.quote_number || '')} 
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
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Nenhum orçamento encontrado
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {clientQuotes.length === 0 
                ? 'Crie seu primeiro orçamento'
                : 'Ajuste os filtros de busca'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientQuotes;