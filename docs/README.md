# Sistema de Gestão de Estoque e Financeiro

Sistema completo de gestão de estoque e financeiro para pequenos negócios, totalmente local e offline-first.

## Funcionalidades

- Gestão de produtos (cadastro, edição, exclusão)
- Controle de estoque com alertas de estoque baixo
- Gestão de clientes
- Registro de transações financeiras (vendas, compras)
- Relatórios em PDF e Excel
- Modo claro/escuro
- Funciona offline como PWA
- **Autenticação por e-mail e senha**
- **Compartilhamento de dados entre dispositivos via importação/exportação**
- **Categorias e subcategorias de produtos**
- **Alertas automáticos de estoque baixo**
- **Interface aprimorada com dropdowns para categorias**

## Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS
- ECharts (visualização de dados)
- jsPDF e xlsx (relatórios)

## Como executar localmente

1. Instale as dependências:
   ```bash
   yarn install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   yarn dev
   ```

3. Acesse `http://localhost:5173`

## Autenticação por E-mail e Senha

O sistema suporta autenticação tradicional por e-mail e senha com usuários pré-configurados:

### Usuários Padrão

1. **Usuário 1**:
   - E-mail: pereiraguedes1988@gmail.com
   - Senha: 31051988

2. **Usuário 2**:
   - E-mail: josepereiraguedes@yahoo.com.br
   - Senha: 31052025

## Persistência de Dados Local

O sistema armazena todos os dados localmente no dispositivo do usuário:

- **Armazenamento local**: Todos os dados são salvos no localStorage do navegador
- **Isolamento por usuário**: Cada usuário tem seus próprios dados isolados
- **Funcionamento offline**: O sistema funciona completamente offline após o primeiro acesso
- **Compartilhamento entre dispositivos**: É possível exportar e importar dados entre dispositivos

## Compartilhamento de Dados entre Dispositivos

O sistema permite compartilhar dados entre dispositivos diferentes:

1. **Exportar dados**: Acesse "Configurações" > "Compartilhamento de Dados" e clique em "Exportar Dados"
2. **Transferir arquivo**: Envie o arquivo JSON gerado para o outro dispositivo
3. **Importar dados**: No dispositivo de destino, acesse "Configurações" > "Compartilhamento de Dados" e clique em "Importar Dados"
4. **Sincronização**: Os dados serão atualizados automaticamente

## Categorias e Subcategorias de Produtos

O sistema agora suporta organização avançada de produtos com:

- **Categorias principais**: Organização de produtos em categorias amplas
- **Subcategorias**: Classificação mais específica dentro de cada categoria
- **Filtros aprimorados**: Dropdowns interativos para fácil navegação
- **Visualização hierárquica**: Exibição clara da estrutura categoria/subcategoria

## Alertas Automáticos de Estoque Baixo

O sistema monitora automaticamente o estoque e notifica quando:

- **Nível mínimo atingido**: Alertas visuais quando o estoque chega ao nível mínimo configurado
- **Notificações em tempo real**: Toast notifications para produtos com estoque baixo
- **Destaque visual**: Produtos com estoque baixo são destacados na interface
- **Resumo de alertas**: Painel dedicado para monitorar todos os produtos com estoque baixo

## Como construir para produção

```bash
yarn build
```

Os arquivos serão gerados no diretório `dist/`.

## Testes

O sistema inclui uma suite abrangente de testes para garantir a qualidade e funcionamento correto de todas as funcionalidades.

### Executar Todos os Testes

```bash
npm test
```

### Testes de Integração Abrangentes

```bash
npm run test:integration
```

### Cobertura de Testes

Os testes cobrem:
- Frontend (React components, rotas, funcionalidades)
- Funcionalidades específicas (relatórios, dashboard)
- Importação e exportação de dados

## Segurança

Como o sistema é totalmente local, todos os dados permanecem no dispositivo do usuário:

- **Privacidade**: Os dados nunca deixam o dispositivo do usuário
- **Segurança**: Não há transmissão de dados pela internet
- **Controle**: O usuário tem controle total sobre seus dados