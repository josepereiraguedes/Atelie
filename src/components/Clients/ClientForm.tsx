import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalDatabase } from '../../contexts/LocalDatabaseContext';
import { Client } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import FormField from '../common/FormField';
import { TextInput } from '../common/FormField';
import FormActions from '../common/FormActions';
import { useAppNavigation } from '../../hooks/useNavigation';
import { useFormHandler } from '../../hooks/useFormHandler';
import ErrorBoundary from '../common/ErrorBoundary';
import { useUserActionHistory } from '../../hooks/useUserActionHistory';

interface ClientFormProps {
  client?: Client;
}

const ClientForm: React.FC<ClientFormProps> = ({ client }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const { clients, addClient, updateClient } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Cliente salvo com sucesso!',
    errorMessage: 'Erro ao salvar cliente'
  });
  const { recordAction } = useUserActionHistory();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      });
    } else if (id) {
      const existingClient = clients.find(c => c.id === parseInt(id));
      if (existingClient) {
        setFormData({
          name: existingClient.name,
          email: existingClient.email || '',
          phone: existingClient.phone || '',
          address: existingClient.address || ''
        });
      }
    }
  }, [client, id, clients]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para salvar um cliente');
      return;
    }

    try {
      await handleFormSubmit(async () => {
        if (client || id) {
          // Atualizar cliente existente
          const clientId = client?.id || parseInt(id || '0');
          const result = await updateClient(clientId, formData);
          recordAction('client', `Atualizou o cliente "${formData.name}"`, { 
            clientId, 
            clientName: formData.name 
          });
          return result;
        } else {
          // Criar novo cliente
          const result = await addClient(formData);
          recordAction('client', `Criou o cliente "${formData.name}"`, { 
            clientName: formData.name 
          });
          return result;
        }
      });
      goTo('/clients');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  }, [user, client, id, formData, handleFormSubmit, updateClient, addClient, goTo]);

  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto">
        <PageHeader 
          title={client || id ? 'Editar Cliente' : 'Novo Cliente'} 
          backPath="/clients"
        />
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <FormField label="Nome" required>
              <TextInput
                value={formData.name}
                onChange={(value: string) => setFormData({ ...formData, name: value })}
                placeholder="Nome completo do cliente"
                required
              />
            </FormField>
            
            <FormField label="E-mail">
              <TextInput
                type="email"
                value={formData.email}
                onChange={(value: string) => setFormData({ ...formData, email: value })}
                placeholder="email@exemplo.com"
              />
            </FormField>
            
            <FormField label="Telefone">
              <TextInput
                type="tel"
                value={formData.phone}
                onChange={(value: string) => setFormData({ ...formData, phone: value })}
                placeholder="(00) 00000-0000"
              />
            </FormField>
            
            <FormField label="Endereço">
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Endereço completo"
              />
            </FormField>
          </div>
          
          <FormActions
            cancelPath="/clients"
            submitText="Salvar Cliente"
            loading={loading}
          />
        </form>
      </div>
    </ErrorBoundary>
  );
};

export default ClientForm;