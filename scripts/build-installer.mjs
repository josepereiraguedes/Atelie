import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Iniciando processo de build do instalador...');
console.log(`📦 Versão atual: ${JSON.parse(fs.readFileSync('package.json')).version}`);

try {
  // 1. Limpar builds anteriores
  console.log('🧹 Limpando builds anteriores...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
    console.log('✅ Pasta dist limpa');
  }
  
  if (fs.existsSync('electron/dist')) {
    fs.rmSync('electron/dist', { recursive: true });
    console.log('✅ Pasta electron/dist limpa');
  }

  // 2. Build da aplicação React
  console.log('🏗️  Construindo aplicação React...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build da aplicação React concluído');

  // 3. Copiar arquivos do Electron para a pasta dist
  console.log('⚙️  Copiando arquivos do Electron...');
  if (!fs.existsSync('electron/dist')) {
    fs.mkdirSync('electron/dist', { recursive: true });
  }
  execSync('xcopy electron\\main.cjs electron\\dist /Y', { stdio: 'inherit' });
  console.log('✅ Arquivos do Electron copiados');

  // 4. Copiar arquivos para a pasta electron/dist
  console.log('📋 Copiando arquivos para electron/dist...');
  execSync('xcopy dist electron\\dist /E /I /Y', { stdio: 'inherit' });
  execSync('xcopy server electron\\dist\\server /E /I /Y', { stdio: 'inherit' });
  execSync('xcopy local_database electron\\dist\\local_database /E /I /Y', { stdio: 'inherit' });
  console.log('✅ Arquivos copiados para electron/dist');

  // 5. Gerar o instalador NSIS para Windows (sem reconstrução de dependências)
  console.log('📦 Gerando instalador NSIS (modo seguro)...');
  execSync('npx electron-builder --win --config electron-builder.json --publish=never', { stdio: 'inherit', env: { ...process.env, ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true' } });
  console.log('✅ Instalador NSIS gerado com sucesso');

  console.log('🎉 Processo de build do instalador concluído!');
} catch (error) {
  console.error('❌ Erro no processo de build:', error);
  process.exit(1);
}