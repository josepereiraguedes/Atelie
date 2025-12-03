const { IconGenerator } = require('icon-gen');
const path = require('path');
const fs = require('fs');

// Criar diretório build se não existir
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Gerar um ícone simples
IconGenerator.fromText('SGA', {
  output: buildDir,
  type: 'png',
  size: 512,
  background: '#4F46E5',
  color: '#FFFFFF',
  font: 'Arial',
  style: 'bold'
}).then(() => {
  console.log('Ícone gerado com sucesso em build/icon.png');
  
  // Converter para ICO
  return IconGenerator.fromPNG(path.join(buildDir, 'icon.png'), buildDir, {
    ico: {
      name: 'icon',
      sizes: [16, 24, 32, 48, 64, 128, 256]
    }
  });
}).then(() => {
  console.log('Ícone ICO gerado com sucesso em build/icon.ico');
}).catch((err) => {
  console.error('Erro ao gerar o ícone:', err);
});