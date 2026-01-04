import { Transaction } from '@/shared/types/database.types';

/**
 * Serviço para análise de densidade de vendas (Heatmap)
 */
export const heatmapService = {
    /**
     * Calcula a matriz de calor (7 dias x 24 horas)
     */
    generateSalesHeatmap(transactions: Transaction[]) {
        // Matriz 7x24 (0-6 dias da semana, 0-23 horas)
        const heatmap: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
        const salesOnly = transactions.filter(t => t.type === 'sale' && t.payment_status === 'paid');

        let maxVal = 0;

        salesOnly.forEach(t => {
            const date = new Date(t.created_at);
            const day = date.getDay(); // 0 (Dom) - 6 (Sab)
            const hour = date.getHours();

            heatmap[day][hour] += t.total;
            if (heatmap[day][hour] > maxVal) maxVal = heatmap[day][hour];
        });

        return {
            matrix: heatmap,
            max: maxVal,
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            hours: Array.from({ length: 24 }, (_, i) => `${i}h`)
        };
    },

    /**
     * Identifica o "Horário de Ouro" (Pico máximo)
     */
    getGoldenHour(transactions: Transaction[]) {
        const { matrix, days } = this.generateSalesHeatmap(transactions);
        let max = 0;
        let golden = { day: '', hour: 0, value: 0 };

        matrix.forEach((row, dIdx) => {
            row.forEach((val, hIdx) => {
                if (val > max) {
                    max = val;
                    golden = { day: days[dIdx], hour: hIdx, value: val };
                }
            });
        });

        return golden;
    }
};
