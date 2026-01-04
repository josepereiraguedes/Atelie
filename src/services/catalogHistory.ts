import { CatalogTheme, CatalogLayout, CatalogProduct, WatermarkConfig } from '@/shared/types/database.types';

/**
 * Serviço de gerenciamento de histórico de catálogos
 * Armazena catálogos gerados para reutilização
 */

export interface CatalogHistoryItem {
    id: string;
    title: string;
    theme: CatalogTheme;
    layout: CatalogLayout;
    products: CatalogProduct[];
    blobUrl: string; // ObjectURL temporário
    createdAt: number;
    sentCount: number;
    watermark?: WatermarkConfig;
}

export interface CatalogTemplate {
    id: string;
    name: string;
    theme: CatalogTheme;
    titlePattern: string;
    watermark?: WatermarkConfig;
    isSystem: boolean;
}

class CatalogHistoryService {
    private readonly HISTORY_KEY = 'catalog_history';
    private readonly TEMPLATES_KEY = 'catalog_templates';
    private readonly MAX_HISTORY = 50;
    private readonly DB_NAME = 'CatalogDB';
    private readonly STORE_NAME = 'catalogs';
    private db: IDBDatabase | null = null;

    constructor() {
        this.initDB();
        this.initSystemTemplates();
    }

    /**
     * Inicializa IndexedDB para armazenar blobs
     */
    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Salva catálogo no histórico
     */
    async saveCatalog(
        title: string,
        theme: CatalogTheme,
        layout: CatalogLayout,
        products: CatalogProduct[],
        blob: Blob,
        watermark?: WatermarkConfig
    ): Promise<string> {
        const id = `catalog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Salvar blob no IndexedDB
        await this.saveBlobToDB(id, blob);

        // Criar item de histórico
        const item: CatalogHistoryItem = {
            id,
            title,
            theme,
            layout,
            products,
            blobUrl: '', // Será gerado quando necessário
            createdAt: Date.now(),
            sentCount: 0,
            watermark
        };

        // Salvar metadados no localStorage
        const history = this.getHistory();
        history.unshift(item);

        // Manter apenas os últimos MAX_HISTORY
        if (history.length > this.MAX_HISTORY) {
            const removed = history.splice(this.MAX_HISTORY);
            // Remover blobs antigos do IndexedDB
            removed.forEach(item => this.deleteBlobFromDB(item.id));
        }

        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        return id;
    }

    /**
     * Recupera histórico de catálogos
     */
    getHistory(): CatalogHistoryItem[] {
        const data = localStorage.getItem(this.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Recupera blob de um catálogo
     */
    async getCatalogBlob(id: string): Promise<Blob | null> {
        if (!this.db) await this.initDB();

        return new Promise((resolve) => {
            if (!this.db) return resolve(null);

            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result?.blob || null);
            };
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Incrementa contador de envios
     */
    incrementSentCount(id: string): void {
        const history = this.getHistory();
        const item = history.find(h => h.id === id);
        if (item) {
            item.sentCount++;
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        }
    }

    /**
     * Deleta catálogo do histórico
     */
    async deleteCatalog(id: string): Promise<void> {
        const history = this.getHistory();
        const filtered = history.filter(h => h.id !== id);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
        await this.deleteBlobFromDB(id);
    }

    /**
     * Limpa todo o histórico
     */
    async clearHistory(): Promise<void> {
        const history = this.getHistory();
        for (const item of history) {
            await this.deleteBlobFromDB(item.id);
        }
        localStorage.removeItem(this.HISTORY_KEY);
    }

    // ============ TEMPLATES ============

    /**
     * Inicializa templates do sistema
     */
    private initSystemTemplates(): void {
        const existing = this.getTemplates();
        if (existing.length > 0) return;

        const systemTemplates: CatalogTemplate[] = [
            {
                id: 'tpl_ofertas',
                name: 'Ofertas da Semana',
                theme: 'vibrant',
                titlePattern: 'OFERTAS DA SEMANA',
                isSystem: true
            },
            {
                id: 'tpl_black',
                name: 'Black Friday',
                theme: 'black-friday',
                titlePattern: 'BLACK FRIDAY',
                isSystem: true
            },
            {
                id: 'tpl_natal',
                name: 'Natal',
                theme: 'christmas',
                titlePattern: 'NATAL',
                isSystem: true
            },
            {
                id: 'tpl_elegante',
                name: 'Premium',
                theme: 'elegant',
                titlePattern: 'COLEÇÃO PREMIUM',
                isSystem: true
            }
        ];

        localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(systemTemplates));
    }

    /**
     * Recupera todos os templates
     */
    getTemplates(): CatalogTemplate[] {
        const data = localStorage.getItem(this.TEMPLATES_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Salva novo template
     */
    saveTemplate(template: Omit<CatalogTemplate, 'id' | 'isSystem'>): string {
        const id = `tpl_${Date.now()}`;
        const newTemplate: CatalogTemplate = {
            ...template,
            id,
            isSystem: false
        };

        const templates = this.getTemplates();
        templates.push(newTemplate);
        localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
        return id;
    }

    /**
     * Deleta template (apenas customizados)
     */
    deleteTemplate(id: string): void {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === id);

        if (template && !template.isSystem) {
            const filtered = templates.filter(t => t.id !== id);
            localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(filtered));
        }
    }

    /**
     * Recupera template por ID
     */
    getTemplate(id: string): CatalogTemplate | null {
        const templates = this.getTemplates();
        return templates.find(t => t.id === id) || null;
    }

    // ============ HELPERS PRIVADOS ============

    private async saveBlobToDB(id: string, blob: Blob): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('DB not initialized'));

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put({ id, blob });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async deleteBlobFromDB(id: string): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve) => {
            if (!this.db) return resolve();

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    }
}

export const catalogHistoryService = new CatalogHistoryService();
