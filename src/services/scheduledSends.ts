/**
 * Serviço de agendamento de envios de catálogos
 */

export interface ScheduledSend {
    id: string;
    catalogId: string;
    catalogTitle: string;
    listId: string;
    listName: string;
    message: string;
    scheduledFor: number;
    status: 'pending' | 'sent' | 'cancelled' | 'failed';
    createdAt: number;
    sentAt?: number;
}

class ScheduledSendsService {
    private readonly SCHEDULED_KEY = 'scheduled_sends';
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startScheduler();
    }

    /**
     * Agenda um novo envio
     */
    schedule(send: Omit<ScheduledSend, 'id' | 'status' | 'createdAt'>): string {
        const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newSend: ScheduledSend = {
            ...send,
            id,
            status: 'pending',
            createdAt: Date.now()
        };

        const scheduled = this.getScheduled();
        scheduled.push(newSend);
        localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));

        return id;
    }

    /**
     * Recupera todos os agendamentos
     */
    getScheduled(): ScheduledSend[] {
        const data = localStorage.getItem(this.SCHEDULED_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Recupera agendamentos pendentes
     */
    getPending(): ScheduledSend[] {
        return this.getScheduled().filter(s => s.status === 'pending');
    }

    /**
     * Cancela um agendamento
     */
    cancel(id: string): void {
        const scheduled = this.getScheduled();
        const send = scheduled.find(s => s.id === id);

        if (send && send.status === 'pending') {
            send.status = 'cancelled';
            localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));
        }
    }

    /**
     * Marca como enviado
     */
    markAsSent(id: string): void {
        const scheduled = this.getScheduled();
        const send = scheduled.find(s => s.id === id);

        if (send) {
            send.status = 'sent';
            send.sentAt = Date.now();
            localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));
        }
    }

    /**
     * Marca como falhou
     */
    markAsFailed(id: string): void {
        const scheduled = this.getScheduled();
        const send = scheduled.find(s => s.id === id);

        if (send) {
            send.status = 'failed';
            localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));
        }
    }

    /**
     * Deleta um agendamento
     */
    delete(id: string): void {
        const scheduled = this.getScheduled().filter(s => s.id !== id);
        localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));
    }

    /**
     * Limpa agendamentos antigos (mais de 30 dias)
     */
    cleanup(): void {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const scheduled = this.getScheduled().filter(s =>
            s.status === 'pending' || s.createdAt >= thirtyDaysAgo
        );
        localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));
    }

    /**
     * Inicia o verificador de agendamentos
     */
    private startScheduler(): void {
        // Verificar a cada minuto
        this.checkInterval = setInterval(() => {
            this.checkPendingSends();
        }, 60000); // 60 segundos

        // Verificar imediatamente ao iniciar
        this.checkPendingSends();
    }

    /**
     * Para o verificador
     */
    stopScheduler(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Verifica e executa envios pendentes
     */
    private checkPendingSends(): void {
        const now = Date.now();
        const pending = this.getPending();

        pending.forEach(send => {
            if (send.scheduledFor <= now) {
                this.executeSend(send);
            }
        });
    }

    /**
     * Executa o envio (simulado - na prática integraria com broadcastService)
     */
    private executeSend(send: ScheduledSend): void {
        try {
            // Aqui você integraria com o broadcastService
            // broadcastService.sendToList(send.listId, send.message, send.catalogId, send.catalogTitle);

            console.log(`Executing scheduled send: ${send.catalogTitle} to ${send.listName}`);

            this.markAsSent(send.id);

            // Notificar usuário
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Envio Agendado Executado', {
                    body: `Catálogo "${send.catalogTitle}" enviado para ${send.listName}`,
                    icon: '/icon.png'
                });
            }
        } catch (error) {
            console.error('Error executing send:', error);
            this.markAsFailed(send.id);
        }
    }

    /**
     * Solicita permissão para notificações
     */
    async requestNotificationPermission(): Promise<boolean> {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    /**
     * Próximo agendamento
     */
    getNextScheduled(): ScheduledSend | null {
        const pending = this.getPending();
        if (pending.length === 0) return null;

        return pending.reduce((next, current) =>
            current.scheduledFor < next.scheduledFor ? current : next
        );
    }
}

export const scheduledSendsService = new ScheduledSendsService();
