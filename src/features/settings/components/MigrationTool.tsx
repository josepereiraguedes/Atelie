
import React, { useState } from 'react';
import { Database, ArrowRight, CheckCircle, Cloud, Server } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';

const MigrationTool: React.FC = () => {
    const {
        products,
        clients,
        suppliers,
        transactions,
        categories
    } = useLocalDatabase();

    const [status, setStatus] = useState<'idle' | 'checking' | 'migrating' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const checkConnection = async () => {
        setStatus('checking');
        addLog('Verificando conexão com o servidor de migração (localhost:3001)...');
        try {
            const res = await fetch('http://localhost:3001/api/health');
            if (res.ok) {
                addLog('✅ Conexão estabelecida com MySQL via Servidor Local.');
                return true;
            } else {
                throw new Error('Servidor respondeu com erro.');
            }
        } catch (e) {
            addLog('❌ Não foi possível conectar ao servidor. Verifique se ele está rodando (node server/index.js).');
            setStatus('error');
            return false;
        }
    };

    const handleMigration = async () => {
        const isConnected = await checkConnection();
        if (!isConnected) return;

        setStatus('migrating');
        addLog('📦 Empacotando dados do navegador...');

        const payload = {
            products,
            clients,
            suppliers,
            transactions,
            categories
        };

        addLog(`📊 Dados encontrados: ${products.length} produtos, ${clients.length} clientes, ${suppliers.length} fornecedores.`);

        try {
            addLog('🚀 Enviando dados para o MySQL...');

            const res = await fetch('http://localhost:3001/api/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                addLog('✨ ' + data.message);
                setStatus('success');
                toast.success('Migração Realizada com Sucesso!');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            addLog('❌ Erro durante a migração: ' + error.message);
            setStatus('error');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl mx-auto my-8">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                    <Database size={28} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Migração para Banco de Dados Profissional</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Transfira seus dados do navegador para o MySQL Seguro.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Server size={18} /> Por que migrar?
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1 ml-6 list-disc">
                        <li>Segurança: Seus dados não serão perdidos se limpar o hostórico/cache.</li>
                        <li>Backup Real: Dados salvos em arquivos .sql seguros.</li>
                        <li>Performance: Capacidade para milhares de produtos sem travar.</li>
                    </ul>
                </div>

                <div className="flex justify-center py-4">
                    <div className="flex items-center gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg w-32">
                            <Cloud className="mx-auto mb-2 text-gray-400" />
                            <span className="text-xs font-medium dark:text-white">Navegador (Atual)</span>
                        </div>
                        <ArrowRight className="text-gray-400 animate-pulse" />
                        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg w-32 border border-emerald-200 dark:border-emerald-700">
                            <Database className="mx-auto mb-2 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">MySQL (Novo)</span>
                        </div>
                    </div>
                </div>

                {log.length > 0 && (
                    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-xs h-40 overflow-y-auto">
                        {log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleMigration}
                        disabled={status === 'migrating' || status === 'success'}
                        className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all
              ${status === 'success'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30'}
              ${status === 'migrating' ? 'opacity-70 cursor-wait' : ''}
            `}
                    >
                        {status === 'migrating' ? 'Migrando...' : status === 'success' ? 'Migração Concluída' : 'Iniciar Migração Agora'}
                        {status === 'success' && <CheckCircle size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MigrationTool;

