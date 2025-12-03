# Processo de Deployment - Sistema Gestão Ateliê

## Visão Geral

Este documento descreve o processo completo de deployment do Sistema Gestão Ateliê, incluindo a geração do instalador, assinatura de código e publicação de releases.

## Pré-requisitos

1. **Dependências do Sistema**
   - Node.js v16 ou superior
   - npm v7 ou superior
   - Windows SDK (para assinatura de código)
   - GitHub CLI (para publicação de releases)

2. **Configuração do Ambiente**
   - Certificado de assinatura de código (opcional)
   - Acesso ao repositório GitHub

## Etapas do Processo de Deployment

### 1. Atualização de Dependências

```bash
npm install
```

### 2. Build da Aplicação

```bash
npm run build
```

### 3. Geração do Instalador

```bash
npm run build:installer
```

Este comando:
- Limpa builds anteriores
- Constrói a aplicação React
- Copia arquivos para a pasta electron/dist
- Gera o instalador NSIS para Windows

### 4. Assinatura do Instalador (Opcional)

Para assinar o instalador com um certificado digital:

```bash
# Definir variáveis de ambiente
set CODE_SIGN_CERT_PATH=caminho\para\seu\certificado.pfx
set CODE_SIGN_CERT_PASSWORD=sua_senha

# Assinar o instalador
npm run sign:installer
```

### 5. Publicação de Release

Para publicar uma nova release no GitHub:

```bash
npm run publish:release
```

Este comando:
- Cria uma tag git com a versão atual
- Envia a tag para o repositório
- Cria uma release no GitHub com o instalador

## Estrutura de Arquivos Gerados

```
dist_electron/
├── Sistema Gestão Ateliê Setup 1.0.0.exe       # Instalador principal
├── Sistema Gestão Ateliê Setup 1.0.0.exe.blockmap  # Bloco de mapa para atualizações diferenciais
├── latest.yml                                  # Informações da última versão
├── builder-effective-config.yaml               # Configuração efetiva do electron-builder
├── builder-debug.yml                           # Informações de debug
└── win-unpacked/                               # Versão desempacotada para debug
    ├── Sistema Gestão Ateliê.exe               # Executável principal
    └── ...                                     # Outros arquivos
```

## Configuração de Atualizações Automáticas

O sistema utiliza `electron-updater` para gerenciar atualizações automáticas. A configuração está definida em:

- `electron-builder.json`: Configuração do provedor de updates
- `src/services/autoUpdate.ts`: Serviço de atualização automática

### Provedor de Updates

Atualmente configurado para usar GitHub Releases:

```json
{
  "publish": {
    "provider": "github",
    "owner": "seu-usuario",
    "repo": "sistema-gestao-atelie"
  }
}
```

## Troubleshooting

### Problemas Comuns

1. **Erro ao instalar dependências**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **signtool não encontrado**
   - Instale o Windows SDK
   - Adicione o caminho do signtool ao PATH do sistema

3. **GitHub CLI não autenticado**
   ```bash
   gh auth login
   ```

4. **Permissões de escrita**
   - Execute o terminal como administrador
   - Verifique permissões da pasta do projeto

### Logs de Debug

Os logs são gerados em:
- `dist_electron/builder-debug.yml`: Logs do electron-builder
- `~/.electron-log/`: Logs da aplicação (quando em produção)

## Melhores Práticas

1. **Versionamento Semântico**
   - Siga o padrão MAJOR.MINOR.PATCH
   - Atualize a versão em `package.json` antes de cada release

2. **Testes Antes do Deployment**
   - Execute todos os testes: `npm test`
   - Teste a atualização automática em ambiente de staging

3. **Backup de Builds**
   - Mantenha cópias dos instaladores gerados
   - Documente as mudanças em cada versão

4. **Segurança**
   - Sempre assine o código em produção
   - Verifique a integridade dos arquivos antes da publicação

## Automação

Para automatizar todo o processo de deployment:

```bash
# Script completo de deployment
npm run build
npm run build:installer
npm run sign:installer
npm run publish:release
```

## Próximos Passos

1. **Integração Contínua**
   - Configurar GitHub Actions para builds automáticos
   - Adicionar testes automatizados no pipeline

2. **Deploy Multiplataforma**
   - Gerar instaladores para macOS e Linux
   - Configurar atualizações para múltiplas plataformas

3. **Monitoramento**
   - Adicionar telemetria de uso
   - Implementar relatórios de erro automáticos

4. **Documentação do Usuário**
   - Criar guia de instalação para usuários finais
   - Documentar processo de atualização