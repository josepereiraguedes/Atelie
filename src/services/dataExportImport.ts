import { Product, Client, Transaction, Category, Supplier } from '../contexts/LocalDatabaseContext';
import { handleError } from '../utils/errorHandler';

// Interface para os dados exportados
export interface ExportedData {
  metadata: {
    exportDate: string;
    version: string;
    user: string;
    userId: string;
  };
  data: {
    products: Product[];
    clients: Client[];
    transactions: Transaction[];
    categories: Category[];  // Adicionar esta linha
    suppliers: Supplier[];   // Adicionar esta linha
  }
}

// Interface para o arquivo de backup
export interface BackupData extends ExportedData {
  metadata: {
    exportDate: string;
    version: string;
    user: string;
    userId: string;
    backupDate: string;
  }
}

/**
 * Serviço para exportação e importação de dados entre dispositivos
 */
class DataExportImportService {
  /**
   * Exporta todos os dados do usuário atual para um arquivo JSON
   * @param userId ID do usuário
   * @param userName Nome do usuário
   * @returns Blob contendo os dados exportados
   */
  async exportData(userId: string, userName: string): Promise<Blob> {
    try {
      // Obter dados do localStorage (simulando dados do banco local)
      const products = this.getFromLocalStorage<Product[]>(`products_${userId}`, []);
      const clients = this.getFromLocalStorage<Client[]>(`clients_${userId}`, []);
      const transactions = this.getFromLocalStorage<Transaction[]>(`transactions_${userId}`, []);
      const categories = this.getFromLocalStorage<Category[]>(`categories_${userId}`, []);  // Adicionar esta linha
      const suppliers = this.getFromLocalStorage<Supplier[]>(`suppliers_${userId}`, []);   // Adicionar esta linha
      
      // Criar objeto de dados exportados
      const exportedData: ExportedData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          user: userName,
          userId: userId
        },
        data: {
          products,
          clients,
          transactions,
          categories,   // Adicionar esta linha
          suppliers     // Adicionar esta linha
        }
      };
      
      // Converter para JSON e criar Blob
      const jsonData = JSON.stringify(exportedData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      return blob;
    } catch (error) {
      handleError(error, 'dataExport');
      throw error;
    }
  }
  
  /**
   * Importa dados de um arquivo JSON e atualiza o banco de dados local
   * @param file Arquivo JSON com os dados exportados
   * @param currentUserId ID do usuário atual
   * @returns Promise<void>
   */
  async importData(file: File, currentUserId: string): Promise<void> {
    try {
      // Ler o conteúdo do arquivo
      const fileContent = await this.readFileAsText(file);
      const importedData: ExportedData = JSON.parse(fileContent);
      
      // Validar dados importados
      if (!this.validateImportedData(importedData)) {
        throw new Error('Dados inválidos no arquivo importado');
      }
      
      // Criar backup dos dados atuais antes de importar
      await this.createBackup(currentUserId);
      
      // Importar dados para o localStorage
      this.saveToLocalStorage(`products_${currentUserId}`, importedData.data.products);
      this.saveToLocalStorage(`clients_${currentUserId}`, importedData.data.clients);
      this.saveToLocalStorage(`transactions_${currentUserId}`, importedData.data.transactions);
      
      console.log('✅ Dados importados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      handleError(error, 'dataImport');
      throw error;
    }
  }
  
  /**
   * Cria um backup automático dos dados atuais
   * @param userId ID do usuário
   * @returns Promise<void>
   */
  async createBackup(userId: string): Promise<void> {
    try {
      // Obter dados atuais
      const products = this.getFromLocalStorage<Product[]>(`products_${userId}`, []);
      const clients = this.getFromLocalStorage<Client[]>(`clients_${userId}`, []);
      const transactions = this.getFromLocalStorage<Transaction[]>(`transactions_${userId}`, []);
      const categories = this.getFromLocalStorage<Category[]>(`categories_${userId}`, []);  // Adicionar esta linha
      const suppliers = this.getFromLocalStorage<Supplier[]>(`suppliers_${userId}`, []);   // Adicionar esta linha
      
      // Criar objeto de backup
      const backupData: BackupData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          user: `Backup_${userId}`,
          userId: userId,
          backupDate: new Date().toISOString()
        },
        data: {
          products,
          clients,
          transactions,
          categories,   // Adicionar esta linha
          suppliers     // Adicionar esta linha
        }
      };
      
      // Salvar backup no localStorage
      const backups = this.getFromLocalStorage<BackupData[]>('backups', []);
      backups.push(backupData);
      
      // Manter apenas os últimos 5 backups
      if (backups.length > 5) {
        backups.shift();
      }
      
      this.saveToLocalStorage('backups', backups);
      
      console.log('✅ Backup criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      handleError(error, 'backup');
      throw error;
    }
  }
  
  /**
   * Obtém a lista de backups disponíveis
   * @returns Array de backups
   */
  getBackups(): BackupData[] {
    try {
      return this.getFromLocalStorage<BackupData[]>('backups', []);
    } catch (error) {
      console.error('❌ Erro ao obter backups:', error);
      return [];
    }
  }
  
  /**
   * Restaura um backup específico
   * @param backup Backup a ser restaurado
   * @param userId ID do usuário atual
   * @returns Promise<void>
   */
  async restoreBackup(backup: BackupData, userId: string): Promise<void> {
    try {
      // Criar backup dos dados atuais antes de restaurar
      await this.createBackup(userId);
      
      // Restaurar dados do backup
      this.saveToLocalStorage(`products_${userId}`, backup.data.products);
      this.saveToLocalStorage(`clients_${userId}`, backup.data.clients);
      this.saveToLocalStorage(`transactions_${userId}`, backup.data.transactions);
      this.saveToLocalStorage(`categories_${userId}`, backup.data.categories);  // Adicionar esta linha
      this.saveToLocalStorage(`suppliers_${userId}`, backup.data.suppliers);   // Adicionar esta linha
      
      console.log('✅ Backup restaurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      handleError(error, 'backupRestore');
      throw error;
    }
  }
  
  /**
   * Remove um backup específico
   * @param backupDate Data do backup a ser removido
   * @returns Promise<void>
   */
  removeBackup(backupDate: string): void {
    try {
      const backups = this.getFromLocalStorage<BackupData[]>('backups', []);
      const filteredBackups = backups.filter(backup => backup.metadata.backupDate !== backupDate);
      this.saveToLocalStorage('backups', filteredBackups);
      
      console.log('✅ Backup removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover backup:', error);
      handleError(error, 'backupRemove');
      throw error;
    }
  }
  
  /**
   * Lê o conteúdo de um arquivo como texto
   * @param file Arquivo a ser lido
   * @returns Promise<string>
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  }
  
  /**
   * Valida os dados importados
   * @param data Dados a serem validados
   * @returns boolean
   */
  private validateImportedData(data: ExportedData): boolean {
    try {
      // Verificar se os dados básicos existem
      if (!data.metadata || !data.data) {
        return false;
      }
      
      // Verificar se os arrays de dados existem
      if (!Array.isArray(data.data.products) || 
          !Array.isArray(data.data.clients) || 
          !Array.isArray(data.data.transactions)) {
        return false;
      }
      
      // Validar estrutura básica dos produtos
      for (const product of data.data.products) {
        if (!product.name || typeof product.cost !== 'number' || typeof product.sale_price !== 'number') {
          return false;
        }
      }
      
      // Validar estrutura básica dos clientes
      for (const client of data.data.clients) {
        if (!client.name) {
          return false;
        }
      }
      
      // Validar estrutura básica das transações
      for (const transaction of data.data.transactions) {
        if (!transaction.type || !transaction.quantity || typeof transaction.unit_price !== 'number') {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Obtém dados do localStorage com valor padrão
   * @param key Chave do localStorage
   * @param defaultValue Valor padrão
   * @returns T
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
   * @returns void
   */
  private saveToLocalStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      handleError(error, 'localStorage');
      throw error;
    }
  }
}

// Instância singleton do serviço
export const dataExportImportService = new DataExportImportService();