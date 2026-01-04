import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import { useAuth } from '@/core/contexts/AuthContext';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { dataExportImportService, BackupData } from '@/features/settings/services/dataExportImport';
import { autoBackupService, AutoBackupConfig } from '@/services/autoBackup';
import VersionHistoryManager from './VersionHistoryManager';
import toast from 'react-hot-toast';
import { Download, Info, Settings, Clock } from 'lucide-react';

const DataExportImport: React.FC = memo(() => {
  const { user } = useAuth();
  const { products, clients, transactions, categories, suppliers } = useLocalDatabase();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [showBackupSettings, setShowBackupSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [backupConfig, setBackupConfig] = useState<AutoBackupConfig>({
    enabled: true,
    interval: 'daily',
    lastBackup: null,
    retention: 7
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar backups ao montar o componente
  useEffect(() => {
    const loadedBackups = dataExportImportService.getBackups();
    setBackups(loadedBackups);
    
    // Carregar configurações de backup automático
    const config = autoBackupService.getConfig();
    setBackupConfig(config);
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

  // Adicionar estas funções para gerenciar configurações de backup
  const handleBackupConfigChange = (config: Partial<AutoBackupConfig>) => {
    const newConfig = { ...backupConfig, ...config };
    setBackupConfig(newConfig);
    
    // Atualizar no serviço
    if (config.enabled !== undefined) {
      autoBackupService.setEnabled(config.enabled);
    }
    if (config.interval) {
      autoBackupService.setInterval(config.interval);
    }
    if (config.retention !== undefined) {
      autoBackupService.setRetention(config.retention);
    }
  };

  const handleManualBackup = async () => {
    if (!user) return;
    
    try {
      await autoBackupService.performBackup();
      toast.success('Backup manual criado com sucesso!');
      
      // Atualizar lista de backups
      const updatedBackups = dataExportImportService.getBackups();
      setBackups(updatedBackups);
    } catch (error) {
      console.error('Erro ao criar backup manual:', error);
      toast.error('Erro ao criar backup manual');
    }
  };

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
              {products.length + clients.length + transactions.length + categories.length + suppliers.length}
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
      
      {/* Seção de Backup Automático */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            Backup Automático
          </h4>
          <button 
            onClick={() => setShowBackupSettings(!showBackupSettings)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleManualBackup}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-md transition duration-150 ease-in-out"
          >
            Backup Manual
          </button>
        </div>
        
        {showBackupSettings && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">Ativado</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupConfig.enabled}
                    onChange={(e) => handleBackupConfigChange({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                  Intervalo
                </label>
                <select
                  value={backupConfig.interval}
                  onChange={(e) => handleBackupConfigChange({ interval: e.target.value as any })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={!backupConfig.enabled}
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                  Retenção (número de backups)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={backupConfig.retention === 0 ? '' : backupConfig.retention.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Armazenar temporariamente como string durante a digitação
                    handleBackupConfigChange({ retention: value as any });
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleBackupConfigChange({ retention: 7 });
                    } else {
                      const numericValue = parseInt(value) || 7;
                      handleBackupConfigChange({ retention: numericValue });
                    }
                  }}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={!backupConfig.enabled}
                />
              </div>
              
              {backupConfig.lastBackup && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Último backup: {formatDate(backupConfig.lastBackup)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Seção de Histórico de Versões */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            Histórico de Versões
          </h4>
          <button 
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={() => setShowVersionHistory(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-1.5 px-3 rounded-md transition duration-150 ease-in-out"
        >
          Gerenciar Versões
        </button>
        
        {showVersionHistory && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <VersionHistoryManager />
          </div>
        )}
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


