
// Ajustar imports conforme a refatoração recente
import { Transaction as ITransaction, Product as IProduct } from '@/shared/types/database.types';

export interface ABCAnalysisResult {
    classA: IProduct[]; // 20% dos produtos que representam 80% do valor
    classB: IProduct[]; // 30% dos produtos que representam 15% do valor
    classC: IProduct[]; // 50% dos produtos que representam 5% do valor
    recommendations: string[];
}

export interface StockPrediction {
    productId: number;
    productName: string;
    averageDailySales: number;
    daysOfStockLeft: number;
    suggestedRestockDate: string;
    status: 'critical' | 'warning' | 'healthy' | 'overstock';
}

export class InventoryIntelligenceService {

    /**
     * Realiza a Classificação ABC dos produtos baseada no valor de estoque (ou vendas)
     * A: Itens de alto valor/impacto
     * B: Itens de médio valor
     * C: Itens de baixo valor
     */
    analyzeABC(products: IProduct[]): ABCAnalysisResult {
        // Calcular valor total de estoque por produto
        const productValues = products.map(p => ({
            ...p,
            totalValue: p.quantity * p.cost
        })).sort((a, b) => b.totalValue - a.totalValue);

        const totalInventoryValue = productValues.reduce((acc, p) => acc + p.totalValue, 0);

        let accumulatedValue = 0;
        const classA: IProduct[] = [];
        const classB: IProduct[] = [];
        const classC: IProduct[] = [];

        productValues.forEach(p => {
            accumulatedValue += p.totalValue;
            const percentage = (accumulatedValue / totalInventoryValue) * 100;

            if (percentage <= 80) {
                classA.push(p);
            } else if (percentage <= 95) {
                classB.push(p);
            } else {
                classC.push(p);
            }
        });

        const recommendations: string[] = [];
        if (classA.length > 0) recommendations.push(`Foque na gestão rigorosa dos ${classA.length} itens da Classe A, pois representam a maior parte do capital investido.`);
        if (classC.length > productValues.length * 0.5) recommendations.push(`Considere reduzir o estoque dos itens Classe C ou vendê-los em kits para liberar espaço.`);

        return { classA, classB, classC, recommendations };
    }

    /**
     * Predição de Estoque baseada no histórico de transações
     * Calcula quando o estoque vai acabar
     */
    predictStockOut(products: IProduct[], transactions: ITransaction[], daysAnalysis = 30): StockPrediction[] {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - daysAnalysis);

        // Filtrar vendas dos últimos X dias
        const sales = transactions.filter(t =>
            t.type === 'sale' &&
            new Date(t.created_at) >= startDate
        );

        const predictions: StockPrediction[] = [];

        products.forEach(product => {
            // Calcular total vendido deste produto no período
            const productSales = sales.filter(t =>
                (t.product_id === product.id) ||
                (t.items && t.items.some(i => i.product_id === product.id))
            );

            let totalSoldQty = 0;
            productSales.forEach(t => {
                if (t.product_id === product.id) {
                    totalSoldQty += t.quantity || 0;
                }
                if (t.items) {
                    const item = t.items.find(i => i.product_id === product.id);
                    if (item) totalSoldQty += item.quantity;
                }
            });

            const avgDailySales = totalSoldQty / daysAnalysis;

            let daysLeft = 999;
            let status: 'critical' | 'warning' | 'healthy' | 'overstock' = 'healthy';

            if (avgDailySales > 0) {
                daysLeft = product.quantity / avgDailySales;
            }

            const restockDate = new Date();
            restockDate.setDate(now.getDate() + daysLeft);

            if (daysLeft <= 7) status = 'critical';
            else if (daysLeft <= 15) status = 'warning';
            else if (daysLeft > 180) status = 'overstock';

            predictions.push({
                productId: product.id,
                productName: product.name,
                averageDailySales: parseFloat(avgDailySales.toFixed(2)),
                daysOfStockLeft: Math.round(daysLeft),
                suggestedRestockDate: restockDate.toISOString(),
                status
            });
        });

        return predictions.sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft);
    }

    /**
     * Analisa a lucratividade real por produto e categoria
     */
    analyzeProfitability(products: IProduct[], transactions: ITransaction[]) {
        const sales = transactions.filter(t => t.type === 'sale');
        const profitMap: Record<number, { profit: number, revenue: number, margin: number }> = {};
        const categoryProfit: Record<string, { profit: number, revenue: number }> = {};

        sales.forEach(t => {
            const items = t.items || [{ product_id: t.product_id, quantity: t.quantity, unit_price: t.unit_price }];

            items.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (!product) return;

                const cost = product.cost || 0;
                const price = item.unit_price || 0;
                const qty = item.quantity || 0;

                const itemRevenue = price * qty;
                const itemCost = cost * qty;
                const itemProfit = itemRevenue - itemCost;

                // Produto
                if (!profitMap[product.id]) {
                    profitMap[product.id] = { profit: 0, revenue: 0, margin: 0 };
                }
                profitMap[product.id].profit += itemProfit;
                profitMap[product.id].revenue += itemRevenue;

                // Categoria
                const cat = product.category || 'Sem Categoria';
                if (!categoryProfit[cat]) {
                    categoryProfit[cat] = { profit: 0, revenue: 0 };
                }
                categoryProfit[cat].profit += itemProfit;
                categoryProfit[cat].revenue += itemRevenue;
            });
        });

        // Calcular margens e transformar em array
        const productRanking = Object.entries(profitMap).map(([id, data]) => ({
            productId: Number(id),
            name: products.find(p => p.id === Number(id))?.name || '?',
            ...data,
            margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
        })).sort((a, b) => b.profit - a.profit);

        const categoryRanking = Object.entries(categoryProfit).map(([name, data]) => ({
            name,
            ...data,
            margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
        })).sort((a, b) => b.profit - a.profit);

        return { productRanking, categoryRanking };
    }

    /**
     * Identifica produtos sem vendas há muito tempo (Estoque Parado)
     */
    analyzeDeadStock(products: IProduct[], transactions: ITransaction[], daysThreshold = 60) {
        const now = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() - daysThreshold);

        const sales = transactions.filter(t => t.type === 'sale');

        return products.filter(product => {
            // Se não tem estoque, não é estoque parado
            if (product.quantity <= 0) return false;

            // Verificar última venda
            const lastSale = sales.filter(t =>
                (t.product_id === product.id) ||
                (t.items && t.items.some(i => i.product_id === product.id))
            ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            if (!lastSale) {
                // Nunca vendido, mas cadastrado há mais de X dias?
                const createdAt = new Date(product.created_at || 0);
                return createdAt < thresholdDate;
            }

            return new Date(lastSale.created_at) < thresholdDate;
        }).map(p => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            value: p.quantity * p.cost,
            category: p.category
        })).sort((a, b) => b.value - a.value);
    }

    /**
     * Gera uma lista de compras sugerida (Pedido Ótimo)
     * Baseado na velocidade de vendas para cobrir os próximos X dias.
     */
    getSuggestedPurchaseOrders(products: IProduct[], transactions: ITransaction[], targetDays = 45): any[] {
        const predictions = this.predictStockOut(products, transactions, 30);
        const abc = this.analyzeABC(products);

        return predictions
            .filter(p => p.daysOfStockLeft <= 15 || p.status === 'critical' || p.status === 'warning')
            .map(prediction => {
                const product = products.find(prod => prod.id === prediction.productId);
                if (!product) return null;

                // Definir classe
                const isClassA = abc.classA.some(a => a.id === product.id);
                const isClassB = abc.classB.some(b => b.id === product.id);
                const classification = isClassA ? 'A' : (isClassB ? 'B' : 'C');

                // Calcular quantidade necessária para atingir o estoque alvo
                const targetQuantity = Math.ceil(prediction.averageDailySales * targetDays);
                const suggestedQty = Math.max(0, targetQuantity - product.quantity);

                if (suggestedQty <= 0) return null;

                return {
                    productId: product.id,
                    name: product.name,
                    currentStock: product.quantity,
                    avgDailySales: prediction.averageDailySales,
                    runwayDays: prediction.daysOfStockLeft,
                    suggestedQty,
                    estimatedCost: suggestedQty * (product.cost || 0),
                    classification,
                    // supplier: product.supplier // Campo ainda não existente na interface principal
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => {
                // Priorizar Classe A, depois menor Runway
                if (a!.classification !== b!.classification) return a!.classification.localeCompare(b!.classification);
                return a!.runwayDays - b!.runwayDays;
            });
    }

    /**
     * Sugere produtos ideais para ofertas de marketing
     * Baseia-se em dois pilares:
     * 1. Clearance: Estoque parado há mais de 45 dias
     * 2. Premium: Produtos com margem acima de 40%
     */
    getSuggestedOffers(products: IProduct[], transactions: ITransaction[]) {
        const deadStock = this.analyzeDeadStock(products, transactions, 45);
        const { productRanking } = this.analyzeProfitability(products, transactions);

        const clearance = deadStock.slice(0, 10).map(p => ({
            ...p,
            reason: 'Queima de Estoque (Parado)',
            priority: 'high'
        }));

        const highMargin = productRanking
            .filter(p => p.margin >= 40)
            .slice(0, 10)
            .map(p => ({
                id: p.productId,
                name: p.name,
                reason: 'Alta Lucratividade',
                priority: 'medium'
            }));

        return { clearance, highMargin };
    }
}

export const inventoryIntelligence = new InventoryIntelligenceService();
