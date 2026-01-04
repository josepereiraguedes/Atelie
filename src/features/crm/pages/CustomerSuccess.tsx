import { useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { useConfig } from '@/core/contexts/ConfigContext';
import { crmService, RFMResult } from '@/features/crm/services/crmService';
import { Star, MessageSquare, Heart, DollarSign, Target, Activity, Cake, RefreshCw, RefreshCcw, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { predictionService } from '@/features/purchasing/services/predictionService';
import { crmRelationshipService } from '@/services/crmRelationshipService';

const CustomerSuccess: React.FC = () => {
    const { clients, transactions, products, isLoading } = useLocalDatabase();
    const { company } = useConfig();

    const rfmData = useMemo(() => {
        if (clients.length === 0) return [];
        return crmService.calculateRFM(clients, transactions, products);
    }, [clients, transactions, products]);

    const birthdayAlerts = useMemo(() => {
        return crmService.getBirthdayAlerts(clients);
    }, [clients]);

    const rePurchaseAlerts = useMemo(() => {
        return crmService.getRePurchaseAlerts(clients, transactions, products);
    }, [clients, transactions, products]);

    const churnAlerts = useMemo(() => {
        return predictionService.detectChurnRisk(transactions, clients);
    }, [transactions, clients]);

    const relationshipActions = useMemo(() => {
        return crmRelationshipService.getRelationshipActions(clients, transactions);
    }, [clients, transactions]);

    const stats = useMemo(() => {
        const total = rfmData.length;
        if (total === 0) return null;

        const avgLtv = rfmData.reduce((sum, d) => sum + d.ltv, 0) / total;
        const avgChurn = rfmData.reduce((sum, d) => sum + d.churnProbability, 0) / total;
        const totalAtRiskMonetary = rfmData
            .filter(d => d.churnProbability > 50)
            .reduce((sum, d) => sum + d.monetary, 0);

        return {
            vip: rfmData.filter(d => d.segment === 'VIP').length,
            stars: rfmData.filter(d => d.segment === 'Estrela').length,
            atRisk: rfmData.filter(d => d.segment === 'Em Risco').length,
            avgLtv,
            avgChurn,
            totalAtRiskMonetary
        };
    }, [rfmData]);

    const handleRecoveryWhatsApp = (client: RFMResult) => {
        const rawClient = clients.find(c => c.id === client.clientId);
        if (!rawClient?.phone) {
            toast.error('Cliente sem telefone cadastrado.');
            return;
        }

        const cleanPhone = rawClient.phone.replace(/\D/g, '');
        const formattedPhone = (cleanPhone.length === 11 || cleanPhone.length === 10) ? `55${cleanPhone}` : cleanPhone;

        let message = `Olá ${client.clientName}! `;
        if (client.segment === 'Em Risco') {
            message += `Sentimos sua falta! Separamos uma condição especial para você voltar a comprar conosco hoje. Que tal conferir as novidades?`;
        } else if (client.segment === 'VIP') {
            message += `Como você é um de nossos clientes mais especiais, acabo de separar alguns lançamentos que combinam perfeitamente com seu perfil. Posso te enviar as fotos?`;
        } else if (client.segment === 'Estrela') {
            message += `Passando para agradecer pela última compra de alto valor! Ficamos felizes com sua confiança. Temos algo exclusivo que você vai gostar.`;
        } else {
            message += `Passando para dar um oi e ver se está precisando de algo do nosso estoque hoje!`;
        }

        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (isLoading) return <div className="p-8 text-center">Carregando inteligência de clientes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-8 h-8 text-pink-500" />
                        CRM Avançado & Sucesso do Cliente
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Gestão preditiva de valor e fidelidade.</p>
                </div>
            </header>

            {/* Central de Alertas do Vendedor Virtual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aniversariantes */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Cake className="w-5 h-5 text-pink-500" />
                            Aniversariantes do Dia
                        </h3>
                        <span className="text-[10px] font-black bg-pink-100 text-pink-700 px-2 py-1 rounded-full">{birthdayAlerts.length}</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {birthdayAlerts.length > 0 ? birthdayAlerts.map(alert => (
                            <div key={alert.clientId} className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-900/10 rounded-2xl border border-pink-100 dark:border-pink-900/20">
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{alert.clientName}</div>
                                    <div className="text-[10px] text-pink-600 font-black uppercase">Festa hoje! 🎂</div>
                                </div>
                                <a
                                    href={alert.waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-100 dark:shadow-none"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </a>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">Nenhum aniversariante hoje.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Clientes Esfriando (Churn Risk) */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5 text-orange-500" />
                            Clientes "Esfriando" (Churn)
                        </h3>
                        <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{churnAlerts.length}</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {churnAlerts.length > 0 ? churnAlerts.map((client: any) => (
                            <div key={client.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{client.name}</div>
                                    <div className="text-[9px] text-orange-600 font-black uppercase flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {client.daysSinceLast} dias sem comprar (Média {client.avgInterval})
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const cleanPhone = client.phone?.replace(/\D/g, '');
                                        const formattedPhone = (cleanPhone?.length === 11 || cleanPhone?.length === 10) ? `55${cleanPhone}` : cleanPhone;
                                        const message = `Olá ${client.name}! Sentimos sua falta aqui no ${company.name}. Preparamos uma novidade exclusiva para você voltar a nos visitar. Que tal conferir?`;
                                        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-100"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <div className="py-8 text-center text-gray-400 text-xs italic">
                                Todos os clientes estão com frequência saudável.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Régua de Relacionamento (Pós-Venda Automático) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-500" />
                            Régua de Relacionamento
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Trilha Estratégica de Pós-Venda</p>
                    </div>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">
                        {relationshipActions.length} AÇÕES SUGERIDAS HOJE
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relationshipActions.length > 0 ? relationshipActions.map((action, idx) => (
                        <div key={`${action.clientId}-${idx}`} className="flex flex-col justify-between p-5 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:border-blue-200 transition-all group">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${action.type === 'satisfaction' ? 'bg-emerald-100 text-emerald-700' :
                                        action.type === 'reposição' ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                        {action.type} - {action.daysSince} DIAS
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">{new Date(action.lastPurchaseDate).toLocaleDateString()}</span>
                                </div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1 truncate">{action.clientName}</h4>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3">{action.suggestion}</p>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">
                                    "{action.message}"
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const cleanPhone = action.phone.replace(/\D/g, '');
                                    const formattedPhone = (cleanPhone.length === 11 || cleanPhone.length === 10) ? `55${cleanPhone}` : cleanPhone;
                                    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(action.message)}`, '_blank');
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl font-black text-[10px] text-gray-600 dark:text-gray-300 uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Iniciar Ciclo
                            </button>
                        </div>
                    )) : (
                        <div className="md:col-span-3 flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8 text-gray-100" />
                            </div>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma régua de contato atingida hoje.</p>
                            <p className="text-xs text-gray-400 mt-1 italic">Venda mais para alimentar sua inteligência de contato!</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Alertas de Recompra */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            Previsão de Recompra
                        </h3>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{rePurchaseAlerts.length}</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {rePurchaseAlerts.length > 0 ? rePurchaseAlerts.map((alert, idx) => (
                            <div key={`${alert.clientId}-${alert.productId}-${idx}`} className={`flex items-center justify-between p-3 rounded-2xl border ${alert.status === 'crítico' ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20'}`}>
                                <div className="min-w-0 flex-1 pr-4">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{alert.clientName}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">Reposição de: <span className="font-black text-gray-700 dark:text-gray-300">{alert.productName}</span></div>
                                    <div className={`text-[9px] font-black uppercase mt-1 ${alert.status === 'crítico' ? 'text-red-500' : 'text-blue-500'}`}>
                                        Há {alert.daysSinceLastPurchase} dias (Intervalo Médio: {alert.avgIntervalDays}d)
                                    </div>
                                </div>
                                <a
                                    href={alert.waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-2 rounded-xl text-white transition-colors shadow-lg ${alert.status === 'crítico' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-100'} dark:shadow-none`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </a>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">Sem alertas de recompra no momento.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 text-pink-600 mb-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">LTV Médio</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">R$ {stats.avgLtv.toFixed(0)}</div>
                        <p className="text-[10px] text-gray-400 mt-1">Lucro esperado por vida de cliente</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Risco de Churn</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.avgChurn.toFixed(1)}%</div>
                        <p className="text-[10px] text-gray-400 mt-1">Probabilidade média de abandono</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 text-yellow-600 mb-2">
                            <Star className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Público VIP/Estrela</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.vip + stats.stars}</div>
                        <p className="text-[10px] text-gray-400 mt-1">Clientes de alto valor e potencial</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-600 to-pink-600 p-6 rounded-3xl text-white shadow-lg shadow-red-100 dark:shadow-none">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Receita em Risco</span>
                        </div>
                        <div className="text-3xl font-black">R$ {stats.totalAtRiskMonetary.toFixed(0)}</div>
                        <p className="text-[10px] opacity-80 mt-1">Recuperação urgente necessária</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Inteligência de Base</h2>
                    <span className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-500 rounded-full text-[10px] font-black">{rfmData.length} CLIENTES MAPEADOS</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/80 text-[10px] text-gray-400 uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4 text-center">Segmento</th>
                                <th className="px-6 py-4 text-center">LTV / Ticket</th>
                                <th className="px-6 py-4 text-center">Pontos</th>
                                <th className="px-6 py-4 text-center">Risco Churn</th>
                                <th className="px-6 py-4">Próxima Melhor Ação (NBA)</th>
                                <th className="px-6 py-4 text-center">Contato</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {rfmData.map((item) => (
                                <tr key={item.clientId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900 dark:text-white">{item.clientName}</div>
                                        <div className="text-[10px] text-gray-400 font-bold">SCORE: {item.score.toFixed(0)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm ${item.segment === 'VIP' ? 'bg-yellow-400 text-yellow-900' :
                                            item.segment === 'Em Risco' ? 'bg-red-500 text-white' :
                                                item.segment === 'Fiel' ? 'bg-emerald-400 text-white' :
                                                    item.segment === 'Estrela' ? 'bg-indigo-500 text-white' :
                                                        'bg-gray-200 text-gray-600'
                                            }`}>
                                            {item.segment}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-sm font-black text-gray-700 dark:text-gray-300">R$ {item.ltv.toFixed(0)}</div>
                                        <div className="text-[10px] text-gray-400">TM: R$ {item.avgTicket.toFixed(0)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-sm font-black text-yellow-600">{clients.find(c => c.id === item.clientId)?.loyalty_points || 0}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Acumulados</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-full max-w-[80px] bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mb-1">
                                                <div
                                                    className={`h-full rounded-full ${item.churnProbability > 70 ? 'bg-red-500' : item.churnProbability > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${item.churnProbability}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500">{item.churnProbability}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.nextBestAction}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleRecoveryWhatsApp(item)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${item.churnProbability > 50 ? 'bg-red-600 text-white hover:scale-105 shadow-md shadow-red-100' : 'bg-green-600 text-white hover:scale-105 shadow-md shadow-green-100'
                                                    }`}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                CONTATO
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerSuccess;

