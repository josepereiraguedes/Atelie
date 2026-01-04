import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, Send, Edit2, Check } from 'lucide-react';
import { broadcastService, BroadcastList, Contact } from '@/services/broadcastService';
import toast from 'react-hot-toast';

interface BroadcastListManagerProps {
    onSendToList: (listId: string, listName: string) => void;
}

export const BroadcastListManager: React.FC<BroadcastListManagerProps> = ({ onSendToList }) => {
    const [lists, setLists] = useState<BroadcastList[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingList, setEditingList] = useState<string | null>(null);
    const [newListName, setNewListName] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [showContactForm, setShowContactForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLists(broadcastService.getLists());
        setContacts(broadcastService.getContacts());
    };

    const handleCreateList = () => {
        if (!newListName.trim()) {
            toast.error('Digite um nome para a lista');
            return;
        }

        if (selectedContacts.length === 0) {
            toast.error('Selecione pelo menos um contato');
            return;
        }

        if (editingList) {
            broadcastService.updateList(editingList, newListName, selectedContacts);
            toast.success('Lista atualizada!');
        } else {
            broadcastService.createList(newListName, selectedContacts);
            toast.success('Lista criada!');
        }

        resetForm();
        loadData();
    };

    const handleAddContact = () => {
        if (!newContactName.trim() || !newContactPhone.trim()) {
            toast.error('Preencha nome e telefone');
            return;
        }

        broadcastService.addContact(newContactName, newContactPhone);
        setNewContactName('');
        setNewContactPhone('');
        setShowContactForm(false);
        loadData();
        toast.success('Contato adicionado!');
    };

    const handleDeleteList = (id: string) => {
        if (window.confirm('Deseja realmente excluir esta lista?')) {
            broadcastService.deleteList(id);
            loadData();
            toast.success('Lista excluída');
        }
    };

    const handleDeleteContact = (id: string) => {
        if (window.confirm('Deseja realmente excluir este contato?')) {
            broadcastService.deleteContact(id);
            loadData();
            toast.success('Contato excluído');
        }
    };

    const handleEditList = (list: BroadcastList) => {
        setEditingList(list.id);
        setNewListName(list.name);
        setSelectedContacts(list.contacts.map(c => c.id));
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingList(null);
        setNewListName('');
        setSelectedContacts([]);
    };

    const toggleContactSelection = (id: string) => {
        setSelectedContacts(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Listas de Transmissão
                </h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova Lista
                </button>
            </div>

            {/* Formulário de criação/edição */}
            {isCreating && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 space-y-4 animate-in slide-in-from-top duration-200">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nome da Lista
                        </label>
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="Ex: Clientes VIP, Promoções..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Selecione Contatos ({selectedContacts.length})
                            </label>
                            <button
                                onClick={() => setShowContactForm(!showContactForm)}
                                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Novo Contato
                            </button>
                        </div>

                        {/* Formulário de novo contato */}
                        {showContactForm && (
                            <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                                <input
                                    type="text"
                                    value={newContactName}
                                    onChange={(e) => setNewContactName(e.target.value)}
                                    placeholder="Nome do contato"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        value={newContactPhone}
                                        onChange={(e) => setNewContactPhone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                    />
                                    <button
                                        onClick={handleAddContact}
                                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de contatos */}
                        <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                            {contacts.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    Nenhum contato cadastrado
                                </p>
                            ) : (
                                contacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                                    >
                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedContacts.includes(contact.id)}
                                                onChange={() => toggleContactSelection(contact.id)}
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {contact.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {contact.phone}
                                                </div>
                                            </div>
                                        </label>
                                        <button
                                            onClick={() => handleDeleteContact(contact.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={resetForm}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateList}
                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            {editingList ? 'Atualizar' : 'Criar'} Lista
                        </button>
                    </div>
                </div>
            )}

            {/* Listas existentes */}
            <div className="space-y-3">
                {lists.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma lista criada</p>
                        <p className="text-sm mt-2">Crie listas para enviar catálogos para múltiplos contatos</p>
                    </div>
                ) : (
                    lists.map(list => (
                        <div
                            key={list.id}
                            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {list.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {list.contacts.length} contato{list.contacts.length !== 1 ? 's' : ''}
                                    </p>
                                    {list.lastUsed && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Último uso: {new Date(list.lastUsed).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditList(list)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onSendToList(list.id, list.name)}
                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title="Enviar Catálogo"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteList(list.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
