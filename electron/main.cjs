const { app, BrowserWindow, Menu, screen, shell } = require('electron');
const path = require('path');
const url = require('url');

// Importar o serviço de atualização automática
// Em desenvolvimento, importa o arquivo TypeScript
// Em produção, importa o arquivo JavaScript compilado
let autoUpdateService;
let autoBackupService; // Adicionar esta linha

try {
  // Tentar importar o arquivo compilado para produção
  const autoUpdateModule = require('../electron/dist/src/services/autoUpdate.js');
  autoUpdateService = autoUpdateModule.autoUpdateService;
  console.log('✅ Serviço de atualização carregado (produção)');

  // Tentar importar o serviço de backup automático
  try {
    const autoBackupModule = require('../electron/dist/src/services/autoBackup.js');
    autoBackupService = autoBackupModule.autoBackupService;
    console.log('✅ Serviço de backup automático carregado (produção)');
  } catch (backupError) {
    console.warn('⚠️  Serviço de backup automático não encontrado (produção)');
  }
} catch (error) {
  try {
    // Fallback para desenvolvimento
    const autoUpdateModule = require('../src/services/autoUpdate.ts');
    autoUpdateService = autoUpdateModule.autoUpdateService;
    console.log('✅ Serviço de atualização carregado (desenvolvimento)');

    // Fallback para desenvolvimento - backup automático
    try {
      const autoBackupModule = require('../src/services/autoBackup.ts');
      autoBackupService = autoBackupModule.autoBackupService;
      console.log('✅ Serviço de backup automático carregado (desenvolvimento)');
    } catch (backupError) {
      console.warn('⚠️  Serviço de backup automático não encontrado (desenvolvimento)');
    }
  } catch (error2) {
    console.warn('⚠️  Serviço de atualização não encontrado, desativando atualizações automáticas');
    autoUpdateService = {
      initialize: () => console.log('🔄 Atualizações automáticas desativadas')
    };
  }
}

// Mantenha uma referência global do objeto da janela
let mainWindow;

function createWindow() {
  console.log('🔧 Criando janela do aplicativo...');

  // Obter as dimensões da tela
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Criar a janela do navegador
  mainWindow = new BrowserWindow({
    height: Math.min(800, height * 0.9),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Desabilitar sandbox para facilitar comunicação local se necessário
      webSecurity: false, // Desabilitar webSecurity temporariamente para migração (permite CORS e CSP relaxado)
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../build/icon.ico')
  });

  // Forçar CSP permissiva headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval';"]
      }
    });
  });

  // Remover o menu padrão
  mainWindow.setMenu(null);

  // Carregar o arquivo index.html do aplicativo
  if (app.isPackaged) {
    console.log('📦 Aplicativo em modo empacotado (produção)');
    // Em produção, quando empacotado, os arquivos estão dentro do app.asar
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('📂 Caminho do index.html:', indexPath);

    mainWindow.loadFile(indexPath).catch(error => {
      console.error('❌ Erro ao carregar arquivo index.html:', error);
    });
  } else {
    console.log('💻 Aplicativo em modo de desenvolvimento');
    // Em desenvolvimento, usar o servidor de desenvolvimento ou arquivo local
    const startUrl = process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true
      });
    console.log('🌐 URL de inicialização:', startUrl);

    mainWindow.loadURL(startUrl).catch(error => {
      console.error('❌ Erro ao carregar URL:', error);
    });
  }

  // Abrir links externos no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Tratar erros de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('💥 Falha ao carregar a página:', errorCode, errorDescription, validatedURL);
  });

  // Tratar quando a página é carregada com sucesso
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página carregada com sucesso');
  });

  // Tratar erros na renderização
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('💥 Processo de renderização falhou:', details);
  });

  // Tratar erros de console no renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelLabels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    console.log(`[Renderer ${levelLabels[level]}] ${message} (${sourceId}:${line})`);
  });

  // Emitido quando a janela é fechada
  mainWindow.on('closed', function () {
    console.log('🚪 Janela fechada');
    mainWindow = null;
  });

  // Tratar erros não tratados
  mainWindow.webContents.on('did-fail-provisional-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('💥 Falha no carregamento provisional:', errorCode, errorDescription, validatedURL);
  });
}

// Este método será chamado quando o Electron terminar a inicialização
app.whenReady().then(() => {
  console.log('🚀 Electron pronto, criando janela...');
  createWindow();

  // Inicializar o serviço de atualização automática
  autoUpdateService.initialize();

  // Inicializar o serviço de backup automático (se disponível)
  if (autoBackupService && typeof autoBackupService.start === 'function') {
    try {
      autoBackupService.start();
      console.log('✅ Serviço de backup automático iniciado');
    } catch (error) {
      console.error('❌ Erro ao iniciar serviço de backup automático:', error);
    }
  }
}).catch(error => {
  console.error('❌ Erro ao iniciar Electron:', error);
});

// Sair quando todas as janelas estiverem fechadas, exceto no macOS
app.on('window-all-closed', function () {
  console.log('🚪 Todas as janelas fechadas');
  if (process.platform !== 'darwin') {
    console.log('👋 Saindo do aplicativo');
    app.quit();
  }
});

app.on('activate', function () {
  console.log('🔄 Aplicativo ativado');
  // No macOS é comum recriar uma janela no app quando o
  // ícone da dock é clicado e não há outras janelas abertas
  if (mainWindow === null) {
    console.log('🔧 Criando nova janela');
    createWindow();
  }
});

// Tratar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('💥 Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason, promise);
});