import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔏 Iniciando processo de assinatura do instalador...');

function findSignTool() {
  // Caminhos comuns para o signtool
  const possiblePaths = [
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\*\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\*\\x86\\signtool.exe',
    'C:\\Program Files (x86)\\Microsoft SDKs\\Windows\\*\\bin\\signtool.exe',
    'C:\\Program Files\\Microsoft SDKs\\Windows\\*\\bin\\signtool.exe'
  ];

  for (const pattern of possiblePaths) {
    if (pattern.includes('*')) {
      // Para padrões com curinga, precisamos verificar versões
      const baseDir = pattern.substring(0, pattern.indexOf('*'));
      if (fs.existsSync(baseDir)) {
        const versions = fs.readdirSync(baseDir);
        for (const version of versions) {
          const fullPath = pattern.replace('*', version);
          if (fs.existsSync(fullPath)) {
            return fullPath;
          }
        }
      }
    } else {
      if (fs.existsSync(pattern)) {
        return pattern;
      }
    }
  }

  return null;
}

function signInstaller() {
  try {
    // Verificar se a pasta dist_electron existe
    if (!fs.existsSync('dist_electron')) {
      throw new Error('Pasta dist_electron não encontrada. Execute o build primeiro.');
    }

    // Encontrar o instalador mais recente
    const files = fs.readdirSync('dist_electron');
    const installer = files.find(file => file.endsWith('.exe') && file.includes('Setup'));
    
    if (!installer) {
      throw new Error('Instalador não encontrado na pasta dist_electron');
    }

    const installerPath = path.join('dist_electron', installer);
    console.log(`📦 Instalador encontrado: ${installer}`);

    // Verificar certificado de assinatura
    const certPath = process.env.CODE_SIGN_CERT_PATH;
    const certPassword = process.env.CODE_SIGN_CERT_PASSWORD;

    if (!certPath || !certPassword) {
      console.warn('⚠️  Certificado de assinatura não configurado.');
      console.warn('🔧 Defina as variáveis de ambiente:');
      console.warn('   set CODE_SIGN_CERT_PATH=caminho\\para\\seu\\certificado.pfx');
      console.warn('   set CODE_SIGN_CERT_PASSWORD=sua_senha');
      console.warn('⏭️  Pulando assinatura de código...');
      return;
    }

    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificado não encontrado: ${certPath}`);
    }

    // Encontrar signtool
    console.log('🔍 Procurando signtool...');
    const signToolPath = findSignTool();
    
    if (!signToolPath) {
      throw new Error('signtool não encontrado. Instale o Windows SDK.');
    }

    console.log(`✅ signtool encontrado: ${signToolPath}`);

    // Assinar o instalador
    console.log('🔏 Assinando o instalador...');
    const signCommand = `"${signToolPath}" sign /f "${certPath}" /p "${certPassword}" /t http://timestamp.digicert.com "${installerPath}"`;
    
    execSync(signCommand, { stdio: 'inherit' });
    console.log('✅ Instalador assinado com sucesso!');

    // Verificar a assinatura
    console.log('🔍 Verificando assinatura...');
    const verifyCommand = `"${signToolPath}" verify /pa "${installerPath}"`;
    
    execSync(verifyCommand, { stdio: 'inherit' });
    console.log('✅ Assinatura verificada com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a assinatura:', error.message);
    process.exit(1);
  }
}

signInstaller();