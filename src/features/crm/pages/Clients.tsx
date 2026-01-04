import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { handleError } from '@/shared/utils/errorHandler';
import toast from 'react-hot-toast';
import { useUserActionHistory } from '@/shared/hooks/useUserActionHistory';

const Clients: React.FC = () => {
  const { clients, deleteClient } = useLocalDatabase();
  const { recordAction } = useUserActionHistory();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  const handleDeleteClient = async (id: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) {
      try {
        await deleteClient(id);
        toast.success('Cliente excluído!');
        recordAction('client', `Cliente excluído: ${name}`, {
          clientId: id,
          clientName: name
        });
      } catch (error) {
        handleError(error, 'clientsPage');
        toast.error('Erro ao excluir cliente');
      }
    }
  };

  const handleWhatsAppClick = (phone: string, name: string) => {
    // Remover caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar se o telefone tem o formato correto (com código do país)
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      // Adicionar código do Brasil se não tiver
      formattedPhone = `55${cleanPhone}`;
    }

    // Abrir WhatsApp Web
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=Olá ${encodeURIComponent(name)}, `;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Clientes
        </h1>
        <Link
          to="/clients/new"
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar clientes por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Lista de Clientes em Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${client.status === 'lead' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center`}>
                            <Users className={`h-5 w-5 ${client.status === 'lead' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                            {client.name}
                            {client.status === 'lead' && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Lead</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">
                            ID: {client.id} • {client.source === 'whatsapp_import' ? 'WHATSAPP' : 'SISTEMA'}
                            {client.loyalty_points !== undefined && client.loyalty_points > 0 && (
                              <span className="ml-2 text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">★ {client.loyalty_points} PTS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {client.email || '-'}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                        {client.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {client.address || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {client.phone && (
                          <button
                            onClick={() => handleWhatsAppClick(client.phone!, client.name)}
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          to={`/clients/edit/${client.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClient(client.id!, client.name)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Nenhum cliente encontrado
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {clients.length === 0
                        ? 'Adicione seu primeiro cliente'
                        : 'Ajuste o filtro de busca'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
