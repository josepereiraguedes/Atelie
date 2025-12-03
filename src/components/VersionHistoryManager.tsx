import React, { useState, useEffect, useCallback } from 'react';
import { versionHistoryService, DataVersion } from '../services/versionHistory';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, History, Trash2, RotateCcw, Info } from 'lucide-react';

const VersionHistoryManager: React.FC = () => {
  const { user } = useAuth();
  const localDatabase = useLocalDatabase(); // Usar o objeto completo em vez de desestruturar
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Carregar versões ao montar o componente
  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = useCallback(() => {
    try {
      const loadedVersions = versionHistoryService.getVersions();
      setVersions(loadedVersions);
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
      toast.error('Erro ao carregar histórico de versões');
    }
  }, []);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!versionName.trim()) {
      toast.error('Por favor, informe um nome para a versão');
      return;
    }
    
    setIsCreating(true);
    try {
      const userId = user?.id || 'default';
      versionHistoryService.createVersion(versionName, versionDescription, userId);
      
      toast.success('Versão criada com sucesso!');
      setVersionName('');
      setVersionDescription('');
      setShowCreateForm(false);
      loadVersions();
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      toast.error('Erro ao criar versão');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm('Tem certeza que deseja restaurar esta versão? Uma cópia dos dados atuais será criada como backup.')) {
      return;
    }
    
    setIsRestoring(true);
    try {
      const userId = user?.id || 'default';
      versionHistoryService.restoreVersion(versionId, userId);
      
      toast.success('Versão restaurada com sucesso! A página será recarregada.');
      
      // Recarregar a página após um curto delay para mostrar a mensagem
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
      toast.error('Erro ao restaurar versão');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRemoveVersion = (versionId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta versão? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      versionHistoryService.removeVersion(versionId);
      toast.success('Versão removida com sucesso!');
      loadVersions();
      
      // Limpar seleção se a versão removida estava selecionada
      if (selectedVersion === versionId) {
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error('Erro ao remover versão:', error);
      toast.error('Erro ao remover versão');
    }
  };

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  }, []);

  const formatDataSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);

  const getStatistics = useCallback(() => {
    return versionHistoryService.getStatistics();
  }, []);

  const statistics = getStatistics();

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Histórico de Versões
          </h3>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova Versão
        </button>
      </div>
      
      {/* Formulário de criação de versão */}
      {showCreateForm && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
            Criar Nova Versão
          </h4>
          
          <form onSubmit={handleCreateVersion} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Nome da Versão *
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Ex: Backup antes de ajustes de estoque"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Descreva o que esta versão contém..."
                rows={2}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Criando...
                  </div>
                ) : (
                  'Criar Versão'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white text-xs font-medium py-1.5 px-3 rounded-md transition duration-150 ease-in-out"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Estatísticas */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
        <div className="flex items-center">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p>
              <strong>Total de versões:</strong> {statistics.totalVersions} | 
              <strong> Tamanho total:</strong> {formatDataSize(statistics.totalDataSize)}
            </p>
            {statistics.oldestVersion && (
              <p>
                <strong>Mais antiga:</strong> {formatDate(statistics.oldestVersion)}
              </p>
            )}
            {statistics.newestVersion && (
              <p>
                <strong>Mais recente:</strong> {formatDate(statistics.newestVersion)}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de versões */}
      {versions.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhuma versão criada ainda
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Crie sua primeira versão para começar a acompanhar o histórico
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div 
              key={version.id}
              className={`border rounded-lg p-3 transition-colors ${
                selectedVersion === version.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {version.versionName}
                    </h4>
                    {selectedVersion === version.id && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                        Selecionada
                      </span>
                    )}
                  </div>
                  
                  {version.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      {version.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>
                      {formatDate(version.timestamp)}
                    </span>
                    <span className="mx-2">•</span>
                    <span>
                      {version.data.products.length} produtos, 
                      {version.data.clients.length} clientes
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleRestoreVersion(version.id)}
                    disabled={isRestoring}
                    className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors disabled:opacity-50"
                    title="Restaurar versão"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleRemoveVersion(version.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    title="Remover versão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VersionHistoryManager;