import React, { memo, forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = memo(forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none bg-white text-gray-900 dark:bg-gray-700 dark:text-white';
  
  const borderClasses = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-transparent' 
    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-transparent';
  
  const combinedClasses = `${baseClasses} ${borderClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={combinedClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';

export default Input;