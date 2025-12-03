import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

// Configurar o logger para atualizações
const log = require('electron-log');
log.transports.file.level = 'info';
autoUpdater.logger = log;

interface UpdateInfo {
  version: string;
}

interface ProgressInfo {
  percent: number;
}

class AutoUpdateService {
  private initialized = false;

  /**
   * Inicializa o serviço de atualização automática
   */
  initialize(): void {
    if (this.initialized) {
      console.log('🔄 Serviço de atualização já inicializado');
      return;
    }

    if (!app.isPackaged) {
      console.log('🔧 Modo desenvolvimento - atualizações automáticas desativadas');
      return;
    }

    try {
      // Configurar o feed de atualizações
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'seu-usuario',
        repo: 'sistema-gestao-atelie'
      });

      // Registrar eventos
      this.registerEvents();
      
      // Verificar atualizações na inicialização
      setTimeout(() => {
        this.checkForUpdates();
      }, 5000); // Verificar após 5 segundos

      this.initialized = true;
      console.log('✅ Serviço de atualização automática inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar atualizações automáticas:', error);
    }
  }

  /**
   * Verifica se há atualizações disponíveis
   */
  checkForUpdates(): void {
    if (!this.initialized) {
      console.log('⚠️  Serviço de atualização não inicializado');
      return;
    }

    console.log('🔍 Verificando atualizações...');
    autoUpdater.checkForUpdates().catch((error: Error) => {
      console.error('❌ Erro ao verificar atualizações:', error);
    });
  }

  /**
   * Registra os eventos do autoUpdater
   */
  private registerEvents(): void {
    // Evento: Verificando atualizações
    autoUpdater.on('checking-for-update', () => {
      console.log('🔍 Verificando se há atualizações...');
    });

    // Evento: Atualização disponível
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('🎉 Nova atualização disponível:', info.version);
      
      // Mostrar diálogo de confirmação
      dialog.showMessageBox({
        type: 'info',
        title: 'Atualização Disponível',
        message: `Nova versão ${info.version} disponível!`,
        detail: 'Deseja baixar e instalar a atualização agora?',
        buttons: ['Atualizar Agora', 'Depois']
      }).then(result => {
        if (result.response === 0) {
          // Iniciar download da atualização
          autoUpdater.downloadUpdate().catch((error: Error) => {
            console.error('❌ Erro ao baixar atualização:', error);
          });
        }
      }).catch((error: Error) => {
        console.error('❌ Erro no diálogo de atualização:', error);
      });
    });

    // Evento: Nenhuma atualização disponível
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('✅ Nenhuma atualização disponível. Versão atual:', info.version);
    });

    // Evento: Erro na verificação de atualizações
    autoUpdater.on('error', (error: Error) => {
      console.error('❌ Erro na atualização:', error);
    });

    // Evento: Download em progresso
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      console.log(`📥 Download em progresso: ${progress.percent.toFixed(2)}%`);
    });

    // Evento: Download concluído
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('✅ Atualização baixada:', info.version);
      
      // Mostrar diálogo para reiniciar e aplicar a atualização
      dialog.showMessageBox({
        type: 'info',
        title: 'Atualização Pronta',
        message: `Versão ${info.version} baixada com sucesso!`,
        detail: 'Reinicie o aplicativo para aplicar a atualização.',
        buttons: ['Reiniciar Agora', 'Depois']
      }).then(result => {
        if (result.response === 0) {
          // Reiniciar e aplicar a atualização
          autoUpdater.quitAndInstall();
        }
      }).catch((error: Error) => {
        console.error('❌ Erro no diálogo de reinicialização:', error);
      });
    });
  }
}

// Instância singleton do serviço
export const autoUpdateService = new AutoUpdateService();