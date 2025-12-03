const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function checkAndConvertIcon() {
  try {
    // Criar diretório build se não existir
    const buildDir = path.join(__dirname, 'build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir);
    }

    // Verificar se o arquivo PNG existe
    const pngPath = path.join(__dirname, 'public', 'icon-512.png');
    if (!fs.existsSync(pngPath)) {
      console.error('Arquivo PNG não encontrado:', pngPath);
      return;
    }

    // Ler e verificar o arquivo PNG
    const image = await Jimp.read(pngPath);
    console.log('Arquivo PNG verificado com sucesso');
    console.log('Dimensões:', image.bitmap.width, 'x', image.bitmap.height);

    // Converter para ICO (primeiro salvar como PNG temporário e depois usar png-to-ico)
    const tempPngPath = path.join(buildDir, 'temp-icon.png');
    await image.writeAsync(tempPngPath);
    console.log('PNG temporário criado:', tempPngPath);

    // Agora converter para ICO usando png-to-ico
    const { toICO } = require('png-to-ico');
    const icoBuffer = await toICO([image.bitmap]);
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('Ícone convertido com sucesso para build/icon.ico');
    
    // Remover o arquivo temporário
    fs.unlinkSync(tempPngPath);
  } catch (err) {
    console.error('Erro ao verificar/Converter o ícone:', err);
  }
}

checkAndConvertIcon();