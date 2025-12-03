import React, { memo } from 'react';

interface SelectFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: any; // Para props adicionais
}

const SelectField: React.FC<SelectFieldProps> = memo(({
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

export default SelectField;