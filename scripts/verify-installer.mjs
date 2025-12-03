import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

console.log('🔍 Iniciando verificação do instalador...');

// Função para calcular checksum SHA512
function calculateSHA512(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('base64')));
    stream.on('error', reject);
  });
}

async function verifyInstaller() {
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

    // Verificar tamanho do arquivo
    const stats = fs.statSync(installerPath);
    console.log(`📊 Tamanho do instalador: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Calcular checksum SHA512
    console.log('🔐 Calculando checksum SHA512...');
    const checksum = await calculateSHA512(installerPath);
    console.log(`#️⃣  SHA512: ${checksum}`);

    // Verificar arquivo blockmap
    const blockmapFile = `${installer}.blockmap`;
    const blockmapPath = path.join('dist_electron', blockmapFile);
    
    if (fs.existsSync(blockmapPath)) {
      console.log(`📊 Blockmap encontrado: ${blockmapFile}`);
      const blockmapStats = fs.statSync(blockmapPath);
      console.log(`📊 Tamanho do blockmap: ${(blockmapStats.size / 1024).toFixed(2)} KB`);
    } else {
      console.warn('⚠️  Blockmap não encontrado');
    }

    // Verificar arquivo latest.yml
    const latestYmlPath = path.join('dist_electron', 'latest.yml');
    if (fs.existsSync(latestYmlPath)) {
      console.log('📄 latest.yml encontrado');
      const latestYmlContent = fs.readFileSync(latestYmlPath, 'utf8');
      console.log('📄 Conteúdo do latest.yml:');
      console.log(latestYmlContent);
    } else {
      console.warn('⚠️  latest.yml não encontrado');
    }

    console.log('✅ Verificação do instalador concluída com sucesso!');
    console.log('✅ O instalador está pronto para distribuição.');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    process.exit(1);
  }
}

verifyInstaller();