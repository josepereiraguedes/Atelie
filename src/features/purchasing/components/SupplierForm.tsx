import React, { useState, useEffect, memo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, X, Search, Plus, Package, ArrowLeft, AlertCircle } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/forms/PageHeader';
import FormActions from '@/shared/components/forms/FormActions';
import { useAppNavigation } from '@/shared/hooks/useNavigation';
import { useFormHandler } from '@/shared/hooks/useFormHandler';
import { useFormValidation, validationRules } from '@/shared/hooks/useFormValidation';

interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  payment_terms: string;
}

const SupplierForm: React.FC = () => {
  const { id } = useParams();
  const { suppliers, addSupplier, updateSupplier } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Fornecedor salvo com sucesso!',
    errorMessage: 'Erro ao salvar fornecedor'
  });
  const { errors, validateForm, clearErrors } = useFormValidation();
  
  console.log('Renderizando SupplierForm com id:', id);

  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    payment_terms: ''
  });

  // Se estiver editando, carregar os dados do fornecedor
  useEffect(() => {
    if (id) {
      loadSupplierData(id);
    }
  }, [id, suppliers]);

  const loadSupplierData = useCallback((id: string) => {
    const supplier = suppliers.find(s => s.id === parseInt(id));
    if (supplier) {
      setFormData({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contact_person: supplier.contact_person || '',
        payment_terms: supplier.payment_terms || ''
      });
    }
  }, [suppliers]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    clearErrors();
    
    // Definir regras de validação
    const validationRulesObj = {
      name: validationRules.fullName,
      email: validationRules.email,
      phone: validationRules.phone
    };
    
    // Validar formulário
    const isValid = validateForm(formData, validationRulesObj);
    
    if (!isValid) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    try {
      await handleFormSubmit(async () => {
        const supplierData = {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          contact_person: formData.contact_person || undefined,
          payment_terms: formData.payment_terms || undefined
        };
        
        if (id) {
          return await updateSupplier(parseInt(id), supplierData);
        } else {
          return await addSupplier(supplierData);
        }
      });
      goTo('/suppliers');
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  }, [formData, id, handleFormSubmit, updateSupplier, addSupplier, goTo, validateForm, clearErrors]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={id ? 'Editar Fornecedor' : 'Novo Fornecedor'} 
        backPath="/suppliers"
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Fornecedor *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Nome da empresa fornecedora"
              />
              {errors.name && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name[0]}
                </div>
              )}
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="email@fornecedor.com"
              />
              {errors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email[0]}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="(00) 00000-0000"
              />
              {errors.phone && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone[0]}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Endereço completo do fornecedor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pessoa de Contato
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nome da pessoa de contato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condições de Pagamento
              </label>
              <input
                type="text"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 30 dias, à vista, etc."
              />
            </div>










          </div>

          <FormActions
            cancelPath="/suppliers"
            submitText="Salvar"
            loading={loading}
          />
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;


