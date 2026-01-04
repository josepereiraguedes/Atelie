/**
 * Serviço de gerenciamento de listas de transmissão e compartilhamento direto
 */

export interface Contact {
    id: string;
    name: string;
    phone: string;
    addedAt: number;
}

export interface BroadcastList {
    id: string;
    name: string;
    contacts: Contact[];
    createdAt: number;
    lastUsed?: number;
}

export interface SendRecord {
    catalogId: string;
    catalogTitle: string;
    listId: string;
    listName: string;
    contactCount: number;
    sentAt: number;
}

class BroadcastService {
    private readonly LISTS_KEY = 'broadcast_lists';
    private readonly CONTACTS_KEY = 'broadcast_contacts';
    private readonly HISTORY_KEY = 'broadcast_history';

    /**
     * Recupera todos os contatos
     */
    getContacts(): Contact[] {
        const data = localStorage.getItem(this.CONTACTS_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Adiciona novo contato
     */
    addContact(name: string, phone: string): string {
        const contacts = this.getContacts();
        const id = `contact_${Date.now()}`;

        const newContact: Contact = {
            id,
            name,
            phone: this.formatPhone(phone),
            addedAt: Date.now()
        };

        contacts.push(newContact);
        localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
        return id;
    }

    /**
     * Remove contato
     */
    deleteContact(id: string): void {
        const contacts = this.getContacts().filter(c => c.id !== id);
        localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));

        // Remover de todas as listas
        const lists = this.getLists();
        lists.forEach(list => {
            list.contacts = list.contacts.filter(c => c.id !== id);
        });
        localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
    }

    /**
     * Recupera todas as listas
     */
    getLists(): BroadcastList[] {
        const data = localStorage.getItem(this.LISTS_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Cria nova lista
     */
    createList(name: string, contactIds: string[]): string {
        const lists = this.getLists();
        const allContacts = this.getContacts();
        const id = `list_${Date.now()}`;

        const selectedContacts = allContacts.filter(c => contactIds.includes(c.id));

        const newList: BroadcastList = {
            id,
            name,
            contacts: selectedContacts,
            createdAt: Date.now()
        };

        lists.push(newList);
        localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
        return id;
    }

    /**
     * Atualiza lista existente
     */
    updateList(id: string, name: string, contactIds: string[]): void {
        const lists = this.getLists();
        const allContacts = this.getContacts();
        const list = lists.find(l => l.id === id);

        if (list) {
            list.name = name;
            list.contacts = allContacts.filter(c => contactIds.includes(c.id));
            localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
        }
    }

    /**
     * Deleta lista
     */
    deleteList(id: string): void {
        const lists = this.getLists().filter(l => l.id !== id);
        localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
    }

    /**
     * Marca lista como usada
     */
    markListAsUsed(id: string): void {
        const lists = this.getLists();
        const list = lists.find(l => l.id === id);
        if (list) {
            list.lastUsed = Date.now();
            localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
        }
    }

    /**
     * Abre WhatsApp para cada contato da lista
     */
    sendToList(
        listId: string,
        message: string,
        catalogId?: string,
        catalogTitle?: string
    ): void {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);

        if (!list) return;

        // Registrar envio
        if (catalogId && catalogTitle) {
            this.recordSend(catalogId, catalogTitle, listId, list.name, list.contacts.length);
        }

        // Abrir WhatsApp para cada contato
        list.contacts.forEach((contact, index) => {
            setTimeout(() => {
                const url = `https://wa.me/${this.cleanPhone(contact.phone)}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            }, index * 1000); // 1 segundo de delay entre cada abertura
        });

        this.markListAsUsed(listId);
    }

    /**
     * Registra envio no histórico
     */
    private recordSend(
        catalogId: string,
        catalogTitle: string,
        listId: string,
        listName: string,
        contactCount: number
    ): void {
        const history = this.getHistory();

        const record: SendRecord = {
            catalogId,
            catalogTitle,
            listId,
            listName,
            contactCount,
            sentAt: Date.now()
        };

        history.unshift(record);

        // Manter apenas últimos 100 registros
        if (history.length > 100) {
            history.splice(100);
        }

        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }

    /**
     * Recupera histórico de envios
     */
    getHistory(): SendRecord[] {
        const data = localStorage.getItem(this.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Limpa histórico
     */
    clearHistory(): void {
        localStorage.removeItem(this.HISTORY_KEY);
    }

    /**
     * Formata telefone
     */
    private formatPhone(phone: string): string {
        // Remove tudo exceto números
        const cleaned = phone.replace(/\D/g, '');

        // Adiciona código do país se não tiver
        if (!cleaned.startsWith('55') && cleaned.length === 11) {
            return '55' + cleaned;
        }

        return cleaned;
    }

    /**
     * Limpa telefone para URL
     */
    private cleanPhone(phone: string): string {
        return phone.replace(/\D/g, '');
    }
}

export const broadcastService = new BroadcastService();
