import { Product, MarketplacePricingConfig } from '@/shared/types/database.types';

/**
 * Serviço para cálculos de precificação de marketplaces
 */
export const pricingService = {
    /**
     * Calcula o preço sugerido para um produto em um marketplace específico
     */
    calculateMarketplacePrice(
        product: Product,
        config: MarketplacePricingConfig,
        desiredProfitMargin: number = 20
    ) {
        // Custo do produto
        const productCost = product.cost;

        // Cálculo dos custos padrão
        const commissionCost = (config.commission_rate / 100) * productCost;
        const fixedFee = config.fixed_fee;
        const taxCost = (config.tax_rate / 100) * productCost;
        const operationalCost = (config.operational_cost_rate / 100) * productCost;
        const shippingCost = config.shipping_cost;
        const marketingCost = (config.marketing_rate / 100) * productCost;

        // Cálculo dos custos adicionais personalizados
        let customCostsTotal = 0;
        const customCostsDetails: { name: string; cost: number }[] = [];

        if (config.custom_costs && config.custom_costs.length > 0) {
            config.custom_costs.forEach(cost => {
                let costValue = 0;
                if (cost.type === 'fixed') {
                    costValue = cost.value;
                } else if (cost.type === 'percentage') {
                    costValue = (cost.value / 100) * productCost;
                }

                customCostsTotal += costValue;
                customCostsDetails.push({ name: cost.name, cost: costValue });
            });
        }

        // Custo total
        const totalCost = productCost + commissionCost + fixedFee + taxCost + operationalCost + shippingCost + marketingCost + customCostsTotal;

        // Cálculo do preço com margem de lucro desejada
        const suggestedPrice = totalCost / (1 - (desiredProfitMargin / 100));

        // Margem de lucro real
        const actualProfitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;

        // Lucro bruto
        const grossProfit = suggestedPrice - totalCost;

        return {
            marketplace: config.name,
            productCost,
            commissionCost,
            fixedFee,
            taxCost,
            operationalCost,
            shippingCost,
            marketingCost,
            customCosts: customCostsDetails,
            customCostsTotal,
            totalCost,
            suggestedPrice,
            desiredProfitMargin,
            actualProfitMargin,
            grossProfit,
            averagePaymentTerm: config.average_payment_term
        };
    },

    /**
     * Calcula a precificação para todos os marketplaces fornecidos
     */
    calculateAllMarketplacePrices(
        product: Product,
        configs: MarketplacePricingConfig[],
        desiredProfitMargin: number = 20
    ) {
        return configs.map(config =>
            this.calculateMarketplacePrice(product, config, desiredProfitMargin)
        );
    },

    /**
     * Configurações padrão para marketplaces
     */
    defaultMarketplaceConfigs: [
        {
            name: 'Mercado Livre',
            commission_rate: 12,
            fixed_fee: 5.00,
            tax_rate: 19,
            operational_cost_rate: 5,
            shipping_cost: 15.00,
            marketing_rate: 3,
            average_payment_term: 14
        },
        {
            name: 'Amazon',
            commission_rate: 15,
            fixed_fee: 3.00,
            tax_rate: 19,
            operational_cost_rate: 4,
            shipping_cost: 12.00,
            marketing_rate: 2,
            average_payment_term: 10
        },
        {
            name: 'Shopee',
            commission_rate: 10,
            fixed_fee: 2.00,
            tax_rate: 19,
            operational_cost_rate: 3,
            shipping_cost: 10.00,
            marketing_rate: 4,
            average_payment_term: 7
        },
        {
            name: 'Americanas',
            commission_rate: 18,
            fixed_fee: 4.50,
            tax_rate: 19,
            operational_cost_rate: 6,
            shipping_cost: 14.00,
            marketing_rate: 3.5,
            average_payment_term: 15
        },
        {
            name: 'Magazine Luiza',
            commission_rate: 16,
            fixed_fee: 3.50,
            tax_rate: 19,
            operational_cost_rate: 5.5,
            shipping_cost: 13.00,
            marketing_rate: 4,
            average_payment_term: 12
        },
        {
            name: 'Casas Bahia',
            commission_rate: 17,
            fixed_fee: 4.00,
            tax_rate: 19,
            operational_cost_rate: 5.5,
            shipping_cost: 13.50,
            marketing_rate: 3.5,
            average_payment_term: 13
        },
        {
            name: 'Carrefour',
            commission_rate: 14,
            fixed_fee: 3.80,
            tax_rate: 19,
            operational_cost_rate: 5,
            shipping_cost: 12.50,
            marketing_rate: 3,
            average_payment_term: 11
        },
        {
            name: 'Via',
            commission_rate: 16,
            fixed_fee: 4.20,
            tax_rate: 19,
            operational_cost_rate: 5.2,
            shipping_cost: 13.00,
            marketing_rate: 3.2,
            average_payment_term: 12
        },
        {
            name: 'Submarino',
            commission_rate: 15,
            fixed_fee: 3.50,
            tax_rate: 19,
            operational_cost_rate: 4.8,
            shipping_cost: 12.00,
            marketing_rate: 2.8,
            average_payment_term: 10
        },
        {
            name: 'Extra',
            commission_rate: 16,
            fixed_fee: 4.00,
            tax_rate: 19,
            operational_cost_rate: 5.1,
            shipping_cost: 12.80,
            marketing_rate: 3.1,
            average_payment_term: 11
        },
        {
            name: 'Ponto Frio',
            commission_rate: 17,
            fixed_fee: 4.30,
            tax_rate: 19,
            operational_cost_rate: 5.3,
            shipping_cost: 13.20,
            marketing_rate: 3.3,
            average_payment_term: 12
        },
        {
            name: 'Fast Shop',
            commission_rate: 15,
            fixed_fee: 3.70,
            tax_rate: 19,
            operational_cost_rate: 4.9,
            shipping_cost: 12.30,
            marketing_rate: 2.9,
            average_payment_term: 10
        },
        {
            name: 'Walmart',
            commission_rate: 13,
            fixed_fee: 3.90,
            tax_rate: 19,
            operational_cost_rate: 4.7,
            shipping_cost: 12.60,
            marketing_rate: 3.0,
            average_payment_term: 9
        },
        {
            name: 'Lojas Renner',
            commission_rate: 14,
            fixed_fee: 3.60,
            tax_rate: 19,
            operational_cost_rate: 4.6,
            shipping_cost: 12.40,
            marketing_rate: 3.1,
            average_payment_term: 11
        },
        {
            name: 'C&A',
            commission_rate: 15,
            fixed_fee: 3.80,
            tax_rate: 19,
            operational_cost_rate: 4.8,
            shipping_cost: 12.50,
            marketing_rate: 3.2,
            average_payment_term: 10
        }
    ],

    /**
     * Analisa a competitividade de um produto em relação ao mercado real.
     */
    async analyzeProductCompetitiveness(productName: string, currentPrice: number): Promise<any> {
        try {
            const { apiService } = await import('./api');
            const marketData = await apiService.searchMercadoLivre(productName);

            if (!marketData || marketData.length === 0) {
                return { competitiveness: 'unknown', avgPrice: 0, suggestedPrice: currentPrice };
            }

            // Filtrar outliers (ex: fretes, acessórios baratos, kits caros)
            const prices = marketData
                .map((item: any) => item.price)
                .filter((p: number) => p > currentPrice * 0.4 && p < currentPrice * 2.5)
                .sort((a: number, b: number) => a - b);

            if (prices.length < 3) return { competitiveness: 'unknown', avgPrice: 0, suggestedPrice: currentPrice };

            const minPrice = prices[0];
            const maxPrice = prices[prices.length - 1];
            const avgPrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;

            let status: 'underpriced' | 'competitive' | 'overpriced' = 'competitive';
            if (currentPrice < avgPrice * 0.88) status = 'underpriced';
            else if (currentPrice > avgPrice * 1.12) status = 'overpriced';

            // Sugestão baseada em competitividade
            const suggestedPrice = status === 'overpriced' ? avgPrice : (status === 'underpriced' ? avgPrice * 0.95 : currentPrice);

            return {
                minPrice,
                maxPrice,
                avgPrice,
                competitiveness: status,
                suggestedPrice,
                resultsCount: marketData.length,
                potentialGain: status === 'underpriced' ? (suggestedPrice - currentPrice) : 0
            };
        } catch (error) {
            console.error('Erro na análise de mercado:', error);
            return { competitiveness: 'error', avgPrice: 0, suggestedPrice: currentPrice };
        }
    }
};
