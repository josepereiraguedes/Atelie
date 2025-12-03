import { useEffect, useCallback } from 'react';
import { keyboardShortcutsService, KeyboardShortcut } from '../services/keyboardShortcuts';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * Hook personalizado para gerenciar atalhos de teclado
 */
export const useKeyboardShortcuts = () => {
  const { preferences } = usePreferences();

  // Registrar um atalho
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    keyboardShortcutsService.registerShortcut(shortcut);
    
    // Retornar função de limpeza
    return () => {
      keyboardShortcutsService.unregisterShortcut(shortcut.id);
    };
  }, []);

  // Remover um atalho
  const unregisterShortcut = useCallback((id: string) => {
    keyboardShortcutsService.unregisterShortcut(id);
  }, []);

  // Limpar todos os atalhos
  const clearShortcuts = useCallback(() => {
    keyboardShortcutsService.clearShortcuts();
  }, []);

  // Obter todos os atalhos
  const getShortcuts = useCallback(() => {
    return keyboardShortcutsService.getShortcuts();
  }, []);

  // Efeito para habilitar/desabilitar atalhos com base nas preferências
  useEffect(() => {
    keyboardShortcutsService.setEnabled(preferences.shortcuts.enableShortcuts);
  }, [preferences.shortcuts.enableShortcuts]);

  // Efeito para adicionar/remover listener de eventos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keyboardShortcutsService.handleKeyDown(event);
    };

    // Adicionar listener
    window.addEventListener('keydown', handleKeyDown);

    // Remover listener ao desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    clearShortcuts,
    getShortcuts
  };
};