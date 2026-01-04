// Utilitário para carregar variáveis de ambiente
export const getEnvVar = (name: string): string | undefined => {
  // Primeiro tentar import.meta.env (para Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name] as string;
  }
  
  // Depois tentar process.env (para Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  
  // Se não encontrar, retornar undefined
  return undefined;
};

export const getAppConfig = () => {
  const appTitle = getEnvVar('VITE_APP_TITLE') || 'Sistema de Gestão de Estoque';
  
  return {
    appTitle
  };
};