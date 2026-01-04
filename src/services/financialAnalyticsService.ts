import { Transaction } from '@/shared/types/database.types';

interface Product {
    id: number;
    name: string;
    cost?: number;
    category?: string;
}

/**
 * Serviço centralizado para cálculos financeiros e análises de rentabilidade.
 * Segue o princípio DRY para garantir que as regras de negócio financeiras
 * sejam idênticas em todo o sistema.
 */
export const financialAnalyticsService = {
    /**
     * Calcula o lucro líquido de uma transação específica deduzindo custos e taxas.
     */
    calculateTransactionNetProfit(
        transaction: Transaction,
        products: Product[],
        marketplaceConfigs: any[] = []
    ): {
        revenue: number;
        productCost: number;
        fees: number;
        netProfit: number;
        margin: number;
    } {
        const revenue = transaction.total;
        let productCost = 0;

        // Calcular custo dos produtos vendidos
        if (transaction.items) {
            transaction.items.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                    productCost += (product.cost || 0) * item.quantity;
                }
            });
        }

        // Calcular taxas (reais ou estimadas)
        let fees = transaction.channel_fees || 0;

        // Se não houver taxas registradas e não for Loja Física, estima
        if (fees === 0 && transaction.channel && transaction.channel !== 'Loja Física') {
            const config = marketplaceConfigs.find(c => c.name === transaction.channel);
            if (config) {
                const commission = config.commission_percentage || 0;
                const fixedFee = config.fixed_fee || 0;
                fees = (revenue * (commission / 100)) + fixedFee;
            } else {
                // Fallback genérico de 15% se não encontrar config
                fees = revenue * 0.15;
            }
        }

        const netProfit = revenue - productCost - fees;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
            revenue,
            productCost,
            fees,
            netProfit,
            margin
        };
    },

    /**
     * Classifica produtos em Curva ABC (A: 70%, B: 20%, C: 10% do lucro total)
     */
    calculateABCCurve(
        transactions: Transaction[],
        products: Product[],
        marketplaceConfigs: any[] = []
    ): any[] {
        const productStats: Record<number, {
            id: number;
            name: string;
            category: string;
            revenue: number;
            totalProfit: number;
            salesCount: number;
        }> = {};

        transactions
            .filter(t => t.type === 'sale' && t.payment_status === 'paid')
            .forEach(t => {
                if (!t.items) return;

                t.items.forEach(item => {
                    const product = products.find(p => p.id === item.product_id);
                    if (!product) return;

                    if (!productStats[product.id]) {
                        productStats[product.id] = {
                            id: product.id,
                            name: product.name,
                            category: product.category || 'Geral',
                            revenue: 0,
                            totalProfit: 0,
                            salesCount: 0
                        };
                    }

                    const stats = productStats[product.id];
                    const itemRevenue = item.total;
                    const itemCost = (product.cost || 0) * item.quantity;

                    // Taxa proporcional ao item na transação
                    const itemFees = t.channel_fees
                        ? (t.channel_fees * (item.total / t.total))
                        : (itemRevenue * 0.15); // Fallback

                    stats.revenue += itemRevenue;
                    stats.totalProfit += (itemRevenue - itemCost - itemFees);
                    stats.salesCount += item.quantity;
                });
            });

        const sorted = Object.values(productStats).sort((a, b) => b.totalProfit - a.totalProfit);
        const totalProfitSum = sorted.reduce((sum, p) => sum + Math.max(0, p.totalProfit), 0);
        let accumulatedProfit = 0;

        return sorted.map(p => {
            accumulatedProfit += Math.max(0, p.totalProfit);
            const percentage = totalProfitSum > 0 ? (accumulatedProfit / totalProfitSum) * 100 : 0;

            let classification: 'A' | 'B' | 'C' = 'C';
            if (percentage <= 70) classification = 'A';
            else if (percentage <= 90) classification = 'B';

            return {
                ...p,
                margin: p.revenue > 0 ? (p.totalProfit / p.revenue) * 100 : 0,
                classification
            };
        });
    },

    /**
     * Gera dados para o gráfico Burn-up (Faturamento vs Ponto de Equilíbrio)
     */
    getBurnUpData(transactions: any[], fixedCosts: number = 3000): any {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        // Filtrar transações do mês atual
        const currentMonthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        });

        const dailyRevenue: number[] = new Array(daysInMonth).fill(0);
        currentMonthTransactions.forEach(t => {
            const day = new Date(t.date).getDate();
            dailyRevenue[day - 1] += t.total;
        });

        let cumulativeRevenue = 0;
        const burnUpSeries = dailyRevenue.map((rev, i) => {
            cumulativeRevenue += rev;
            return {
                day: i + 1,
                revenue: cumulativeRevenue,
                target: fixedCosts,
                isProfitDay: cumulativeRevenue >= fixedCosts
            };
        });

        const profitDay = burnUpSeries.find(s => s.revenue >= fixedCosts)?.day || null;

        // Projeção simples baseada na média diária atual
        const currentDay = now.getDate();
        const avgDaily = currentDay > 0 ? cumulativeRevenue / currentDay : 0;
        const projection = cumulativeRevenue + (avgDaily * (daysInMonth - currentDay));

        return {
            series: burnUpSeries,
            profitDay,
            currentTotal: cumulativeRevenue,
            target: fixedCosts,
            projection,
            status: cumulativeRevenue >= fixedCosts ? 'profitable' : 'burning'
        };
    }
};
