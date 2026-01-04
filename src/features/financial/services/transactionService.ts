import { Transaction, FinancialSummary, FixedCost } from '@/shared/types';

export const transactionService = {
    /**
     * Calcula o resumo financeiro com base em uma lista de transações e custos fixos
     */
    calculateFinancialSummary: (transactions: Transaction[], fixedCosts: FixedCost[] = []): FinancialSummary => {
        // Calcular vendas totais (apenas transações de venda pagas)
        const totalSales = transactions
            .filter(t => t.type === 'sale' && t.payment_status === 'paid')
            .reduce((sum, t) => sum + t.total, 0);

        // Calcular compras totais (apenas transações de compra)
        const totalPurchases = transactions
            .filter(t => t.type === 'purchase')
            .reduce((sum, t) => sum + t.total, 0);

        // Calcular despesas totais (ajustes negativos)
        const totalExpenses = transactions
            .filter(t => t.type === 'adjustment' && t.total < 0)
            .reduce((sum, t) => sum + Math.abs(t.total), 0);

        // Somar custos fixos cadastrados
        const totalFixedCosts = fixedCosts.reduce((sum, fc) => sum + fc.value, 0);

        // Calcular lucro líquido total (Vendas - Compras - Ajustes - Custos Fixos)
        const netProfit = totalSales - totalPurchases - totalExpenses - totalFixedCosts;

        // Calcular Margem de Contribuição Média (Simplificada para cálculo de Break Even)
        // Se não houver vendas, assumimos uma margem conservadora de 30% ou baseada em dados reais se possível
        const averageContributionMargin = totalSales > 0
            ? (totalSales - totalPurchases - totalExpenses) / totalSales
            : 0.3; // Fallback para 30%

        // Ponto de Equilíbrio = Custos Fixos / Margem de Contribuição
        const breakEvenPoint = averageContributionMargin > 0
            ? totalFixedCosts / averageContributionMargin
            : totalFixedCosts / 0.3;

        // Contar vendas (apenas transações de venda pagas)
        const salesCount = transactions
            .filter(t => t.type === 'sale' && t.payment_status === 'paid')
            .length;

        // Contar compras (apenas transações de compra)
        const purchasesCount = transactions
            .filter(t => t.type === 'purchase')
            .length;

        return {
            totalSales,
            totalPurchases,
            totalExpenses,
            totalFixedCosts,
            netProfit,
            salesCount,
            purchasesCount,
            breakEvenPoint
        };
    },

    /**
     * Calcula o custo real das vendas com base no custo atual dos produtos
     */
    calculateActualSalesCosts: (sales: Transaction[], products: any[]): number => {
        let costs = 0;
        sales.forEach(transaction => {
            if (transaction.items && transaction.items.length > 0) {
                transaction.items.forEach(item => {
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        costs += (product.cost || 0) * item.quantity;
                    }
                });
            } else if (transaction.product_id !== undefined && transaction.quantity !== undefined) {
                const product = products.find(p => p.id === transaction.product_id);
                if (product) {
                    costs += (product.cost || 0) * transaction.quantity;
                }
            }
        });
        return costs;
    },

    /**
     * Calcula o custo total das compras (preço pago na transação)
     */
    calculateTotalPurchasesCosts: (purchases: Transaction[]): number => {
        let costs = 0;
        purchases.forEach(transaction => {
            if (transaction.items && transaction.items.length > 0) {
                transaction.items.forEach(item => {
                    costs += item.unit_price * item.quantity;
                });
            } else if (transaction.product_id !== undefined && transaction.quantity !== undefined && transaction.unit_price !== undefined) {
                costs += transaction.unit_price * transaction.quantity;
            }
        });
        return costs;
    },

    /**
     * Prepara os dados de uma transação garantindo integridade
     */
    prepareTransactionData: (transaction: Omit<Transaction, 'id' | 'created_at'>, clients: any[]): Transaction => {
        let clientInfo = transaction.client;

        if (!clientInfo && transaction.client_id) {
            const client = clients.find(c => c.id === transaction.client_id);
            if (client) {
                clientInfo = { name: client.name };
            }
        }

        return {
            ...transaction,
            client: clientInfo,
            created_at: new Date().toISOString()
        } as Transaction;
    },

    /**
     * Determina a transação reversiva para restaurar estoque ao deletar
     */
    getReversalTransaction: (transaction: Transaction): Transaction | null => {
        if (transaction.type === 'sale') {
            return { ...transaction, type: 'purchase' } as Transaction;
        } else if (transaction.type === 'purchase' || transaction.type === 'adjustment') {
            return { ...transaction, type: 'sale' } as Transaction;
        }
        return null;
    }
};


