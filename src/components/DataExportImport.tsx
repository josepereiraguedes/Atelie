import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalDatabase } from '../contexts/LocalDatabaseContext';
import { dataExportImportService, BackupData } from '../services/dataExportImport';
import toast from 'react-hot-toast';
import { Download, Info } from 'lucide-react';

const DataExportImport: React.FC = memo(() => {
  const { user } = useAuth();
  const { products, clients, transactions } = useLocalDatabase();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar backups ao montar o componente
  useEffect(() => {
    const loadedBackups = dataExportImportService.getBackups();
    setBackups(loadedBackups);
  }, []);

  /**
   * Função para exportar dados
   */
  const handleExport = useCallback(async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const userName = user?.name || user?.email || 'Usuário';
      const blob = await dataExportImportService.exportData(user.id, userName);
      
      // Criar link para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gestao-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  }, [user]);

  /**
   * Função para importar dados
   */
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    setIsImporting(true);
    try {
      const file = event.target.files[0];
      
      // Verificar se é um arquivo JSON
      if (file.type !== 'application/json') {
        toast.error('Selecione um arquivo JSON válido');
        return;
      }
      
      await dataExportImportService.importData(file, user.id);
      
      toast.success('Dados importados com sucesso!');
      
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Atualizar lista de backups
      const updatedBackups = dataExportImportService.getBackups();
      setBackups(updatedBackups);
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      toast.error('Erro ao importar dados');
    } finally {
      setIsImporting(false);
    }
  }, [user]);

  /**
   * Função para restaurar um backup
   */
  const handleRestoreBackup = useCallback(async () => {
    if (!user || !selectedBackup) return;
    
    try {
      const backup = backups.find(b => b.metadata.backupDate === selectedBackup);
      if (!backup) {
        toast.error('Backup não encontrado');
        return;
      }
      
      await dataExportImportService.restoreBackup(backup, user.id);
      
      toast.success('Backup restaurado com sucesso!');
      
      // Atualizar lista de backups
      const updatedBackups = dataExportImportService.getBackups();
      setBackups(updatedBackups);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup');
    }
  }, [user, selectedBackup, backups]);

  /**
   * Função para remover um backup
   */
  const handleRemoveBackup = useCallback(() => {
    if (!selectedBackup) return;
    
    try {
      dataExportImportService.removeBackup(selectedBackup);
      
      // Atualizar lista de backups
      const updatedBackups = backups.filter(b => b.metadata.backupDate !== selectedBackup);
      setBackups(updatedBackups);
      setSelectedBackup('');
      
      toast.success('Backup removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover backup:', error);
      toast.error('Erro ao remover backup');
    }
  }, [selectedBackup, backups]);

  /**
   * Função para formatar data
   */
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Seção de Exportação */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              Exportar
            </h4>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {products.length + clients.length + transactions.length}
            </div>
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 px-3 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
          >
            {isExporting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                Exportando...
              </div>
            ) : (
              'Exportar'
            )}
          </button>
        </div>
        
        {/* Seção de Importação */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
            Importar
          </h4>
          
          <div className="mb-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`w-full flex flex-col items-center justify-center border border-dashed rounded-md p-2 cursor-pointer transition duration-150 ease-in-out ${
                isImporting 
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400'
              }`}
            >
              {isImporting ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mb-1"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Importando...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Download className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Selecionar arquivo
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Seção de Backups */}
      {backups.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
            Backups ({backups.length})
          </h4>
          
          <div className="space-y-2">
            <select
              value={selectedBackup}
              onChange={(e) => setSelectedBackup(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Selecione backup</option>
              {backups.map((backup) => (
                <option 
                  key={backup.metadata.backupDate} 
                  value={backup.metadata.backupDate}
                >
                  {formatDate(backup.metadata.backupDate)}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={handleRestoreBackup}
                disabled={!selectedBackup}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restaurar
              </button>
              
              <button
                onClick={handleRemoveBackup}
                disabled={!selectedBackup}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-3 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Informações de uso */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="mb-1"><strong>Como compartilhar:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Exporte os dados</li>
              <li>Transfira o arquivo</li>
              <li>Importe no outro dispositivo</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DataExportImport;