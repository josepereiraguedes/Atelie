import { dataExportImportService } from './dataExportImport';
// Remover a importação de useAuth pois não é necessário neste contexto

// Interface para configurações de backup automático
export interface AutoBackupConfig {
  enabled: boolean;
  interval: 'daily' | 'weekly' | 'monthly';
  lastBackup: string | null;
  retention: number; // Número de backups para manter
}

/**
 * Serviço para gerenciamento de backup automático
 */
class AutoBackupService {
  private static instance: AutoBackupService;
  private config: AutoBackupConfig;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    // Carregar configurações do localStorage
    this.config = this.loadConfig();
  }

  /**
   * Obtém a instância singleton do serviço
   * @returns Instância do AutoBackupService
   */
  static getInstance(): AutoBackupService {
    if (!AutoBackupService.instance) {
      AutoBackupService.instance = new AutoBackupService();
    }
    return AutoBackupService.instance;
  }

  /**
   * Carrega as configurações do backup automático do localStorage
   * @returns Configurações de backup automático
   */
  private loadConfig(): AutoBackupConfig {
    try {
      const configStr = localStorage.getItem('autoBackupConfig');
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações de backup automático:', error);
    }

    // Configurações padrão
    return {
      enabled: true,
      interval: 'daily',
      lastBackup: null,
      retention: 7
    };
  }

  /**
   * Salva as configurações do backup automático no localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('autoBackupConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Erro ao salvar configurações de backup automático:', error);
    }
  }

  /**
   * Define se o backup automático está habilitado
   * @param enabled Status do backup automático
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
    
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Define o intervalo de backup automático
   * @param interval Intervalo de backup
   */
  setInterval(interval: 'daily' | 'weekly' | 'monthly'): void {
    this.config.interval = interval;
    this.saveConfig();
    
    // Reiniciar o scheduler se estiver habilitado
    if (this.config.enabled) {
      this.stop();
      this.start();
    }
  }

  /**
   * Define o número de backups para manter
   * @param retention Número de backups para manter
   */
  setRetention(retention: number): void {
    this.config.retention = retention;
    this.saveConfig();
  }

  /**
   * Obtém as configurações atuais
   * @returns Configurações de backup automático
   */
  getConfig(): AutoBackupConfig {
    return { ...this.config };
  }

  /**
   * Inicia o backup automático
   */
  start(): void {
    // Parar qualquer scheduler existente
    this.stop();
    
    if (!this.config.enabled) {
      console.log('⚠️  Backup automático desativado');
      return;
    }
    
    // Calcular o próximo horário de backup
    const intervalMs = this.getIntervalMs();
    this.intervalId = setInterval(() => {
      this.performBackup();
    }, intervalMs);
    
    console.log(`✅ Backup automático iniciado com intervalo de ${this.config.interval}`);
  }

  /**
   * Para o backup automático
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️  Backup automático parado');
    }
  }

  /**
   * Converte o intervalo para milissegundos
   * @returns Intervalo em milissegundos
   */
  private getIntervalMs(): number {
    switch (this.config.interval) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 horas
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 dias
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 dias
      default:
        return 24 * 60 * 60 * 1000; // Padrão: 24 horas
    }
  }

  /**
   * Executa um backup automático
   */
  async performBackup(): Promise<void> {
    try {
      console.log('🔄 Iniciando backup automático...');
      
      // Verificar se o usuário está logado
      // Nota: Esta parte precisa ser adaptada para funcionar com o contexto do React
      // Vamos assumir que o usuário está logado e tem ID 'default'
      const userId = 'default';
      const userName = 'Usuário Padrão';
      
      // Criar backup
      await dataExportImportService.createBackup(userId);
      
      // Atualizar data do último backup
      this.config.lastBackup = new Date().toISOString();
      this.saveConfig();
      
      // Limpar backups antigos
      this.cleanupOldBackups();
      
      console.log('✅ Backup automático concluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao realizar backup automático:', error);
    }
  }

  /**
   * Remove backups antigos mantendo apenas o número especificado
   */
  private cleanupOldBackups(): void {
    try {
      const backups = dataExportImportService.getBackups();
      
      // Ordenar backups por data (mais recente primeiro)
      backups.sort((a, b) => 
        new Date(b.metadata.backupDate).getTime() - new Date(a.metadata.backupDate).getTime()
      );
      
      // Manter apenas os backups especificados
      if (backups.length > this.config.retention) {
        const backupsToRemove = backups.slice(this.config.retention);
        backupsToRemove.forEach(backup => {
          dataExportImportService.removeBackup(backup.metadata.backupDate);
        });
        console.log(`🗑️  ${backupsToRemove.length} backups antigos removidos`);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar backups antigos:', error);
    }
  }

  /**
   * Verifica se é hora de fazer backup
   * @returns true se for hora de fazer backup
   */
  shouldBackup(): boolean {
    if (!this.config.enabled || !this.config.lastBackup) {
      return false;
    }
    
    const now = new Date();
    const lastBackup = new Date(this.config.lastBackup);
    const intervalMs = this.getIntervalMs();
    
    return (now.getTime() - lastBackup.getTime()) >= intervalMs;
  }
}

// Exportar instância singleton
export const autoBackupService = AutoBackupService.getInstance();