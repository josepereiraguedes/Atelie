import React, { memo } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = memo(({ 
  label, 
  required = false, 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
});

// Componente específico para inputs de texto
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  [key: string]: any; // Para props adicionais
}

export const TextInput: React.FC<TextInputProps> = memo(({
  value,
  onChange,
  placeholder = '',
  required = false,
  type = 'text',
  ...props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      {...props}
    />
  );
});

// Componente específico para inputs numéricos
interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  [key: string]: any; // Para props adicionais
}

export const NumberInput: React.FC<NumberInputProps> = memo(({
  value,
  onChange,
  placeholder = '',
  min,
  max,
  step = '1',
  ...props
}) => {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      {...props}
    />
  );
});

export default FormField;