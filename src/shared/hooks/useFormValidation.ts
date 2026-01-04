import { useState, useCallback } from 'react';

// Definições de tipos
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface FormErrors {
  [key: string]: string[];
}

// Hook principal
export const useFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  // Função para validar um campo específico
  const validateField = useCallback((
    value: any,
    rules: ValidationRule[],
    fieldName: string
  ): ValidationResult => {
    const fieldErrors: string[] = [];

    for (const rule of rules) {
      // Validação de campo obrigatório
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(rule.message || `${fieldName} é obrigatório`);
        continue;
      }

      // Se não é obrigatório e está vazio, pular outras validações
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Validação de comprimento mínimo
      if (rule.minLength !== undefined && String(value).length < rule.minLength) {
        fieldErrors.push(rule.message || `${fieldName} deve ter pelo menos ${rule.minLength} caracteres`);
        continue;
      }

      // Validação de comprimento máximo
      if (rule.maxLength !== undefined && String(value).length > rule.maxLength) {
        fieldErrors.push(rule.message || `${fieldName} deve ter no máximo ${rule.maxLength} caracteres`);
        continue;
      }

      // Validação por expressão regular
      if (rule.pattern && !rule.pattern.test(String(value))) {
        fieldErrors.push(rule.message || `${fieldName} não está no formato correto`);
        continue;
      }

      // Validação personalizada
      if (rule.custom && !rule.custom(value)) {
        fieldErrors.push(rule.message || `${fieldName} não é válido`);
        continue;
      }
    }

    return {
      isValid: fieldErrors.length === 0,
      errors: fieldErrors
    };
  }, []);

  // Função para validar todo o formulário
  const validateForm = useCallback((
    formData: Record<string, any>,
    validationRules: Record<string, ValidationRule[]>
  ): boolean => {
    const formErrors: FormErrors = {};

    for (const fieldName in validationRules) {
      const fieldValue = formData[fieldName];
      const rules = validationRules[fieldName];
      
      const result = validateField(fieldValue, rules, fieldName);
      
      if (!result.isValid) {
        formErrors[fieldName] = result.errors;
      }
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [validateField]);

  // Função para limpar erros
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Função para definir erro manualmente
  const setFieldError = useCallback((fieldName: string, errorMessages: string[]) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessages
    }));
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    setFieldError
  };
};

// Regras de validação pré-definidas
export const validationRules = {
  // Nome completo (obrigatório, mínimo 2 caracteres)
  fullName: [
    { required: true, message: 'Nome é obrigatório' },
    { minLength: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
    { maxLength: 100, message: 'Nome deve ter no máximo 100 caracteres' }
  ] as ValidationRule[],

  // Email (obrigatório, formato válido)
  email: [
    { required: true, message: 'Email é obrigatório' },
    { 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Email inválido' 
    },
    { maxLength: 255, message: 'Email deve ter no máximo 255 caracteres' }
  ] as ValidationRule[],

  // Telefone (opcional, formato brasileiro)
  phone: [
    { 
      pattern: /^(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/, 
      message: 'Telefone inválido. Use o formato (00) 00000-0000' 
    },
    { maxLength: 20, message: 'Telefone deve ter no máximo 20 caracteres' }
  ] as ValidationRule[],

  // CPF (obrigatório, formato válido)
  cpf: [
    { required: true, message: 'CPF é obrigatório' },
    { 
      pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 
      message: 'CPF inválido. Use o formato 000.000.000-00' 
    }
  ] as ValidationRule[],

  // CNPJ (obrigatório, formato válido)
  cnpj: [
    { required: true, message: 'CNPJ é obrigatório' },
    { 
      pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 
      message: 'CNPJ inválido. Use o formato 00.000.000/0000-00' 
    }
  ] as ValidationRule[],

  // Senha (obrigatória, mínimo 6 caracteres)
  password: [
    { required: true, message: 'Senha é obrigatória' },
    { minLength: 6, message: 'Senha deve ter pelo menos 6 caracteres' },
    { maxLength: 128, message: 'Senha deve ter no máximo 128 caracteres' }
  ] as ValidationRule[],

  // Confirmação de senha
  confirmPassword: (password: string) => [
    { required: true, message: 'Confirmação de senha é obrigatória' },
    { 
      custom: (value: string) => value === password, 
      message: 'As senhas não coincidem' 
    }
  ] as ValidationRule[],

  // Valor monetário (obrigatório, positivo)
  monetaryValue: [
    { required: true, message: 'Valor é obrigatório' },
    { 
      pattern: /^\d+(\.\d{1,2})?$/, 
      message: 'Valor inválido. Use o formato 0.00' 
    },
    { 
      custom: (value: string) => parseFloat(value) >= 0, 
      message: 'Valor deve ser positivo' 
    }
  ] as ValidationRule[],

  // Quantidade (obrigatória, inteiro positivo)
  quantity: [
    { required: true, message: 'Quantidade é obrigatória' },
    { 
      pattern: /^\d+$/, 
      message: 'Quantidade deve ser um número inteiro' 
    },
    { 
      custom: (value: string) => parseInt(value) > 0, 
      message: 'Quantidade deve ser maior que zero' 
    }
  ] as ValidationRule[],

  // SKU (obrigatório, alfanumérico)
  sku: [
    { required: true, message: 'SKU é obrigatório' },
    { 
      pattern: /^[a-zA-Z0-9-_]+$/, 
      message: 'SKU deve conter apenas letras, números, hífens e underscores' 
    },
    { minLength: 1, message: 'SKU deve ter pelo menos 1 caractere' },
    { maxLength: 50, message: 'SKU deve ter no máximo 50 caracteres' }
  ] as ValidationRule[]
};