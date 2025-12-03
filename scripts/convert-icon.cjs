const { readPNG, toICO } = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function convertIcon() {
  try {
    // Criar diretório build se não existir
    const buildDir = path.join(__dirname, 'build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir);
    }

    // Ler o arquivo PNG
    const png = await readPNG(path.join(__dirname, 'public', 'icon-512.png'));
    
    // Converter para ICO
    const icoBuffer = await toICO([png]);
    
    // Salvar o arquivo ICO
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('Ícone convertido com sucesso para build/icon.ico');
  } catch (err) {
    console.error('Erro ao converter o ícone:', err);
  }
}

convertIcon();