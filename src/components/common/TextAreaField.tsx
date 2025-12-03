import React, { memo } from 'react';

interface TextAreaFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  [key: string]: any; // Para props adicionais
}

const TextAreaField: React.FC<TextAreaFieldProps> = memo(({
  value,
  onChange,
  placeholder = '',
  rows = 3,
  className = '',
  ...props
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`}
      {...props}
    />
  );
});

export default TextAreaField;