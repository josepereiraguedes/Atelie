
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShoppingCart, CreditCard, Banknote, QrCode, Plus, Minus, X, User } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import { predictionService } from '@/features/purchasing/services/predictionService';
import { Sparkles } from 'lucide-react';

const POS: React.FC = () => {
    const { products, transactions, addTransaction, clients } = useLocalDatabase();

    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [displayLimit, setDisplayLimit] = useState(50);
    const [payments, setPayments] = useState<Record<string, number>>({
        money: 0,
        pix: 0,
        credit: 0,
        debit: 0
    });
    const [receivedAmount, setReceivedAmount] = useState<number>(0);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [selectedChannel, setSelectedChannel] = useState('Loja Física');

    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedClient = selectedClientId ? clients.find(c => c.id === Number(selectedClientId)) : null;
    const clientPoints = selectedClient?.loyalty_points || 0;
    const pointsDiscount = pointsToRedeem * 0.5;

    const recommendations = useMemo(() => {
        const cartIds = cart.map(item => item.product.id);
        return predictionService.getRecommendations(cartIds, transactions, products);
    }, [cart, transactions, products]);

    const total = cart.reduce((sum, item) => sum + (item.product.sale_price * item.quantity), 0);
    const finalTotal = Math.max(0, total - pointsDiscount);
    const paidAmount = Object.values(payments).reduce((a, b) => a + b, 0);
    const remaining = Math.max(0, finalTotal - paidAmount);
    const change = Math.max(0, receivedAmount - finalTotal);

    // Focar na busca ao abrir e após ações
    useEffect(() => {
        if (!showPaymentModal) {
            searchInputRef.current?.focus();
            setPayments({ money: 0, pix: 0, credit: 0, debit: 0 });
            setReceivedAmount(0);
        }
    }, [cart, showPaymentModal]);

    // Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                if (cart.length > 0) setShowPaymentModal(true);
            }
            if (e.key === 'Escape') {
                setShowPaymentModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart]);

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.barcode || '').includes(searchTerm);
        const matchesCategory = !selectedCategory || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setSearchTerm(''); // Limpa busca pra próxima bipagem
        toast.success(`${product.name} adicionado!`, { position: 'bottom-center', duration: 1000 });
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = { ...newCart[index] }; // Cópia segura
            const newQty = item.quantity + delta;

            if (newQty <= 0) return prev.filter((_, i) => i !== index);

            item.quantity = newQty;
            newCart[index] = item;
            return newCart;
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handleCheckout = async () => {
        try {
            if (cart.length === 0) return;
            if (paidAmount < total && receivedAmount < total) {
                toast.error('Valor pago insuficiente');
                return;
            }

            const clientObj = selectedClientId ? clients.find(c => c.id === Number(selectedClientId)) : undefined;

            // Determinar método principal ou lista de métodos
            const activeMethods = Object.entries(payments)
                .filter(([_, val]) => val > 0)
                .map(([method, val]) => `${method}: R$${val.toFixed(2)}`);

            const paymentMethodStr = activeMethods.length > 0
                ? activeMethods.join(' + ')
                : (receivedAmount >= total ? 'money' : 'unknown');

            const transaction = {
                type: 'sale',
                payment_status: 'paid',
                payment_method: paymentMethodStr,
                client_id: selectedClientId ? Number(selectedClientId) : undefined,
                client: clientObj ? { name: clientObj.name } : undefined,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.product.sale_price,
                    total: item.product.sale_price * item.quantity
                })),
                total: finalTotal,
                points_redeemed: pointsToRedeem,
                channel: selectedChannel,
                received_amount: Math.max(receivedAmount, paidAmount),
                change_amount: change,
                created_at: new Date().toISOString()
            };

            // @ts-ignore
            await addTransaction(transaction);

            toast.success('Venda finalizada com sucesso!', { duration: 3000, icon: '🎉' });
            setCart([]);
            setSelectedClientId('');
            setShowPaymentModal(false);
            setPayments({ money: 0, pix: 0, credit: 0, debit: 0 });
            setReceivedAmount(0);
            setPointsToRedeem(0);
        } catch (error) {
            toast.error('Erro ao finalizar venda');
            console.error(error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4">
            {/* Coluna da Esquerda: Catálogo/Busca */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setDisplayLimit(50); // Reseta limite ao buscar
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && filteredProducts.length > 0) {
                                    addToCart(filteredProducts[0]);
                                }
                            }}
                            placeholder="Buscar por nome, SKU ou bipar código de barras..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.slice(0, displayLimit).map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="flex flex-col items-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300 transition-all group text-left h-full"
                            >
                                <div className="w-full aspect-square bg-gray-50 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden flex items-center justify-center p-2">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                    ) : (
                                        <div className="text-gray-300 dark:text-gray-600 font-bold text-4xl select-none">
                                            {(product.name || '?').charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="w-full space-y-1">
                                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm h-10">{product.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.quantity <= (product.min_stock || 0) ? 'bg-red-100 text-red-600 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                            {product.quantity} {product.unit || 'un'}
                                        </span>
                                        <span className="font-bold text-blue-600">R$ {(product.sale_price || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </button>
                        ))}

                        {filteredProducts.length > displayLimit && (
                            <div className="col-span-full py-4 text-center">
                                <button
                                    onClick={() => setDisplayLimit(prev => prev + 50)}
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors"
                                >
                                    Ver mais produtos (+50)
                                </button>
                            </div>
                        )}

                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhum produto encontrado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Coluna da Direita: Carrinho */}
            <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-md">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Venda Atual
                    </h2>
                    <span className="bg-blue-500 px-3 py-1 rounded-full text-xs font-mono">{cart.length} itens</span>
                </div>

                {/* Seleção de Cliente */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-100 dark:border-blue-900/30">
                        <User className="w-4 h-4 text-blue-500" />
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(Number(e.target.value) || '')}
                            className="flex-1 bg-transparent text-sm font-medium border-none focus:ring-0 p-0 text-gray-700 dark:text-gray-200"
                        >
                            <option value="">Cliente Não Identificado</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-100 dark:border-blue-900/30">
                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                        <select
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-medium border-none focus:ring-0 p-0 text-gray-700 dark:text-gray-200"
                        >
                            <option value="Loja Física">Loja Física</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Mercado Livre">Mercado Livre</option>
                            <option value="Shopee">Shopee</option>
                            <option value="Instagram/Facebook">Instagram/Facebook</option>
                        </select>
                    </div>

                    {selectedClient && clientPoints > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg animate-in fade-in transition-all">
                            <div className="flex justify-between items-center text-xs mb-2">
                                <span className="font-bold text-yellow-700 dark:text-yellow-400 uppercase">Saldo: {clientPoints} Pontos</span>
                                <span className="text-[10px] text-yellow-600">Resgate vale R$ {(clientPoints * 0.5).toFixed(2)}</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    max={clientPoints}
                                    min={0}
                                    value={pointsToRedeem || ''}
                                    onChange={(e) => setPointsToRedeem(Math.min(clientPoints, Math.max(0, parseInt(e.target.value) || 0)))}
                                    placeholder="Quantos pontos?"
                                    className="flex-1 px-3 py-1.5 text-xs border border-yellow-300 rounded focus:ring-0 bg-white dark:bg-gray-800"
                                />
                                <button
                                    onClick={() => setPointsToRedeem(clientPoints)}
                                    className="px-3 py-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase rounded hover:bg-yellow-500 transition-colors"
                                >
                                    Tudo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
                    {cart.length > 0 ? (
                        <>
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-right-2">
                                    <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                        {item.product.image && <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{item.product.name}</h4>
                                            <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg bg-gray-50 px-1 dark:bg-gray-700">
                                                <button onClick={() => updateQuantity(idx, -1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Minus className="w-3 h-3" /></button>
                                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(idx, 1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">R$ {((item.product.sale_price || 0) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {recommendations.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Sugestões Interessantes
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {recommendations.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addToCart(p)}
                                                className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-50 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700 transition-all text-left shadow-sm hover:shadow-md group"
                                            >
                                                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                    {p.image && <img src={p.image} className="w-full h-full object-cover" alt={p.name} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors uppercase">{p.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-black">R$ {p.sale_price?.toFixed(2)}</p>
                                                </div>
                                                <Plus className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50">
                            <ShoppingCart className="w-16 h-16" />
                            <p>O carrinho está vazio</p>
                            <p className="text-xs text-center max-w-[200px]">Adicione produtos ou escaneie um código de barras para começar.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>R$ {(total || 0).toFixed(2)}</span>
                        </div>
                        {pointsToRedeem > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                <span>Desconto Fidelidade</span>
                                <span>- R$ {pointsDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white pt-2 border-t border-dashed">
                            <span>Total</span>
                            <span>R$ {(finalTotal || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        Finalizar Venda (F2)
                    </button>
                </div>
            </div>

            {/* Modal de Pagamento Avançado */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Finalizar Venda</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-500 uppercase font-bold">Total a Pagar</span>
                                <div className="text-2xl font-black text-gray-900 dark:text-white">R$ {finalTotal.toFixed(2)}</div>
                            </div>
                            <div className={`p-4 rounded-xl border ${remaining > 0 ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                <span className="text-xs uppercase font-bold opacity-70">Faltando</span>
                                <div className="text-2xl font-black">R$ {remaining.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'money', label: 'Dinheiro', icon: Banknote, color: 'text-green-600' },
                                    { id: 'pix', label: 'PIX', icon: QrCode, color: 'text-teal-600' },
                                    { id: 'credit', label: 'C. Crédito', icon: CreditCard, color: 'text-blue-600' },
                                    { id: 'debit', label: 'C. Débito', icon: CreditCard, color: 'text-orange-600' },
                                ].map(m => (
                                    <div key={m.id} className="relative">
                                        <m.icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${m.color}`} />
                                        <input
                                            type="number"
                                            placeholder={m.label}
                                            value={payments[m.id] || ''}
                                            onChange={(e) => setPayments(prev => ({ ...prev, [m.id]: parseFloat(e.target.value) || 0 }))}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Valor Recebido (Dinheiro) / Cálculo de Troco</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="number"
                                        placeholder="Quanto o cliente entregou?"
                                        value={receivedAmount || ''}
                                        onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                                        className="flex-1 px-4 py-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl text-xl font-black text-blue-700 dark:text-blue-300 focus:ring-0"
                                    />
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Troco</span>
                                        <div className={`text-2xl font-black ${change > 0 ? 'text-red-600' : 'text-gray-300'}`}>R$ {change.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={remaining > 0 && receivedAmount < finalTotal}
                            className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-green-100 dark:shadow-none transition-all disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-widest"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            Confirmar Venda
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;

