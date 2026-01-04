import { Transaction, TransactionItem } from '@/shared/types';
import { Client } from '@/shared/types';

export interface RelationshipAction {
    clientId: number;
    clientName: string;
    phone: string;
    lastPurchaseDate: string;
    daysSince: number;
    type: 'satisfaction' | 'reposição' | 'fidelização';
    suggestion: string;
    message: string;
}

export const crmRelationshipService = {
    /**
     * Gera a régua de ações baseada nos dias decorridos desde a última compra
     */
    getRelationshipActions(clients: Client[], transactions: Transaction[]): RelationshipAction[] {
        const now = new Date();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const actions: RelationshipAction[] = [];

        // Filtrar apenas vendas pagas
        const sales = transactions.filter(t => t.type === 'sale' && t.payment_status === 'paid' && t.client_id);

        clients.forEach(client => {
            if (!client.id) return;

            // Pegar a última venda desse cliente
            const clientSales = sales.filter(s => s.client_id === client.id)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            if (clientSales.length === 0) return;

            const lastSale = clientSales[0];
            const lastDate = new Date(lastSale.created_at);
            const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / MS_PER_DAY);

            // Janelas da Régua
            if (diffDays === 7) {
                actions.push({
                    clientId: client.id,
                    clientName: client.name,
                    phone: client.phone || '',
                    lastPurchaseDate: lastSale.created_at,
                    daysSince: diffDays,
                    type: 'satisfaction',
                    suggestion: 'Follow-up de Satisfação',
                    message: `Olá ${client.name}! Faz uma semana da sua última compra. Passando para saber se deu tudo certo e se você gostou dos produtos! Sua opinião é muito importante.`
                });
            } else if (diffDays === 15) {
                actions.push({
                    clientId: client.id,
                    clientName: client.name,
                    phone: client.phone || '',
                    lastPurchaseDate: lastSale.created_at,
                    daysSince: diffDays,
                    type: 'reposição',
                    suggestion: 'Sugestão de Reposição',
                    message: `Oi ${client.name}! Notamos que faz 15 dias da sua compra. Lembramos que alguns produtos podem estar acabando. Gostaria de repor algo para não ficar sem?`
                });
            } else if (diffDays === 30) {
                actions.push({
                    clientId: client.id,
                    clientName: client.name,
                    phone: client.phone || '',
                    lastPurchaseDate: lastSale.created_at,
                    daysSince: diffDays,
                    type: 'fidelização',
                    suggestion: 'Cupom Saudades',
                    message: `Olá ${client.name}! Faz um mês que não nos vemos. Para celebrar nossa parceria, preparei um mimo exclusivo para sua próxima visita. Que tal conferir as novidades de hoje?`
                });
            }
        });

        return actions;
    }
};


