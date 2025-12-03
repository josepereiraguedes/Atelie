/**
 * Error handling utility for consistent error management throughout the application
 */

import { logger } from './logger';
import toast from 'react-hot-toast';

/**
 * Base application error class
 */
export class AppError extends Error {
  /**
   * Create an AppError
   * @param message - Error message
   * @param code - Optional error code
   * @param context - Optional context where the error occurred
   * @param originalError - Optional original error that caused this error
   */
  constructor(
    message: string,
    public code?: string,
    public context?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Database-related error class
 */
export class DatabaseError extends AppError {
  /**
   * Create a DatabaseError
   * @param message - Error message
   * @param code - Optional error code
   * @param context - Optional context where the error occurred
   * @param originalError - Optional original error that caused this error
   */
  constructor(
    message: string,
    code?: string,
    context?: string,
    originalError?: Error
  ) {
    super(message, code, context, originalError);
    this.name = 'DatabaseError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  /**
   * Create a ValidationError
   * @param message - Error message
   * @param code - Optional error code
   * @param context - Optional context where the error occurred
   * @param originalError - Optional original error that caused this error
   */
  constructor(
    message: string,
    code?: string,
    context?: string,
    originalError?: Error
  ) {
    super(message, code, context, originalError);
    this.name = 'ValidationError';
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  /**
   * Create a NetworkError
   * @param message - Error message
   * @param code - Optional error code
   * @param context - Optional context where the error occurred
   * @param originalError - Optional original error that caused this error
   */
  constructor(
    message: string,
    code?: string,
    context?: string,
    originalError?: Error
  ) {
    super(message, code, context, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Handle errors consistently across the application
 * @param error - The error to handle
 * @param context - Optional context where the error occurred
 * @param showToast - Whether to show a toast notification (default: true)
 * @param showLog - Whether to log the error (default: true)
 * @returns The normalized AppError
 */
export const handleError = (
  error: unknown,
  context?: string,
  showToast: boolean = true,
  showLog: boolean = true
): AppError => {
  // Normalize the error
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, undefined, context, error);
  } else {
    appError = new AppError(String(error), undefined, context);
  }

  // Add context if provided and not already set
  if (context && !appError.context) {
    appError.context = context;
  }

  // Log the error
  if (showLog) {
    logger.error(
      appError.message,
      appError.context,
      appError.originalError,
      {
        code: appError.code,
        name: appError.name
      }
    );
  }

  // Show toast notification
  if (showToast) {
    const userMessage = getUserFriendlyMessage(appError);
    toast.error(userMessage);
  }

  return appError;
};

/**
 * Get user-friendly error message based on error type and context
 * @param error - The error to get a user-friendly message for
 * @returns User-friendly error message
 */
const getUserFriendlyMessage = (error: AppError): string => {
  // Check for specific error codes or patterns
  if (error.code) {
    switch (error.code) {
      case '404':
        return 'Recurso não encontrado.';
      case '401':
        return 'Acesso não autorizado. Verifique suas credenciais.';
      case '403':
        return 'Acesso proibido. Você não tem permissão para realizar esta ação.';
    }
  }

  // Check for specific error types
  if (error instanceof DatabaseError) {
    return 'Ocorreu um erro no banco de dados local. Por favor, tente novamente.';
  }

  if (error instanceof NetworkError) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (error instanceof ValidationError) {
    return error.message; // Validation errors should be user-friendly already
  }

  // Generic error messages based on context
  if (error.context) {
    switch (error.context.toLowerCase()) {
      case 'product':
        return 'Erro ao processar produto. Por favor, verifique os dados e tente novamente.';
      case 'client':
        return 'Erro ao processar cliente. Por favor, verifique os dados e tente novamente.';
      case 'transaction':
        return 'Erro ao processar transação. Por favor, verifique os dados e tente novamente.';
      case 'auth':
        return 'Erro de autenticação. Por favor, faça login novamente.';
      case 'network':
        return 'Erro de conexão. Por favor, verifique sua internet e tente novamente.';
      case 'localstorage':
        return 'Erro ao acessar o armazenamento local. Por favor, verifique as permissões do navegador.';
      case 'dataexport':
        return 'Erro ao exportar dados. Por favor, tente novamente.';
      case 'dataimport':
        return 'Erro ao importar dados. Por favor, verifique o arquivo e tente novamente.';
      case 'backup':
        return 'Erro ao criar backup. Por favor, tente novamente.';
      case 'backuprestore':
        return 'Erro ao restaurar backup. Por favor, tente novamente.';
      case 'backupremove':
        return 'Erro ao remover backup. Por favor, tente novamente.';
      default:
        return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
    }
  }

  // Default message
  return 'Ocorreu um erro. Por favor, tente novamente.';
};

/**
 * Create a validation error
 * @param message - Error message
 * @param context - Optional context where the error occurred
 * @returns ValidationError instance
 */
export const createValidationError = (
  message: string,
  context?: string
): ValidationError => {
  return new ValidationError(message, 'VALIDATION_ERROR', context);
};

export default {
  handleError,
  createValidationError,
  AppError,
  DatabaseError,
  ValidationError,
  NetworkError
};