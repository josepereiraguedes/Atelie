import { CatalogTheme, CatalogLayout } from '@/shared/types';

/**
 * Serviço de Analytics para rastrear métricas de catálogos
 */

export interface CatalogMetrics {
    totalGenerated: number;
    byTheme: Record<CatalogTheme, number>;
    byLayout: Record<CatalogLayout, number>;
    byPeriod: { date: string; count: number }[];
    topProducts: { productName: string; count: number }[];
    reuseRate: number;
    sequencesGenerated: number;
    broadcastsSent: number;
    templatesUsed: number;
    lastUpdated: number;
}

export interface CatalogEvent {
    type: 'generated' | 'reused' | 'sequence' | 'broadcast' | 'template';
    theme?: CatalogTheme;
    layout?: CatalogLayout;
    products?: string[];
    timestamp: number;
}

class CatalogAnalyticsService {
    private readonly ANALYTICS_KEY = 'catalog_analytics';
    private readonly EVENTS_KEY = 'catalog_events';
    private readonly MAX_EVENTS = 1000;

    /**
     * Registra um evento de catálogo
     */
    trackEvent(event: Omit<CatalogEvent, 'timestamp'>): void {
        const fullEvent: CatalogEvent = {
            ...event,
            timestamp: Date.now()
        };

        const events = this.getEvents();
        events.unshift(fullEvent);

        // Manter apenas os últimos MAX_EVENTS
        if (events.length > this.MAX_EVENTS) {
            events.splice(this.MAX_EVENTS);
        }

        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
        this.updateMetrics();
    }

    /**
     * Recupera todos os eventos
     */
    private getEvents(): CatalogEvent[] {
        const data = localStorage.getItem(this.EVENTS_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Calcula métricas a partir dos eventos
     */
    private updateMetrics(): void {
        const events = this.getEvents();

        const metrics: CatalogMetrics = {
            totalGenerated: 0,
            byTheme: {
                'vibrant': 0,
                'elegant': 0,
                'minimalist': 0,
                'christmas': 0,
                'black-friday': 0
            },
            byLayout: {
                '1-product': 0,
                '2-products': 0,
                '3-products': 0,
                '4-products': 0
            },
            byPeriod: [],
            topProducts: [],
            reuseRate: 0,
            sequencesGenerated: 0,
            broadcastsSent: 0,
            templatesUsed: 0,
            lastUpdated: Date.now()
        };

        // Contar eventos por tipo
        const generatedEvents = events.filter(e => e.type === 'generated');
        const reusedEvents = events.filter(e => e.type === 'reused');
        const sequenceEvents = events.filter(e => e.type === 'sequence');
        const broadcastEvents = events.filter(e => e.type === 'broadcast');
        const templateEvents = events.filter(e => e.type === 'template');

        metrics.totalGenerated = generatedEvents.length;
        metrics.sequencesGenerated = sequenceEvents.length;
        metrics.broadcastsSent = broadcastEvents.length;
        metrics.templatesUsed = templateEvents.length;

        // Taxa de reutilização
        if (metrics.totalGenerated > 0) {
            metrics.reuseRate = (reusedEvents.length / metrics.totalGenerated) * 100;
        }

        // Contar por tema
        generatedEvents.forEach(event => {
            if (event.theme) {
                metrics.byTheme[event.theme]++;
            }
        });

        // Contar por layout
        generatedEvents.forEach(event => {
            if (event.layout) {
                metrics.byLayout[event.layout]++;
            }
        });

        // Agrupar por período (últimos 30 dias)
        const periodMap = new Map<string, number>();
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        generatedEvents
            .filter(e => e.timestamp >= thirtyDaysAgo)
            .forEach(event => {
                const date = new Date(event.timestamp).toLocaleDateString('pt-BR');
                periodMap.set(date, (periodMap.get(date) || 0) + 1);
            });

        metrics.byPeriod = Array.from(periodMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Top produtos
        const productMap = new Map<string, number>();
        generatedEvents.forEach(event => {
            event.products?.forEach(product => {
                productMap.set(product, (productMap.get(product) || 0) + 1);
            });
        });

        metrics.topProducts = Array.from(productMap.entries())
            .map(([productName, count]) => ({ productName, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(metrics));
    }

    /**
     * Recupera métricas calculadas
     */
    getMetrics(): CatalogMetrics {
        const data = localStorage.getItem(this.ANALYTICS_KEY);
        if (data) {
            return JSON.parse(data);
        }

        // Retornar métricas vazias se não houver dados
        return {
            totalGenerated: 0,
            byTheme: {
                'vibrant': 0,
                'elegant': 0,
                'minimalist': 0,
                'christmas': 0,
                'black-friday': 0
            },
            byLayout: {
                '1-product': 0,
                '2-products': 0,
                '3-products': 0,
                '4-products': 0
            },
            byPeriod: [],
            topProducts: [],
            reuseRate: 0,
            sequencesGenerated: 0,
            broadcastsSent: 0,
            templatesUsed: 0,
            lastUpdated: Date.now()
        };
    }

    /**
     * Recupera métricas de um período específico
     */
    getMetricsByPeriod(startDate: Date, endDate: Date): Partial<CatalogMetrics> {
        const events = this.getEvents();
        const filteredEvents = events.filter(e =>
            e.timestamp >= startDate.getTime() &&
            e.timestamp <= endDate.getTime()
        );

        const generatedEvents = filteredEvents.filter(e => e.type === 'generated');

        return {
            totalGenerated: generatedEvents.length,
            sequencesGenerated: filteredEvents.filter(e => e.type === 'sequence').length,
            broadcastsSent: filteredEvents.filter(e => e.type === 'broadcast').length,
            templatesUsed: filteredEvents.filter(e => e.type === 'template').length
        };
    }

    /**
     * Limpa todos os dados de analytics
     */
    clearAnalytics(): void {
        localStorage.removeItem(this.ANALYTICS_KEY);
        localStorage.removeItem(this.EVENTS_KEY);
    }

    /**
     * Exporta dados para CSV
     */
    exportToCSV(): string {
        const events = this.getEvents();
        const headers = ['Data', 'Tipo', 'Tema', 'Layout', 'Produtos'];
        const rows = events.map(event => [
            new Date(event.timestamp).toLocaleString('pt-BR'),
            event.type,
            event.theme || '',
            event.layout || '',
            event.products?.join('; ') || ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        return csv;
    }
}

export const catalogAnalyticsService = new CatalogAnalyticsService();


