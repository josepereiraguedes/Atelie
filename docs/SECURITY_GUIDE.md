# Guia de Segurança para o Sistema de Gestão de Estoque

## Visão Geral

Este documento descreve as práticas de segurança implementadas no sistema local de gestão de estoque.

## Características de Segurança do Sistema Local

### 1. Dados Armazenados Localmente

**Característica**: Todos os dados são armazenados localmente no dispositivo do usuário, no localStorage do navegador.

**Benefícios**:
- Os dados nunca deixam o dispositivo do usuário
- Não há transmissão de dados pela internet
- O usuário tem controle total sobre seus dados

### 2. Autenticação Local

**Característica**: O sistema utiliza autenticação local por e-mail e senha com usuários pré-configurados.

**Implementação**:
- Senhas são armazenadas como hashes bcrypt
- Verificação de senhas ocorre localmente no dispositivo do usuário
- Não há comunicação com servidores externos para autenticação

### 3. Isolamento de Dados por Usuário

**Característica**: Cada usuário tem seus próprios dados isolados no localStorage.

**Implementação**:
- Os dados são armazenados com chaves específicas para cada usuário
- Um usuário não pode acessar os dados de outro usuário
- O isolamento é feito com base no ID do usuário

## Recomendações de Segurança

### Para Ambiente de Desenvolvimento

1. **Não use credenciais reais**: Use credenciais de teste em ambientes de desenvolvimento.
2. **Gitignore**: Certifique-se de que o arquivo `.env` está no `.gitignore`.
3. **Variáveis de ambiente**: Use variáveis de ambiente para todas as configurações sensíveis.

### Para Uso em Produção

1. **Backup de Dados**:
   - Recomenda-se que os usuários façam backup regular dos dados
   - Utilize a função de exportação de dados para salvar os dados em arquivo

2. **Atualizações de Segurança**:
   - Mantenha o sistema atualizado com as últimas versões das dependências
   - Verifique regularmente por vulnerabilidades nas bibliotecas utilizadas

3. **Proteção do Dispositivo**:
   - Utilize senhas fortes para desbloquear o dispositivo
   - Mantenha o sistema operacional e o navegador atualizados
   - Utilize antivírus e firewall

## Práticas de Segurança Implementadas

1. **Hashing de Senhas**: Todas as senhas são armazenadas como hashes bcrypt.
2. **Autenticação Local**: Sistema de autenticação que funciona completamente offline.
3. **Tratamento de Erros**: Mensagens de erro genéricas para evitar vazamento de informações.
4. **Persistência Segura**: Uso de localStorage para persistência de sessão com dados limitados.
5. **Isolamento de Dados**: Cada usuário tem seus dados isolados no armazenamento local.

## Compartilhamento de Dados entre Dispositivos

### Segurança na Exportação/Importação

1. **Exportação de Dados**:
   - Os dados são exportados em formato JSON
   - O arquivo exportado contém todos os dados do usuário
   - Recomenda-se proteger o arquivo exportado com senha se for compartilhado

2. **Importação de Dados**:
   - A importação substitui os dados atuais do usuário
   - É criado um backup automático antes da importação
   - Apenas arquivos JSON válidos podem ser importados

## Conclusão

O sistema local implementa práticas de segurança adequadas para uma aplicação que roda totalmente no dispositivo do usuário. Como todos os dados permanecem localmente, o maior risco é a perda de dados devido a falhas no dispositivo ou no navegador. Recomenda-se que os usuários façam backup regular dos dados utilizando a função de exportação.