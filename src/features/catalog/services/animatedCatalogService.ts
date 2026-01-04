import { CatalogProduct, CatalogTheme } from '@/shared/types';
import { catalogService } from '@/features/catalog/services/catalogService';

/**
 * Serviço para gerar sequência de imagens animadas
 * Como alternativa ao GIF, gera múltiplas imagens que podem ser usadas em Stories
 */

export interface AnimatedCatalogFrame {
    blob: Blob;
    productIndex: number;
    productName: string;
}

export interface AnimatedCatalogResult {
    frames: AnimatedCatalogFrame[];
    totalFrames: number;
    format: 'png';
    theme: CatalogTheme;
}

class AnimatedCatalogService {
    /**
     * Gera sequência de imagens para Stories (formato 1080x1920)
     * Cada produto aparece em um frame separado
     */
    async generateAnimatedSequence(
        products: CatalogProduct[],
        title: string,
        theme: CatalogTheme
    ): Promise<AnimatedCatalogResult> {
        const frames: AnimatedCatalogFrame[] = [];

        // Gerar um frame para cada produto
        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            // Gerar catálogo de 1 produto (formato Stories)
            const result = await catalogService.generateCatalog({
                products: [product],
                title: `${title} ${i + 1}/${products.length}`,
                theme,
                layout: '1-product'
            });

            frames.push({
                blob: result.blob,
                productIndex: i,
                productName: product.name || `Produto ${i + 1}`
            });
        }

        return {
            frames,
            totalFrames: frames.length,
            format: 'png',
            theme
        };
    }

    /**
     * Gera sequência com transição (2 produtos por frame)
     * Útil para comparações
     */
    async generateComparisonSequence(
        products: CatalogProduct[],
        title: string,
        theme: CatalogTheme
    ): Promise<AnimatedCatalogResult> {
        const frames: AnimatedCatalogFrame[] = [];

        // Agrupar produtos em pares
        for (let i = 0; i < products.length; i += 2) {
            const pair = products.slice(i, i + 2);

            if (pair.length === 0) break;

            const result = await catalogService.generateCatalog({
                products: pair,
                title: `${title} ${Math.floor(i / 2) + 1}/${Math.ceil(products.length / 2)}`,
                theme,
                layout: pair.length === 2 ? '2-products' : '1-product'
            });

            frames.push({
                blob: result.blob,
                productIndex: i,
                productName: pair.map(p => p.name).join(' + ')
            });
        }

        return {
            frames,
            totalFrames: frames.length,
            format: 'png',
            theme
        };
    }

    /**
     * Baixa todas as imagens da sequência como ZIP
     */
    async downloadSequenceAsZip(
        frames: AnimatedCatalogFrame[],
        baseName: string
    ): Promise<void> {
        // Nota: Implementação simplificada - baixa frames individualmente
        // Para ZIP real, seria necessário adicionar biblioteca JSZip

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const url = URL.createObjectURL(frame.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseName}_frame_${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Pequeno delay entre downloads
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    /**
     * Copia primeiro frame para clipboard
     */
    async copyFirstFrame(frames: AnimatedCatalogFrame[]): Promise<void> {
        if (frames.length === 0) return;

        const firstFrame = frames[0];
        if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
                new ClipboardItem({ [firstFrame.blob.type]: firstFrame.blob })
            ]);
        }
    }
}

export const animatedCatalogService = new AnimatedCatalogService();



