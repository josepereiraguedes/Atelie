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

  // 3. Compilar arquivos TypeScript do Electron
  console.log('⚙️  Compilando arquivos TypeScript do Electron...');
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
  console.log('✅ Compilação dos arquivos TypeScript concluída');

  // 4. Copiar arquivos para a pasta electron/dist
  console.log('📋 Copiando arquivos para electron/dist...');
  execSync('xcopy dist electron\\dist /E /I /Y', { stdio: 'inherit' });
  console.log('✅ Arquivos copiados para electron/dist');

  // 5. Gerar o instalador NSIS para Windows
  console.log('📦 Gerando instalador NSIS...');
  execSync('npx electron-builder --win nsis', { stdio: 'inherit' });
  console.log('✅ Instalador NSIS gerado com sucesso');

  console.log('🎉 Processo de build do instalador concluído!');
} catch (error) {
  console.error('❌ Erro no processo de build:', error);
  process.exit(1);
}