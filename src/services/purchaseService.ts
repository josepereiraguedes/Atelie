import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Product } from '@/shared/types/database.types';

interface PurchaseItem {
    product: Product;
    suggestedQuantity: number;
}

export const purchaseService = {
    generateOrderPDF: (items: PurchaseItem[], supplierName: string = 'Fornecedor Parceiro', companyName: string = 'Minha Empresa') => {
        const doc = new jsPDF() as any;
        const date = new Date().toLocaleDateString('pt-BR');
        const orderNumber = Math.floor(Math.random() * 90000) + 10000;

        // Cabeçalho
        doc.setFontSize(22);
        doc.setTextColor(30, 64, 175); // Blue-700
        doc.text('PEDIDO DE COMPRA', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${companyName.toUpperCase()} - GESTÃO INTELIGENTE`, 105, 28, { align: 'center' });

        // Informações do Pedido
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Número do Pedido: #${orderNumber}`, 14, 45);
        doc.text(`Data: ${date}`, 14, 52);
        doc.text(`Fornecedor: ${supplierName}`, 14, 59);

        // Tabela de Itens
        const tableBody = items.map(item => [
            item.product.sku || '-',
            item.product.name,
            `${item.suggestedQuantity} ${item.product.unit || 'un'}`,
            `R$ ${(item.product.cost || 0).toFixed(2)}`,
            `R$ ${(item.suggestedQuantity * (item.product.cost || 0)).toFixed(2)}`
        ]);

        const totalOrder = items.reduce((sum, item) => sum + (item.suggestedQuantity * (item.product.cost || 0)), 0);

        (doc as any).autoTable({
            startY: 70,
            head: [['SKU', 'Produto', 'Quantidade', 'R$ Unit.', 'Total']],
            body: tableBody,
            headStyles: { fillColor: [30, 64, 175] },
            foot: [['', '', '', 'TOTAL ESTIMADO:', `R$ ${totalOrder.toFixed(2)}`]],
            footStyles: { fillColor: [240, 249, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
            theme: 'grid'
        });

        // Rodapé
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Documento gerado automaticamente pelo Sistema ${companyName}.`, 105, finalY + 20, { align: 'center' });
        doc.text('Favor confirmar o recebimento deste pedido.', 105, finalY + 25, { align: 'center' });

        // Abrir/Baixar
        doc.save(`pedido_compra_${orderNumber}.pdf`);
    }
};
