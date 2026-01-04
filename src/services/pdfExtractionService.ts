import * as pdfjs from 'pdfjs-dist';

// Configurar o worker do PDF.js para carregar localmente (evita erro de CSP no Electron/Vite)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
).href;

export interface ExtractedPDFItem {
    id: string;
    name: string;
    price: number;
    sku?: string;
    barcode?: string;
    category?: string;
    image?: string;
    confidence: number;
    x: number;
    y: number;
    page: number;
}

export interface PDFTextItem {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    fontSize: number;
    fontName: string;
}

export const pdfExtractionService = {
    /**
     * Carrega e extrai dados estruturados de um arquivo PDF
     */
    async extractData(file: File): Promise<{ items: ExtractedPDFItem[], totalPages: number }> {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        const allTexts: PDFTextItem[] = [];
        const pricePattern = /(?:R\$|RS)\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2}))|(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/i;
        const skuPattern = /(?:REF|SKU|CÓD|COD)[\.:\s]*([A-Z0-9-]{3,15})/i;
        const eanPattern = /\b\d{13}\b/;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });

            textContent.items.forEach((item: any) => {
                const transform = item.transform;
                // Normalizando coordenadas (x, y) de cima para baixo
                allTexts.push({
                    text: item.str.trim(),
                    x: transform[4],
                    y: viewport.height - transform[5],
                    width: item.width,
                    height: item.height,
                    fontSize: Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]),
                    fontName: item.fontName,
                    page: i
                });
            });
        }

        // Agrupamento por proximidade e análise de estilo
        const extractedItems: ExtractedPDFItem[] = [];

        allTexts.forEach((item) => {
            const priceMatch = item.text.match(pricePattern);
            if (priceMatch) {
                const priceStr = priceMatch[1] || priceMatch[2];
                const priceVal = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));

                // Buscar informações complementares em um raio maior (200px)
                let bestName = "";
                let bestSku = "";
                let bestEan = "";
                let maxFontSize = 0;
                let minDistance = 1000;

                allTexts.forEach((other) => {
                    if (other.page === item.page && other !== item && other.text.length > 2) {
                        const dist = Math.sqrt(Math.pow(other.x - item.x, 2) + Math.pow(other.y - item.y, 2));

                        if (dist < 180) {
                            // Detectar SKU
                            const skuMatch = other.text.match(skuPattern);
                            if (skuMatch && !bestSku) bestSku = skuMatch[1];

                            // Detectar EAN
                            const eanMatch = other.text.match(eanPattern);
                            if (eanMatch && !bestEan) bestEan = eanMatch[0];

                            // Heurística de Nome: Maior fonte ou negrito perto do preço
                            // Ignorar textos que pareçam preços ou códigos
                            const isTechnical = other.text.match(pricePattern) || other.text.match(skuPattern) || other.text.match(eanPattern);

                            if (!isTechnical) {
                                if (other.fontSize > maxFontSize) {
                                    maxFontSize = other.fontSize;
                                    bestName = other.text;
                                } else if (other.fontSize === maxFontSize && dist < minDistance) {
                                    minDistance = dist;
                                    bestName = other.text;
                                }
                            }
                        }
                    }
                });

                if (bestName) {
                    extractedItems.push({
                        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        name: bestName,
                        price: priceVal,
                        sku: bestSku,
                        barcode: bestEan,
                        confidence: maxFontSize > 10 ? 0.9 : 0.7,
                        x: item.x,
                        y: item.y,
                        page: item.page
                    });
                }
            }
        });

        // Filtrar duplicados (mesmo nome e preço na mesma página)
        const uniqueItems = extractedItems.filter((v, i, a) =>
            a.findIndex(t => t.name === v.name && t.price === v.price && t.page === v.page) === i
        );

        return {
            items: uniqueItems,
            totalPages
        };
    },

    /**
     * Captura uma área da página como imagem
     */
    async captureImageArea(file: File, pageNumber: number, x: number, y: number): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNumber);

        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;

        const cropCanvas = document.createElement('canvas');
        const cropContext = cropCanvas.getContext('2d');

        const padding = 180; // Aumentado para pegar melhor a imagem
        cropCanvas.width = padding * 2;
        cropCanvas.height = padding * 2;

        // Tentar centrar a captura ACIMA do preço (onde as imagens costumam ficar)
        cropContext?.drawImage(
            canvas,
            (x * scale) - padding, (y * scale) - (padding * 2.5), padding * 2, padding * 2,
            0, 0, padding * 2, padding * 2
        );

        return cropCanvas.toDataURL('image/jpeg', 0.8);
    }
};
