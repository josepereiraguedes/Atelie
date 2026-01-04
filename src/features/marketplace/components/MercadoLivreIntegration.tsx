import React, { useState, useEffect } from 'react';
import { ShoppingCart, ExternalLink, Upload, Package, BarChart3, X, CheckCircle } from 'lucide-react';
import { Product } from '@/core/contexts/LocalDatabaseContext';
import { MercadoLivreAPI } from '../services/mercadoLivreAPI';
import toast from 'react-hot-toast';

interface MercadoLivreIntegrationProps {
  products: Product[];
  selectedProducts: number[];
  onClose: () => void;
}

export const MercadoLivreIntegration: React.FC<MercadoLivreIntegrationProps> = ({
  products,
  selectedProducts,
  onClose
}) => {
  const [api] = useState(new MercadoLivreAPI());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [publishProgress, setPublishProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const auth = api.isAuthenticated();
      setIsAuthenticated(auth);
      if (auth) {
        const info = await api.getAccountInfo();
        setAccountInfo(info);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    }
  };

  const handleConnect = () => {
    if (!import.meta.env.VITE_MERCADO_LIVRE_CLIENT_ID) {
      toast.error('Credenciais do Mercado Livre não configuradas. Contate o administrador.');
      return;
    }
    
    const authUrl = api['oauth'].getAuthUrl();
    window.open(authUrl, '_blank', 'width=600,height=700');
    
    // Verificar periodicamente se o login foi realizado
    const checkAuthInterval = setInterval(async () => {
      const auth = api.isAuthenticated();
      if (auth) {
        clearInterval(checkAuthInterval);
        setIsAuthenticated(true);
        const info = await api.getAccountInfo();
        setAccountInfo(info);
        toast.success('Conectado ao Mercado Livre com sucesso!');
      }
    }, 2000);

    // Limpar intervalo após 5 minutos
    setTimeout(() => clearInterval(checkAuthInterval), 300000);
  };

  const handlePublishSelected = async () => {
    if (!isAuthenticated) {
      toast.error('Conecte-se ao Mercado Livre primeiro');
      return;
    }

    const selectedProductsList = products.filter(p => selectedProducts.includes(p.id!));
    if (selectedProductsList.length === 0) {
      toast.error('Selecione produtos para publicar');
      return;
    }

    setLoading(true);
    setPublishProgress({ current: 0, total: selectedProductsList.length });

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedProductsList.length; i++) {
        try {
          await api.createItem(selectedProductsList[i]);
          successCount++;
          setPublishProgress({ current: i + 1, total: selectedProductsList.length });
        } catch (error: any) {
          errorCount++;
          console.error(`Erro ao publicar produto ${selectedProductsList[i].name}:`, error);
        }
      }

      toast.success(`Publicação concluída: ${successCount} sucesso, ${errorCount} falhas`);
    } catch (error: any) {
      toast.error(`Erro na publicação: ${error.message}`);
    } finally {
      setLoading(false);
      setPublishProgress(null);
      onClose();
    }
  };

  const handleSyncStock = async () => {
    if (!isAuthenticated) {
      toast.error('Conecte-se ao Mercado Livre primeiro');
      return;
    }

    const selectedProductsList = products.filter(p => selectedProducts.includes(p.id!));
    if (selectedProductsList.length === 0) {
      toast.error('Selecione produtos para sincronizar estoque');
      return;
    }

    setLoading(true);

    try {
      const result = await api.syncStock(selectedProductsList);
      toast.success(`Sincronização concluída: ${result.success} atualizados, ${result.failed} falhas`);
    } catch (error: any) {
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleDisconnect = () => {
    api.logout();
    setIsAuthenticated(false);
    setAccountInfo(null);
    toast.success('Desconectado do Mercado Livre');
  };

  const selectedCount = selectedProducts.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Integração Mercado Livre
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isAuthenticated 
                  ? `Conectado como ${accountInfo?.nickname || 'usuário'}`
                  : 'Conecte sua conta para publicar produtos'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status de autenticação */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isAuthenticated ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-600'}`}>
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {isAuthenticated ? 'Conectado' : 'Não conectado'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isAuthenticated 
                    ? 'Sua conta do Mercado Livre está conectada' 
                    : 'Conecte para publicar produtos diretamente'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Conectar Conta
                </button>
              )}
            </div>
          </div>

          {isAuthenticated && (
            <>
              {/* Informações da conta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <div className="text-blue-800 dark:text-blue-200 font-bold text-sm uppercase tracking-wider">ID da Conta</div>
                  <div className="text-blue-900 dark:text-blue-100 font-black mt-1">{accountInfo?.id || 'N/A'}</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                  <div className="text-green-800 dark:text-green-200 font-bold text-sm uppercase tracking-wider">Nível</div>
                  <div className="text-green-900 dark:text-green-100 font-black mt-1">{accountInfo?.user_type || 'N/A'}</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <div className="text-purple-800 dark:text-purple-200 font-bold text-sm uppercase tracking-wider">Status</div>
                  <div className="text-purple-900 dark:text-purple-100 font-black mt-1">{accountInfo?.status?.site_status || 'N/A'}</div>
                </div>
              </div>

              {/* Ações disponíveis */}
              <div>
                <h3 className="font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">
                  Ações Disponíveis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handlePublishSelected}
                    disabled={loading || selectedCount === 0}
                    className="p-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <Upload className="w-6 h-6" />
                    <div className="font-bold">Publicar Selecionados</div>
                    <div className="text-xs opacity-75">
                      {selectedCount > 0 ? `${selectedCount} produtos selecionados` : 'Nenhum produto selecionado'}
                    </div>
                  </button>
                  
                  <button
                    onClick={handleSyncStock}
                    disabled={loading || selectedCount === 0}
                    className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <Package className="w-6 h-6" />
                    <div className="font-bold">Sincronizar Estoque</div>
                    <div className="text-xs opacity-75">
                      Atualizar estoque no ML
                    </div>
                  </button>
                </div>
              </div>

              {/* Progresso de publicação */}
              {publishProgress && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-yellow-800 dark:text-yellow-200">
                      Publicando produtos...
                    </span>
                    <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {publishProgress.current} de {publishProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(publishProgress.current / publishProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Instruções */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Como funciona
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Conecte sua conta do Mercado Livre usando o botão acima</li>
              <li>• Selecione produtos na tela de inventário antes de usar esta funcionalidade</li>
              <li>• Publicação direta: Cria novos anúncios no seu catálogo do ML</li>
              <li>• Sincronização de estoque: Atualiza quantidades disponíveis no ML</li>
              <li>• <strong>Funcionalidade adicional</strong>: Exportação via CSV ainda disponível como opção</li>
            </ul>
            
            {(!import.meta.env.VITE_MERCADO_LIVRE_CLIENT_ID || !import.meta.env.VITE_MERCADO_LIVRE_CLIENT_SECRET) && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h5 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Configuração Necessária
                </h5>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  Para usar esta funcionalidade, você precisa configurar suas credenciais do Mercado Livre:
                </p>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal pl-4 space-y-1">
                  <li>Acesse: <a href="https://developers.mercadolivre.com.br/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-800">https://developers.mercadolivre.com.br/</a></li>
                  <li>Crie uma aplicação no Mercado Livre Developers</li>
                  <li>Copie o Client ID e Client Secret</li>
                  <li>Cole no arquivo <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env</code> do sistema</li>
                  <li>Para desenvolvimento local, use o ngrok para criar uma URL HTTPS:</li>
                  <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal pl-8 space-y-1">
                    <li>Instale o ngrok: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npm install -g ngrok</code></li>
                    <li>Inicie seu sistema: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npm run dev</code></li>
                    <li>Em outro terminal, execute: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">ngrok http 5210</code></li>
                    <li>Use a URL HTTPS fornecida pelo ngrok como redirecionamento</li>
                  </ol>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};