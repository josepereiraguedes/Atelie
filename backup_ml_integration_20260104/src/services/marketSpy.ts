
import axios from 'axios';

export interface CompetitorProduct {
    id: string;
    title: string;
    price: number;
    permalink: string;
    thumbnail: string;
    sold_quantity?: number;
    condition: string;
    seller_address?: {
        city: {
            name: string;
        };
        state: {
            name: string;
        }
    };
    free_shipping?: boolean;
    ean?: string;
    category_path?: string[];
}

export interface MarketAnalysis {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    totalSold: number; // Soma de vendas estimadas dos top results
    competitors: CompetitorProduct[];
    suggestedPrice: number;
    opportunityLevel: 'low' | 'medium' | 'high';
}

export const marketSpy = {
    /**
     * Busca produtos concorrentes no Mercado Livre
     * @param query Nome do produto ou EAN
     * @param limit Limite de resultados para analise (padrão 50)
     */
    async analyzeMercadoLivre(query: string, limit = 20): Promise<MarketAnalysis> {
        try {
            // Usar proxy local para evitar problemas de CORS/CSP e Bloqueios 403
            const response = await axios.get(`http://localhost:3001/api/market-spy/search`, {
                params: {
                    q: query,
                    limit: limit
                }
            });

            const results = response.data.results;

            if (!results || results.length === 0) {
                throw new Error('Nenhum concorrente encontrado para este termo.');
            }

            // Mapear dados relevantes
            const competitors: CompetitorProduct[] = results.map((item: any) => ({
                id: item.id,
                title: item.title,
                price: item.price,
                permalink: item.permalink,
                thumbnail: item.thumbnail,
                sold_quantity: item.sold_quantity || 0, // Nem sempre disponível diretamente na listagem nova, mas serve de estimativa
                condition: item.condition,
                seller_address: item.seller_address,
                free_shipping: item.shipping?.free_shipping || false,
                ean: item.ean,
                category_path: item.category_path
            }));

            // Calcular estatísticas
            const prices = competitors.map(c => c.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

            // Alguns itens retornam sold_quantity, outros não. 
            // O ML escondeu sold_quantity exato recentemente em algumas APIs públicas, 
            // mas ainda é o melhor indicador relativo.
            const totalSold = competitors.reduce((acc, curr) => acc + (curr.sold_quantity || 0), 0);

            // Determinar nível de oportunidade
            // Se tiver pouca concorrência (poucos results) ou preço muito alto, oportunidade alta.
            // Lógica simples de exemplo:
            let opportunityLevel: 'low' | 'medium' | 'high' = 'medium';
            if (results.length < 5) opportunityLevel = 'high'; // Nicho

            // Sugestão de preço: Levemente abaixo da média, mas acima do mínimo (para não destruir margem)
            // Estratégia: Pegar preço médio dos 5 mais baratos (excluindo o absoluto mais barato que pode ser erro/golpe)
            const sortedPrices = [...prices].sort((a, b) => a - b);
            // Pegar média do 2º ao 6º mais barato para evitar outliers
            const lowRangePrices = sortedPrices.slice(1, 6);
            const marketFloor = lowRangePrices.length > 0
                ? lowRangePrices.reduce((a, b) => a + b, 0) / lowRangePrices.length
                : minPrice;

            // Sugerir R$ 0,10 a menos que a média dos baratos
            const suggestedPrice = Math.floor(marketFloor) - 0.10;

            return {
                averagePrice,
                minPrice,
                maxPrice,
                totalSold,
                competitors,
                suggestedPrice: suggestedPrice > 0 ? suggestedPrice : minPrice,
                opportunityLevel
            };

        } catch (error) {
            console.error('Erro ao analisar Mercado Livre:', error);
            throw error;
        }
    }
};
