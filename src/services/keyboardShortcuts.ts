import { handleError } from '../utils/errorHandler';

// Interface para um atalho de teclado
export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

// Interface para as preferências de atalhos
export interface ShortcutPreferences {
  enableShortcuts: boolean;
  customShortcuts: Record<string, string>; // key -> action
}

/**
 * Serviço para gerenciamento de atalhos de teclado
 */
class KeyboardShortcutsService {
  private static instance: KeyboardShortcutsService;
  private shortcuts: KeyboardShortcut[] = [];
  private enabled = true;

  private constructor() {}

  /**
   * Obtém a instância singleton do serviço
   * @returns Instância do KeyboardShortcutsService
   */
  static getInstance(): KeyboardShortcutsService {
    if (!KeyboardShortcutsService.instance) {
      KeyboardShortcutsService.instance = new KeyboardShortcutsService();
    }
    return KeyboardShortcutsService.instance;
  }

  /**
   * Registra um novo atalho de teclado
   * @param shortcut Atalho a ser registrado
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
  }

  /**
   * Remove um atalho de teclado
   * @param id ID do atalho a ser removido
   */
  unregisterShortcut(id: string): void {
    this.shortcuts = this.shortcuts.filter(shortcut => shortcut.id !== id);
  }

  /**
   * Habilita ou desabilita os atalhos
   * @param enabled Status dos atalhos
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Verifica se os atalhos estão habilitados
   * @returns true se os atalhos estão habilitados
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Manipula eventos de teclado
   * @param event Evento de teclado
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Verificar se algum atalho corresponde ao evento
    for (const shortcut of this.shortcuts) {
      if (this.matchesShortcut(event, shortcut)) {
        event.preventDefault();
        try {
          shortcut.action();
        } catch (error) {
          console.error('Erro ao executar atalho:', error);
          handleError(error, 'keyboardShortcuts');
        }
        break;
      }
    }
  }

  /**
   * Verifica se um evento de teclado corresponde a um atalho
   * @param event Evento de teclado
   * @param shortcut Atalho a ser verificado
   * @returns true se o evento corresponde ao atalho
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    // Verificar tecla principal
    if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
      return false;
    }

    // Verificar modificadores
    if ((shortcut.ctrl && !event.ctrlKey) || (!shortcut.ctrl && event.ctrlKey)) {
      return false;
    }

    if ((shortcut.shift && !event.shiftKey) || (!shortcut.shift && event.shiftKey)) {
      return false;
    }

    if ((shortcut.alt && !event.altKey) || (!shortcut.alt && event.altKey)) {
      return false;
    }

    return true;
  }

  /**
   * Obtém todos os atalhos registrados
   * @returns Array de atalhos
   */
  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  /**
   * Limpa todos os atalhos registrados
   */
  clearShortcuts(): void {
    this.shortcuts = [];
  }
}

// Exportar instância singleton
export const keyboardShortcutsService = KeyboardShortcutsService.getInstance();