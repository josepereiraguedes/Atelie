import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Upload, Clipboard, UserPlus, CheckCircle, AlertCircle, Trash2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface ParsedContact {
    name: string;
    phone: string;
    email?: string;
}

const LeadImport: React.FC = () => {
    const navigate = useNavigate();
    const { addClient } = useLocalDatabase();
    const [pasteArea, setPasteArea] = useState('');
    const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const parseText = (text: string) => {
        // Regex para capturar padrões comuns: "Nome - (99) 99999-9999" ou "Nome 999999999"
        const lines = text.split('\n');
        const results: ParsedContact[] = [];

        lines.forEach(line => {
            if (!line.trim()) return;

            // Tentar extrair telefone (sequência de 8 a 11 dígitos ignorando caracteres especiais)
            const phoneMatch = line.match(/(\d[\d\s\-\(\)]{8,}\d)/);
            if (phoneMatch) {
                const phone = phoneMatch[0].replace(/\D/g, '');
                const name = line.replace(phoneMatch[0], '').replace(/[\-\:]/g, '').trim() || 'Contato Importado';

                // Formatar telefone para o sistema (55...)
                const formattedPhone = (phone.length === 10 || phone.length === 11) ? `55${phone}` : phone;

                results.push({ name, phone: formattedPhone });
            }
        });

        return results;
    };

    const handlePaste = () => {
        if (!pasteArea.trim()) {
            toast.error('Cole algum conteúdo para processar.');
            return;
        }
        setIsProcessing(true);
        const results = parseText(pasteArea);
        setParsedContacts(results);
        setIsProcessing(false);
        if (results.length > 0) {
            toast.success(`${results.length} contatos encontrados!`);
        } else {
            toast.error('Nenhum contato válido encontrado no texto.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (file.name.endsWith('.vcf')) {
                // Simples parser vCard
                const vcfResults: ParsedContact[] = [];
                const cards = content.split('BEGIN:VCARD');
                cards.forEach(card => {
                    const fn = card.match(/FN:(.*)/)?.[1]?.trim();
                    const tel = card.match(/TEL.*:(.*)/)?.[1]?.trim()?.replace(/\D/g, '');
                    if (tel) {
                        const formattedPhone = (tel.length === 10 || tel.length === 11) ? `55${tel}` : tel;
                        vcfResults.push({ name: fn || 'Contato VCF', phone: formattedPhone });
                    }
                });
                setParsedContacts(vcfResults);
                toast.success(`${vcfResults.length} contatos importados do VCF!`);
            } else {
                const results = parseText(content);
                setParsedContacts(results);
            }
        };
        reader.readAsText(file);
    };

    const handleSaveLeads = async () => {
        if (parsedContacts.length === 0) return;

        setIsProcessing(true);
        try {
            for (const contact of parsedContacts) {
                await addClient({
                    name: contact.name,
                    phone: contact.phone,
                    status: 'lead',
                    source: 'whatsapp_import'
                });
            }
            toast.success(`${parsedContacts.length} novos leads cadastrados com sucesso!`);
            navigate('/clients');
        } catch (error) {
            toast.error('Erro ao salvar alguns contatos.');
        } finally {
            setIsProcessing(false);
        }
    };

    const removeContact = (index: number) => {
        setParsedContacts(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Importar Contatos WhatsApp</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Transforme seus contatos do celular em potenciais clientes (Leads).</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Área de Entrada */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4">
                            Opção 1: Colar Texto
                        </label>
                        <textarea
                            value={pasteArea}
                            onChange={(e) => setPasteArea(e.target.value)}
                            placeholder="Exemplo: João Silva - 11988887777&#10;Maria Souza (11) 97777-6666"
                            className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-green-500 transition-all font-mono"
                        />
                        <button
                            onClick={handlePaste}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-2xl hover:bg-black transition-all"
                        >
                            <Clipboard className="w-4 h-4" />
                            Processar Texto Copiado
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4">
                            Opção 2: Arquivo VCF / vCard
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".vcf,.txt"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center group-hover:border-green-400 transition-all">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3 group-hover:text-green-500 transition-all" />
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Escolher Arquivo do Celular</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase">Suporta .vcf e .txt</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Preview da Importação</h2>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black">{parsedContacts.length} ENCONTRADOS</span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                        {parsedContacts.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/80 text-[10px] text-gray-400 uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Nome</th>
                                        <th className="px-6 py-4">Telefone</th>
                                        <th className="px-6 py-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {parsedContacts.map((contact, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{contact.name}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-500">+{contact.phone}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => removeContact(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center opacity-30">
                                <UserPlus className="w-16 h-16 mb-4" />
                                <p className="font-bold">Aguardando contatos...</p>
                            </div>
                        )}
                    </div>

                    {parsedContacts.length > 0 && (
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleSaveLeads}
                                disabled={isProcessing}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                            >
                                <CheckCircle className="w-5 h-5" />
                                {isProcessing ? 'Cadastrando...' : 'Confirmar Importação'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-black uppercase tracking-widest mb-1">Dica de Sucesso:</p>
                    <p>Ao importar contatos do WhatsApp, eles entrarão no sistema como <strong>Leads</strong>. Use o módulo de Sucesso do Cliente para enviar sua primeira oferta de catálogo e convertê-los em clientes reais!</p>
                </div>
            </div>
        </div>
    );
};

export default LeadImport;

