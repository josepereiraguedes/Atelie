import { useState } from 'react';
import toast from 'react-hot-toast';

// Definindo uma interface para erros genéricos
interface GenericError {
  message?: string;
}

interface UseFormHandlerProps<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: GenericError) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useFormHandler = <T,>({
  onSuccess,
  onError,
  successMessage = 'Dados salvos com sucesso!',
  errorMessage = 'Erro ao salvar dados'
}: UseFormHandlerProps<T> = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (submitFunction: () => Promise<T>): Promise<T | undefined> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await submitFunction();
      toast.success(successMessage);
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      // Verificar se é um erro específico do backend
      const errorMsg = err?.message || errorMessage;
      setError(errorMsg);
      toast.error(errorMsg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleSubmit,
    setLoading,
    setError
  };
};