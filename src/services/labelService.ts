import { jsPDF } from 'jspdf';
import { Product } from '@/shared/types/database.types';

export interface LabelConfig {
    width: number; // mm
    height: number; // mm
    columns: number;
    rows: number;
    fontSize: number;
    showPrice: boolean;
    showName: boolean;
    showBarcode: boolean;
}

export const labelService = {
    generatePDF(products: (Product & { labelQty: number })[], config: LabelConfig) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [210, 297] // A4 padrão para etiquetas
        });

        const labelWidth = (210 - 20) / config.columns; // 10mm margem
        const labelHeight = (297 - 20) / config.rows;

        let currentX = 10;
        let currentY = 10;
        let col = 0;
        let row = 0;

        products.forEach(product => {
            for (let i = 0; i < product.labelQty; i++) {
                if (row >= config.rows) {
                    doc.addPage();
                    row = 0;
                    col = 0;
                    currentX = 10;
                    currentY = 10;
                }

                // Desenhar borda da etiqueta (opcional)
                doc.setDrawColor(230);
                doc.rect(currentX, currentY, labelWidth, labelHeight);

                // Nome do Produto
                if (config.showName) {
                    doc.setFontSize(config.fontSize - 2);
                    doc.setFont('helvetica', 'bold');
                    const splitName = doc.splitTextToSize(product.name, labelWidth - 4);
                    doc.text(splitName, currentX + 2, currentY + 5);
                }

                // Preço
                if (config.showPrice) {
                    doc.setFontSize(config.fontSize + 4);
                    doc.setTextColor(0);
                    doc.text(`R$ ${product.sale_price.toFixed(2)}`, currentX + 2, currentY + labelHeight - 5);
                }

                // EAN / SKU (Texto simples por enquanto, jspdf não gera barras nativo sem plugins)
                if (config.showBarcode && product.sku) {
                    doc.setFontSize(config.fontSize - 4);
                    doc.text(product.sku, currentX + labelWidth - 2, currentY + labelHeight - 5, { align: 'right' });
                }

                col++;
                currentX += labelWidth;

                if (col >= config.columns) {
                    col = 0;
                    currentX = 10;
                    row++;
                    currentY += labelHeight;
                }
            }
        });

        return doc;
    }
};
