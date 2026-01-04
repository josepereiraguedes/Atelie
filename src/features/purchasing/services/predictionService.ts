import { Transaction } from '@/shared/types';

interface Product {
    id: number;
    name: string;
    sale_price: number;
    quantity: number;
    image?: string;
}

/**
 * Serviço de Predição e Inteligência de Dados.
 * Lida com análise de padrões de compra, recomendações e detecção de churn.
 */
export const predictionService = {
    /**
     * Identifica produtos que costumam ser comprados juntos com os itens atuais do carrinho.
     * Utiliza uma lógica simples de co-ocorrência baseada no histórico de transações.
     */
    getRecommendations(
        currentCartProductIds: number[],
        allTransactions: Transaction[],
        allProducts: Product[],
        limit: number = 4
    ): Product[] {
        if (currentCartProductIds.length === 0) return [];

        const coOccurrenceMap: Record<number, number> = {};

        // Filtrar transações de venda pagas que contêm pelo menos um dos produtos do carrinho
        allTransactions
            .filter(t => t.type === 'sale' && t.payment_status === 'paid' && t.items)
            .forEach(t => {
                const transactionProductIds = t.items!.map(item => item.product_id);

                // Se a transação contém algum dos produtos do carrinho
                const hasMatch = currentCartProductIds.some(id => transactionProductIds.includes(id));

                if (hasMatch) {
                    // Contabilizar outros produtos nesta transação que NÃO estão no carrinho atual
                    transactionProductIds.forEach(id => {
                        if (!currentCartProductIds.includes(id)) {
                            coOccurrenceMap[id] = (coOccurrenceMap[id] || 0) + 1;
                        }
                    });
                }
            });

        // Ordenar por frequência de ocorrência
        const recommendedIds = Object.entries(coOccurrenceMap)
            .sort(([, freqA], [, freqB]) => freqB - freqA)
            .slice(0, limit)
            .map(([id]) => Number(id));

        // Retornar os objetos de produto correspondentes
        return recommendedIds
            .map(id => allProducts.find(p => p.id === id))
            .filter((p): p is Product => !!p && (p.quantity > 0)); // Apenas produtos em estoque
    },

    /**
     * Detecta clientes com risco de churn (evasão) baseado no comportamento de compra.
     * Risco: Clientes cujo tempo desde a última compra > 1.5 * intervalo médio de compra.
     */
    detectChurnRisk(
        transactions: Transaction[],
        clients: any[], // Tipado como any para flexibilidade, mas segue interface Client
    ) {
        const now = new Date().getTime();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        // Agrupar transações por cliente
        const clientTransactions: Record<number, number[]> = {};
        transactions
            .filter(t => t.type === 'sale' && t.payment_status === 'paid' && t.client_id)
            .forEach(t => {
                if (!clientTransactions[t.client_id!]) clientTransactions[t.client_id!] = [];
                clientTransactions[t.client_id!].push(new Date(t.created_at).getTime());
            });

        return clients.map(client => {
            const dates = clientTransactions[client.id] || [];
            if (dates.length < 2) return { ...client, churnRisk: 'vago' };

            const sortedDates = dates.sort((a, b) => a - b);
            const intervals: number[] = [];
            for (let i = 1; i < sortedDates.length; i++) {
                intervals.push((sortedDates[i] - sortedDates[i - 1]) / MS_PER_DAY);
            }

            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const daysSinceLast = (now - sortedDates[sortedDates.length - 1]) / MS_PER_DAY;

            let risk: 'baixo' | 'médio' | 'alto' = 'baixo';
            if (daysSinceLast > avgInterval * 2) risk = 'alto';
            else if (daysSinceLast > avgInterval * 1.5) risk = 'médio';

            return {
                ...client,
                avgInterval: Math.round(avgInterval),
                daysSinceLast: Math.round(daysSinceLast),
                churnRisk: risk
            };
        }).filter(c => c.churnRisk === 'alto' || c.churnRisk === 'médio');
    }
};


