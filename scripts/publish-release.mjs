import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando processo de publicação de release...');

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function checkGitStatus() {
  try {
    // Verificar se há alterações não commitadas
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim() !== '') {
      throw new Error('Existem alterações não commitadas. Faça commit antes de publicar.');
    }

    // Verificar se estamos no branch principal
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch !== 'main' && branch !== 'master') {
      console.warn(`⚠️  Você está no branch '${branch}', não em main/master.`);
    }

    console.log('✅ Git status verificado');
  } catch (error) {
    throw new Error(`Erro ao verificar git status: ${error.message}`);
  }
}

function createGitTag(version) {
  try {
    const tag = `v${version}`;
    
    // Verificar se a tag já existe
    try {
      execSync(`git rev-parse ${tag}`, { stdio: 'ignore' });
      console.log(`⚠️  Tag ${tag} já existe`);
      return tag;
    } catch {
      // Tag não existe, podemos criá-la
    }

    console.log(`🏷️  Criando tag git: ${tag}`);
    execSync(`git tag -a ${tag} -m "Release version ${version}"`, { stdio: 'inherit' });
    console.log(`✅ Tag ${tag} criada com sucesso`);

    return tag;
  } catch (error) {
    throw new Error(`Erro ao criar tag: ${error.message}`);
  }
}

function pushToRemote(tag) {
  try {
    console.log('📡 Enviando alterações para o repositório remoto...');
    execSync('git push', { stdio: 'inherit' });
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });
    console.log('✅ Alterações enviadas com sucesso');
  } catch (error) {
    throw new Error(`Erro ao enviar para o repositório: ${error.message}`);
  }
}

function createGitHubRelease(version, tag) {
  try {
    // Verificar se o GitHub CLI está instalado
    execSync('gh --version', { stdio: 'ignore' });
  } catch {
    throw new Error('GitHub CLI não encontrado. Instale em https://cli.github.com/');
  }

  try {
    // Verificar se a pasta dist_electron existe
    if (!fs.existsSync('dist_electron')) {
      throw new Error('Pasta dist_electron não encontrada. Execute o build primeiro.');
    }

    // Encontrar os arquivos para upload
    const files = fs.readdirSync('dist_electron');
    const installer = files.find(file => file.endsWith('.exe') && file.includes('Setup'));
    const blockmap = files.find(file => file.endsWith('.blockmap'));
    const latestYml = files.find(file => file === 'latest.yml');

    if (!installer) {
      throw new Error('Instalador não encontrado na pasta dist_electron');
    }

    const installerPath = path.join('dist_electron', installer);
    const blockmapPath = blockmap ? path.join('dist_electron', blockmap) : null;
    const latestYmlPath = latestYml ? path.join('dist_electron', latestYml) : null;

    // Criar a release no GitHub
    console.log('🐙 Criando release no GitHub...');
    
    let command = `gh release create ${tag} "${installerPath}#Instalador para Windows"`;
    
    if (blockmapPath) {
      command += ` "${blockmapPath}#Blockmap para atualizações diferenciais"`;
    }
    
    if (latestYmlPath) {
      command += ` "${latestYmlPath}#Informações da última versão"`;
    }
    
    command += ` --title "Release ${version}" --notes "Release version ${version} do Sistema Gestão Ateliê"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Release criada com sucesso no GitHub');
  } catch (error) {
    throw new Error(`Erro ao criar release no GitHub: ${error.message}`);
  }
}

function publishRelease() {
  try {
    const version = getCurrentVersion();
    console.log(`📦 Versão atual: ${version}`);

    // Verificar status do git
    checkGitStatus();

    // Criar tag git
    const tag = createGitTag(version);

    // Enviar para repositório remoto
    pushToRemote(tag);

    // Criar release no GitHub
    createGitHubRelease(version, tag);

    console.log('🎉 Processo de publicação concluído com sucesso!');
    console.log(`🔗 Release disponível em: https://github.com/sistema-gestao-estoque/sistema-gestao-estoque/releases/tag/${tag}`);

  } catch (error) {
    console.error('❌ Erro durante a publicação:', error.message);
    process.exit(1);
  }
}

publishRelease();