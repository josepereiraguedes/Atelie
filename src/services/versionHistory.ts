import { Product, Client, Transaction, Category, Supplier } from '../contexts/LocalDatabaseContext';

// Interface para uma versão dos dados
export interface DataVersion {
  id: string;
  timestamp: string;
  versionName: string;
  description: string;
  data: {
    products: Product[];
    clients: Client[];
    transactions: Transaction[];
    categories: Category[];
    suppliers: Supplier[];
  };
}

/**
 * Serviço para gerenciamento de histórico de versões dos dados
 */
class VersionHistoryService {
  private static instance: VersionHistoryService;
  private readonly STORAGE_KEY = 'data-versions';
  private readonly MAX_VERSIONS = 20; // Número máximo de versões para manter

  private constructor() {}

  /**
   * Obtém a instância singleton do serviço
   * @returns Instância do VersionHistoryService
   */
  static getInstance(): VersionHistoryService {
    if (!VersionHistoryService.instance) {
      VersionHistoryService.instance = new VersionHistoryService();
    }
    return VersionHistoryService.instance;
  }

  /**
   * Cria uma nova versão dos dados atuais
   * @param versionName Nome da versão
   * @param description Descrição da versão
   * @param userId ID do usuário (opcional)
   * @returns ID da versão criada
   */
  createVersion(versionName: string, description: string, userId?: string): string {
    try {
      // Obter dados atuais do localStorage
      const products = this.getFromLocalStorage<Product[]>(`products_${userId || 'default'}`, []);
      const clients = this.getFromLocalStorage<Client[]>(`clients_${userId || 'default'}`, []);
      const transactions = this.getFromLocalStorage<Transaction[]>(`transactions_${userId || 'default'}`, []);
      const categories = this.getFromLocalStorage<Category[]>(`categories_${userId || 'default'}`, []);
      const suppliers = this.getFromLocalStorage<Supplier[]>(`suppliers_${userId || 'default'}`, []);
      
      // Criar objeto de versão
      const version: DataVersion = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        versionName,
        description,
        data: {
          products,
          clients,
          transactions,
          categories,
          suppliers
        }
      };
      
      // Salvar versão no histórico
      const versions = this.getVersions();
      versions.unshift(version);
      
      // Limitar o número de versões
      if (versions.length > this.MAX_VERSIONS) {
        versions.splice(this.MAX_VERSIONS);
      }
      
      // Salvar no localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
      
      console.log(`✅ Versão "${versionName}" criada com sucesso`);
      return version.id;
    } catch (error) {
      console.error('❌ Erro ao criar versão:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as versões disponíveis
   * @returns Array de versões
   */
  getVersions(): DataVersion[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao obter versões:', error);
      return [];
    }
  }

  /**
   * Obtém uma versão específica pelo ID
   * @param id ID da versão
   * @returns Versão encontrada ou null
   */
  getVersionById(id: string): DataVersion | null {
    try {
      const versions = this.getVersions();
      return versions.find(version => version.id === id) || null;
    } catch (error) {
      console.error('❌ Erro ao obter versão por ID:', error);
      return null;
    }
  }

  /**
   * Remove uma versão específica
   * @param id ID da versão a ser removida
   */
  removeVersion(id: string): void {
    try {
      const versions = this.getVersions();
      const filteredVersions = versions.filter(version => version.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredVersions));
      console.log(`✅ Versão com ID ${id} removida com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao remover versão:', error);
      throw error;
    }
  }

  /**
   * Limpa todo o histórico de versões
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Histórico de versões limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar histórico de versões:', error);
      throw error;
    }
  }

  /**
   * Restaura uma versão específica
   * @param id ID da versão a ser restaurada
   * @param userId ID do usuário (opcional)
   */
  restoreVersion(id: string, userId?: string): void {
    try {
      const version = this.getVersionById(id);
      if (!version) {
        throw new Error(`Versão com ID ${id} não encontrada`);
      }
      
      // Salvar dados atuais como backup antes de restaurar
      this.createVersion(
        `Backup antes de restaurar ${version.versionName}`, 
        `Backup automático criado antes de restaurar a versão "${version.versionName}"`,
        userId
      );
      
      // Restaurar dados da versão
      const userIdOrDefault = userId || 'default';
      this.saveToLocalStorage(`products_${userIdOrDefault}`, version.data.products);
      this.saveToLocalStorage(`clients_${userIdOrDefault}`, version.data.clients);
      this.saveToLocalStorage(`transactions_${userIdOrDefault}`, version.data.transactions);
      this.saveToLocalStorage(`categories_${userIdOrDefault}`, version.data.categories);
      this.saveToLocalStorage(`suppliers_${userIdOrDefault}`, version.data.suppliers);
      
      console.log(`✅ Versão "${version.versionName}" restaurada com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao restaurar versão:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do histórico de versões
   * @returns Estatísticas do histórico
   */
  getStatistics(): {
    totalVersions: number;
    oldestVersion: string | null;
    newestVersion: string | null;
    totalDataSize: number;
  } {
    try {
      const versions = this.getVersions();
      
      let totalSize = 0;
      versions.forEach(version => {
        totalSize += JSON.stringify(version).length;
      });
      
      return {
        totalVersions: versions.length,
        oldestVersion: versions.length > 0 ? versions[versions.length - 1].timestamp : null,
        newestVersion: versions.length > 0 ? versions[0].timestamp : null,
        totalDataSize: totalSize
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalVersions: 0,
        oldestVersion: null,
        newestVersion: null,
        totalDataSize: 0
      };
    }
  }

  /**
   * Gera um ID único
   * @returns ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtém dados do localStorage com valor padrão
   * @param key Chave do localStorage
   * @param defaultValue Valor padrão
   * @returns Dados do localStorage ou valor padrão
   */
  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Salva dados no localStorage
   * @param key Chave do localStorage
   * @param value Valor a ser salvo
   */
  private saveToLocalStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const versionHistoryService = VersionHistoryService.getInstance();