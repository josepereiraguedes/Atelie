import React, { memo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import SelectField from './SelectField';

interface SelectMarketplaceProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeEmptyOption?: boolean;
}

const SelectMarketplace: React.FC<SelectMarketplaceProps> = memo(({
  value,
  onChange,
  placeholder = 'Selecione um marketplace',
  disabled = false,
  className = '',
  includeEmptyOption = true
}) => {
  const { marketplaceConfigs } = useLocalDatabase();
  
  const options = marketplaceConfigs.map(config => ({
    value: config.name,
    label: config.name
  }));
  
  // Adicionar opção vazia se solicitado
  if (includeEmptyOption) {
    options.unshift({ value: '', label: placeholder });
  }
  
  return (
    <SelectField
      value={value}
      onChange={(val) => onChange(val as string)}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
});

export default SelectMarketplace;
