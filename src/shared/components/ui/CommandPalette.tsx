import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, User, ShoppingCart, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { useConfig } from '@/core/contexts/ConfigContext';

const CommandPalette: React.FC = () => {
    const { company } = useConfig();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { products, clients } = useLocalDatabase();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const results = query === '' ? [] : [
        ...products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map(p => ({
            type: 'product',
            id: p.id,
            name: p.name,
            icon: <Package className="w-4 h-4" />,
            action: () => { navigate('/inventory'); setIsOpen(false); }
        })),
        ...clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map(c => ({
            type: 'client',
            id: c.id,
            name: c.name,
            icon: <User className="w-4 h-4" />,
            action: () => { navigate('/clients'); setIsOpen(false); }
        })),
        {
            type: 'action',
            name: 'Nova Venda (PDV)',
            icon: <ShoppingCart className="w-4 h-4" />,
            action: () => { navigate('/pos'); setIsOpen(false); }
        }
    ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()));

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            results[selectedIndex]?.action();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative animate-in slide-in-from-top-4">
                <div className="p-4 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none focus:outline-none text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
                        placeholder="O que você está procurando? (Busque produtos, clientes ou ações...)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg text-[10px] font-bold">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${index}`}
                                    onClick={result.action}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${index === selectedIndex
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${index === selectedIndex ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                            {result.icon}
                                        </div>
                                        <span className="font-bold text-sm">{result.name}</span>
                                        <span className={`text-[10px] font-black uppercase opacity-60`}>{result.type}</span>
                                    </div>
                                    {index === selectedIndex && <ArrowRight className="w-4 h-4 animate-in slide-in-from-left-2" />}
                                </button>
                            ))}
                        </div>
                    ) : query !== '' ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum resultado encontrado para "{query}"</p>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Dica: Tente buscar "Nova Venda" ou o nome de um produto</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3 rotate-90" /> Navegar</span>
                        <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Selecionar</span>
                    </div>
                    <div>{company.name} Command Palette v1.0</div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;

