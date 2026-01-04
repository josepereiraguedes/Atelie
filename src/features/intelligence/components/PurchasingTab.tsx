import React, { useMemo } from 'react';
import { FileText, MessageSquare, CheckCircle, Package } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { useConfig } from '@/core/contexts/ConfigContext';
import { inventoryIntelligence } from '@/features/inventory/services/inventoryIntelligence';
import { purchaseService } from '@/features/purchasing/services/purchaseService';
import toast from 'react-hot-toast';

interface PurchasingTabProps {
  products: any[];
  transactions: any[];
  isLoading: boolean;
}

export const PurchasingTab: React.FC<PurchasingTabProps> = ({ products, transactions, isLoading }) => {
  const { company } = useConfig();
  const suggestedOrders = useMemo(() => {
    if (products.length === 0) return [];
    return inventoryIntelligence.getSuggestedPurchaseOrders(products, transactions);
  }, [products, transactions]);

  const predictions = useMemo(() => {
    if (products.length === 0) return [];
    return inventoryIntelligence.predictStockOut(products, transactions);
  }, [products, transactions]);

  const criticalPredictions = predictions.filter((p: any) => p.status === 'critical');

  const handleWhatsAppRestock = () => {
    const orders = suggestedOrders.length > 0 ? suggestedOrders : criticalPredictions.map((p: any) => {
      const product = products.find((prod: any) => prod.id === p.productId);
      return {
        name: p.productName,
        currentStock: product?.quantity || 0,
        suggestedQty: Math.ceil(p.averageDailySales * 30),
        runwayDays: p.daysOfStockLeft
      };
    });

    if (orders.length === 0) {
      toast.error('Nenhum produto para reposição.');
      return;
    }

    const date = new Date().toLocaleDateString();
    let message = `*PEDIDO DE REPOSIÇÃO - ${date}*\n\n`;
    message += `Olá! Gostaria de solicitar a reposição dos seguintes itens:\n\n`;

    orders.forEach((o: any) => {
      message += `• *${o.name}*
  - Estoque Atual: ${o.currentStock}
  - Sugestão: +${o.suggestedQty} un
  - Runway: ${o.runwayDays} dias restantes

`;
    });

    message += `\n_Gerado pelo ${company.name} Business Intelligence_`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handlePDFOrder = () => {
    const itemsToOrder = suggestedOrders.length > 0
      ? suggestedOrders.map((o: any) => ({ product: products.find((p: any) => p.id === o.productId)!, suggestedQuantity: o.suggestedQty }))
      : criticalPredictions.map((p: any) => ({ product: products.find((prod: any) => prod.id === p.productId)!, suggestedQuantity: Math.ceil(p.averageDailySales * 30) }));

    if (itemsToOrder.length === 0) {
      toast.error('Nenhum produto para reposição.');
      return;
    }

    const { company } = useConfig();
    purchaseService.generateOrderPDF(itemsToOrder, 'Fornecedor Parceiro', company.name);
    toast.success('Pedido PDF gerado com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Pedido Ótimo Sugerido</h2>
          <p className="text-sm text-gray-500 max-w-2xl font-medium">Quantidades calculadas para durar <strong>45 dias</strong> com base no consumo atual.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePDFOrder} className="px-5 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-black rounded-xl hover:bg-gray-200 transition-all text-[10px] uppercase tracking-widest border border-gray-200">
            <FileText className="w-4 h-4 inline mr-2" /> PDF
          </button>
          <button onClick={handleWhatsAppRestock} className="px-5 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-green-100">
            <MessageSquare className="w-4 h-4 inline mr-2" /> WhatsApp
          </button>
        </div>
      </div>

      {suggestedOrders.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Runway</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Qtd Atual</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Cobertura 45d</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Inves. Est</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {suggestedOrders.map((order: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${order.classification === 'A' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <span className="text-sm font-black text-gray-900 dark:text-white">{order.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-black ${order.runwayDays <= 7 ? 'text-red-500' : 'text-orange-500'}`}>
                      {order.runwayDays} dias
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-400 text-xs">{order.currentStock} un</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black rounded-lg text-xs">
                      + {order.suggestedQty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white text-sm">
                    R$ {order.estimatedCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Estoque Abastecido</h3>
          <p className="text-gray-500 text-sm mt-1">Nenhuma reposição urgente identificada nas projeções.</p>
        </div>
      )}
    </section>
  );
};
