import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';

interface FormActionsProps {
  cancelPath: string;
  submitText: string;
  loading?: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
}

const FormActions: React.FC<FormActionsProps> = memo(({ 
  cancelPath, 
  submitText, 
  loading = false,
  onCancel,
  onSubmit
}) => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(cancelPath);
    }
  };

  return (
    <div className="flex justify-end space-x-3 mt-6">
      <button
        type="button"
        onClick={handleCancel}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        onClick={onSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Salvando...' : submitText}
      </button>
    </div>
  );
});

export default FormActions;