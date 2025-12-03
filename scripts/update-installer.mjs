#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔄 Atualizando instalador do Sistema Gestão Ateliê');
console.log('==========================================');

try {
  // Verificar versão atual
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`📦 Versão atual: ${packageJson.version}`);
  
  // Incrementar versão (patch)
  const versionParts = packageJson.version.split('.');
  versionParts[2] = parseInt(versionParts[2]) + 1;
  const newVersion = versionParts.join('.');
  
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log(`🆕 Nova versão: ${newVersion}`);
  
  // Executar build do instalador
  console.log('\n🔨 Construindo novo instalador...');
  execSync('node scripts/build-installer.mjs', { stdio: 'inherit' });
  
  console.log('\n✅ Instalador atualizado com sucesso!');
  console.log(`📁 Nova versão ${newVersion} disponível em dist_electron/`);
  
} catch (error) {
  console.error('❌ Erro ao atualizar instalador:', error.message);
  process.exit(1);
}