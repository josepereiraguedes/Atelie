# Componentes Comuns Reutilizáveis

Este diretório contém componentes reutilizáveis desenvolvidos para padronizar a interface e reduzir duplicação de código no projeto.

## Componentes Disponíveis

### Componentes de Formulário
- [PageHeader](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/PageHeader.tsx) - Cabeçalho padrão para páginas
- [FormActions](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/FormActions.tsx) - Botões de ação para formulários (Cancelar/Salvar)
- [FormField](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/FormField.tsx) - Campo de formulário com rótulo e suporte a erros
- [SelectField](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/SelectField.tsx) - Campo de seleção
- [TextAreaField](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/TextAreaField.tsx) - Campo de texto multilinha

### Componentes de Interface
- [Sidebar](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/layout/Sidebar.tsx) - Barra lateral de navegação
- [Input](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/Input.tsx) - Campo de entrada de texto
- [IconButton](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/shared/components/forms/IconButton.tsx) - Botão com ícone

### Hooks Personalizados
- [useAppNavigation](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/hooks/useNavigation.ts) - Hook para navegação padronizada
- [useFormHandler](file:///c%3A/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/gest%C3%A3o%20dri/src/hooks/useFormHandler.ts) - Hook para manipulação de formulários

## Componentes Removidos

Os seguintes componentes foram removidos por não estarem em uso no projeto:

- Grid
- Pagination
- Modal
- ProgressBar
- Loading
- Tooltip
- Badge
- Breadcrumb
- Accordion
- Tabs
- Dropdown
- Avatar
- SearchBar
- Navbar
- Footer
- EmptyState
- DataDisplay
- Card
- Filter
- FlexContainer
- List
- Table
- Stats
- Alert

A remoção desses componentes foi feita para melhorar a manutenibilidade e reduzir o tamanho do projeto.

## Como Usar

### Importando Componentes

```typescript
import { PageHeader, FormActions } from '@/shared/components/forms';
import { useAppNavigation, useFormHandler } from '@/shared/hooks';
```

### Exemplo de Uso

``typescript
import React from 'react';
import { PageHeader, FormActions, FormField } from '@/shared/components/forms';
import { useAppNavigation, useFormHandler } from '@/shared/hooks';

const MyForm: React.FC = () => {
  const navigation = useAppNavigation();
  const formHandler = useFormHandler();
  
  return (
    <div>
      <PageHeader 
        title="Meu Formulário"
        onBack={navigation.goBack}
      />
      
      <FormField
        label="Nome"
        error={formHandler.errors.name}
      >
        <input
          type="text"
          value={formHandler.formData.name}
          onChange={(e) => formHandler.setField('name', e.target.value)}
        />
      </FormField>
      
      <FormActions
        onCancel={navigation.goBack}
        onSubmit={formHandler.submit}
        isSubmitting={formHandler.isSubmitting}
      />
    </div>
  );
};
```

## Princípios de Design

1. **Reutilização** - Componentes devem ser genéricos o suficiente para serem usados em múltiplos contextos
2. **Composição** - Componentes devem ser compostos de outros componentes menores quando apropriado
3. **Tipagem** - Todos os componentes devem ter tipagem TypeScript adequada
4. **Acessibilidade** - Componentes devem seguir práticas de acessibilidade web
5. **Responsividade** - Componentes devem funcionar em diferentes tamanhos de tela

## Contribuindo

Para adicionar novos componentes:

1. Crie o componente no diretório `shared/components/forms` ou `shared/components/layout`
2. Exporte-o no arquivo `index.ts`
3. Adicione documentação no README.md
4. Crie testes unitários apropriados
