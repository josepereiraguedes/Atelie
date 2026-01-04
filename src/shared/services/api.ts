import axios from 'axios';
import { Product } from '@/shared/types';
import { Client, Supplier } from '@/shared/types';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiService = {
    // Produtos
    getProducts: async (): Promise<Product[]> => {
        const response = await api.get('/products');
        return response.data;
    },

    createProduct: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
        const response = await api.post('/products', product);
        return response.data;
    },

    updateProduct: async (id: number, product: Partial<Product>): Promise<Product> => {
        const response = await api.put(`/products/${id}`, product);
        return response.data;
    },

    deleteProduct: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },

    // Clientes
    getClients: async (): Promise<Client[]> => {
        const response = await api.get('/clients');
        return response.data;
    },

    createClient: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
        const response = await api.post('/clients', client);
        return response.data;
    },

    updateClient: async (id: number, client: Partial<Client>): Promise<Client> => {
        const response = await api.put(`/clients/${id}`, client);
        return response.data;
    },

    deleteClient: async (id: number): Promise<void> => {
        await api.delete(`/clients/${id}`);
    },

    // Fornecedores
    getSuppliers: async (): Promise<Supplier[]> => {
        const response = await api.get('/suppliers');
        return response.data;
    },

    createSupplier: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> => {
        const response = await api.post('/suppliers', supplier);
        return response.data;
    },

    updateSupplier: async (id: number, supplier: Partial<Supplier>): Promise<Supplier> => {
        const response = await api.put(`/suppliers/${id}`, supplier);
        return response.data;
    },

    deleteSupplier: async (id: number): Promise<void> => {
        await api.delete(`/suppliers/${id}`);
    },

    // Transações
    getTransactions: async (): Promise<any[]> => {
        const response = await api.get('/transactions');
        return response.data;
    },

    createTransaction: async (transaction: any): Promise<any> => {
        const response = await api.post('/transactions', transaction);
        return response.data;
    },

    // Categorias
    getCategories: async (): Promise<any[]> => {
        const response = await api.get('/categories');
        return response.data;
    },

    // Health Check
    checkConnection: async (): Promise<boolean> => {
        try {
            await api.get('/health');
            return true;
        } catch (e) {
            return false;
        }
    },

    // Gerenciamento de Banco de Dados
    getDbStats: async (): Promise<any> => {
        const response = await api.get('/db/stats');
        return response.data;
    },

    exportDb: async (): Promise<any> => {
        const response = await api.get('/db/export');
        return response.data;
    },

    importDb: async (data: any): Promise<any> => {
        const response = await api.post('/db/import', data);
        return response.data;
    },

    // Logs de Atividade
    getLogs: async (limit?: number): Promise<any[]> => {
        const response = await api.get('/logs', { params: { limit } });
        return response.data;
    },

    createLog: async (log: any): Promise<any> => {
        const response = await api.post('/logs', log);
        return response.data;
    },

    deleteLogs: async (): Promise<void> => {
        await api.delete('/logs');
    },

    // Upload de Imagem
    uploadImage: async (base64Image: string, fileName?: string, folder?: string): Promise<{ url: string; fileName: string }> => {
        const response = await api.post('/upload', { image: base64Image, fileName, folder });
        return response.data;
    },

    // Market Spy (Inteligência de Mercado)
    searchMercadoLivre: async (query: string): Promise<any[]> => {
        const response = await api.get('/market-spy/search', { params: { q: query } });
        return response.data.results || [];
    }
};

