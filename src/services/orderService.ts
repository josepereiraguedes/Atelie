import { ClientQuote, PurchaseOrder, GoodsReceipt } from '@/shared/types/database.types';
import { generateUniqueId } from '@/shared/utils/idGenerator';

export const orderService = {
    /**
     * Prepara um orçamento de cliente com dados do cliente vinculados
     */
    prepareClientQuote: (quote: Omit<ClientQuote, 'id' | 'created_at' | 'updated_at'>, clients: any[]): ClientQuote => {
        const client = clients.find(c => c.id === quote.client_id);
        return {
            ...quote,
            id: generateUniqueId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            client: client ? { id: client.id, name: client.name } : undefined
        } as ClientQuote;
    },

    /**
     * Prepara um pedido de compra
     */
    preparePurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): PurchaseOrder => {
        return {
            ...order,
            id: generateUniqueId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as PurchaseOrder;
    },

    /**
     * Atualiza vínculos em cascata se necessário (Placeholder para lógica futura)
     */
    processReceipt: (receipt: GoodsReceipt): any => {
        // Lógicas de negócio específicas para quando um recebimento é processado
        return receipt;
    }
};
