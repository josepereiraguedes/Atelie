import { Transaction, Client } from '@/shared/types/database.types';
import { communicationService } from '@/features/crm/services/communicationService';

export interface RFMResult {
    clientId: number;
    clientName: string;
    recency: number;
    frequency: number;
    monetary: number; // Receita bruta
    ltv: number;      // Lucro líquido vitalício
    avgTicket: number;
    churnProbability: number; // 0 a 100
    score: number;
    segment: 'VIP' | 'Fiel' | 'Promissor' | 'Em Risco' | 'Novo' | 'Estrela';
    lastPurchaseDate: string | null;
    nextBestAction: string;
}

export interface RePurchaseAlert {
    clientId: number;
    clientName: string;
    clientPhone?: string;
    productId: number;
    productName: string;
    lastPurchaseDate: string;
    avgIntervalDays: number;
    daysSinceLastPurchase: number;
    predictedDate: string;
    status: 'crítico' | 'alerta' | 'em dia';
    waLink: string;
}

export interface BirthdayAlert {
    clientId: number;
    clientName: string;
    clientPhone?: string;
    birthday: string;
    message: string;
    waLink: string;
}

export const crmService = {
    calculateRFM(clients: Client[], transactions: Transaction[], products: any[]): RFMResult[] {
        const now = new Date();
        const sales = transactions.filter(t => t.type === 'sale' && t.payment_status === 'paid');
        const productMap = new Map(products.map(p => [p.id, p]));

        return clients.map(client => {
            const clientSales = sales.filter(t => t.client_id === client.id);

            if (clientSales.length === 0) {
                return {
                    clientId: client.id!,
                    clientName: client.name,
                    recency: 999,
                    frequency: 0,
                    monetary: 0,
                    ltv: 0,
                    avgTicket: 0,
                    churnProbability: 0,
                    score: 0,
                    segment: 'Novo',
                    lastPurchaseDate: null,
                    nextBestAction: 'Convidar para primeira compra'
                } as RFMResult;
            }

            const sortedSales = [...clientSales].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const lastSale = sortedSales[0];
            const lastDate = new Date(lastSale.created_at);
            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const recency = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const frequency = clientSales.length;
            const monetary = clientSales.reduce((sum, t) => sum + (t.total || 0), 0);

            // LTV (Lucro Real)
            let totalCost = 0;
            clientSales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        const product = productMap.get(item.product_id);
                        totalCost += (product?.cost || 0) * item.quantity;
                    });
                } else if (sale.product_id) {
                    const product = productMap.get(sale.product_id);
                    totalCost += (product?.cost || 0) * (sale.quantity || 0);
                }
            });
            const ltv = monetary - totalCost;
            const avgTicket = monetary / frequency;

            // Churn Probability (%)
            // Baseado no intervalo médio entre compras
            let churnProbability = 0;
            if (frequency >= 2) {
                const dates = clientSales.map(s => new Date(s.created_at).getTime()).sort();
                let totalInterval = 0;
                for (let i = 1; i < dates.length; i++) {
                    totalInterval += (dates[i] - dates[i - 1]);
                }
                const avgIntervalDays = (totalInterval / (dates.length - 1)) / (1000 * 60 * 60 * 24);

                if (recency > avgIntervalDays * 1.5) {
                    churnProbability = Math.min(100, (recency / (avgIntervalDays * 2)) * 100);
                }
            } else if (recency > 45) {
                churnProbability = 70; // Única compra há muito tempo
            }

            // Heurística de Segmentação Avançada
            let segment: RFMResult['segment'] = 'Promissor';
            if (churnProbability > 70) segment = 'Em Risco';
            else if (frequency >= 8 && ltv > 1000) segment = 'VIP';
            else if (frequency >= 4 && ltv > 300) segment = 'Fiel';
            else if (avgTicket > 500 && frequency >= 1) segment = 'Estrela';
            else if (recency < 10) segment = 'Promissor';

            // Next Best Action (NBA)
            let nba = 'Agradecer preferência';
            if (segment === 'Em Risco') nba = 'Oferecer cupom de reativação';
            else if (segment === 'VIP') nba = 'Apresentar lançamentos exclusivos';
            else if (segment === 'Estrela') nba = 'Oferecer kit de alto valor';
            else if (churnProbability > 40) nba = 'Verificar satisfação do último pedido';

            return {
                clientId: client.id!,
                clientName: client.name,
                recency,
                frequency,
                monetary,
                ltv,
                avgTicket,
                churnProbability: Math.round(churnProbability),
                score: (frequency * 5) + (ltv / 10) - (churnProbability / 2),
                segment,
                lastPurchaseDate: lastSale.created_at,
                nextBestAction: nba
            };
        }).sort((a, b) => b.score - a.score);
    },

    getRePurchaseAlerts(clients: Client[], transactions: Transaction[], products: any[]): RePurchaseAlert[] {
        const now = new Date();
        const sales = transactions.filter(t => t.type === 'sale' && t.payment_status === 'paid');
        const alerts: RePurchaseAlert[] = [];

        clients.forEach(client => {
            const clientSales = sales.filter(t => t.client_id === client.id);
            if (clientSales.length < 2) return;

            // Agrupar vendas por produto para este cliente
            const productHistory: Record<number, number[]> = {};
            clientSales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        if (!productHistory[item.product_id]) productHistory[item.product_id] = [];
                        productHistory[item.product_id].push(new Date(sale.created_at).getTime());
                    });
                }
            });

            Object.entries(productHistory).forEach(([prodId, dates]) => {
                const productId = Number(prodId);
                if (dates.length < 2) return;

                // Ordenar datas
                const sortedDates = dates.sort((a, b) => a - b);

                // Calcular intervalo médio
                let totalInterval = 0;
                for (let i = 1; i < sortedDates.length; i++) {
                    totalInterval += (sortedDates[i] - sortedDates[i - 1]);
                }
                const avgIntervalDays = (totalInterval / (sortedDates.length - 1)) / (1000 * 60 * 60 * 24);

                // Pular se o intervalo for muito curto (provavelmente erro de dados) ou muito longo (> 1ano)
                if (avgIntervalDays < 3 || avgIntervalDays > 365) return;

                const lastPurchaseTime = sortedDates[sortedDates.length - 1];
                const daysSinceLastPurchase = (now.getTime() - lastPurchaseTime) / (1000 * 60 * 60 * 24);

                // Gerar alerta se estiver próximo ou passou da data prevista
                // Buffer de 20% do intervalo ou 5 dias (o que for menor)
                const buffer = Math.min(5, avgIntervalDays * 0.2);

                if (daysSinceLastPurchase >= (avgIntervalDays - buffer)) {
                    const product = products.find(p => p.id === productId);
                    const predictedDate = new Date(lastPurchaseTime + (avgIntervalDays * 1000 * 60 * 60 * 24));

                    const status = daysSinceLastPurchase > (avgIntervalDays + 7) ? 'crítico' :
                        daysSinceLastPurchase >= avgIntervalDays ? 'alerta' : 'em dia';

                    if (status !== 'em dia' || daysSinceLastPurchase > 15) { // Somente alertas relevantes
                        const message = communicationService.getTemplate('recompra', {
                            name: client.name,
                            days: Math.round(daysSinceLastPurchase),
                            product: product?.name || 'Produto'
                        });
                        const waLink = `https://wa.me/${communicationService.formatPhone(client.phone || '')}?text=${encodeURIComponent(message)}`;

                        alerts.push({
                            clientId: client.id!,
                            clientName: client.name,
                            clientPhone: client.phone,
                            productId,
                            productName: product?.name || 'Produto',
                            lastPurchaseDate: new Date(lastPurchaseTime).toISOString(),
                            avgIntervalDays: Math.round(avgIntervalDays),
                            daysSinceLastPurchase: Math.round(daysSinceLastPurchase),
                            predictedDate: predictedDate.toISOString(),
                            status,
                            waLink
                        });
                    }
                }
            });
        });

        return alerts.sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase);
    },

    getBirthdayAlerts(clients: Client[]): BirthdayAlert[] {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const alerts: BirthdayAlert[] = [];

        clients.forEach(client => {
            if (!client.birthday) return;

            const [, month, day] = client.birthday.split('-').map(Number);

            if (month === currentMonth && day === currentDay) {
                const message = communicationService.getTemplate('aniversario', { name: client.name });
                const waLink = `https://wa.me/${communicationService.formatPhone(client.phone || '')}?text=${encodeURIComponent(message)}`;

                alerts.push({
                    clientId: client.id!,
                    clientName: client.name,
                    clientPhone: client.phone,
                    birthday: client.birthday,
                    message,
                    waLink
                });
            }
        });

        return alerts;
    }
};

