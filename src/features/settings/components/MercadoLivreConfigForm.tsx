import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface MercadoLivreConfig {
  clientId: string;
  clientSecret: string;
}

interface MercadoLivreConfigFormProps {
  onSave: (config: MercadoLivreConfig) => void;
  currentConfig?: MercadoLivreConfig;
}

export const MercadoLivreConfigForm: React.FC<MercadoLivreConfigFormProps> = ({
  onSave,
  currentConfig
}) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    if (currentConfig) {
      setClientId(currentConfig.clientId || '');
      setClientSecret(currentConfig.clientSecret || '');
    }
  }, [currentConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error('Por favor, preencha ambos os campos: Client ID e Client Secret');
      return;
    }
    
    onSave({ clientId, clientSecret });
    toast.success('Configurações do Mercado Livre salvas com sucesso!');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações do Mercado Livre</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Insira o Client ID do Mercado Livre"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Insira o Client Secret do Mercado Livre"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Salvar Configurações
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">Como obter as credenciais:</p>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Acesse o painel de desenvolvedor do Mercado Livre</li>
          <li>Crie uma nova aplicação</li>
          <li>Copie o Client ID e Client Secret fornecidos</li>
          <li>Configure a URL de redirecionamento como: {window.location.origin}/mercado-livre/callback</li>
          <li>Importante: A URL de redirecionamento deve usar HTTPS, mesmo em ambiente local</li>
        </ol>
      </div>
    </div>
  );
};