import { CatalogGenerationOptions, CatalogResult, CatalogLayout, WatermarkConfig } from '@/shared/types/database.types';
import { getTheme } from '@/features/catalog/services/catalogThemes';

/**
 * Serviço principal de geração de catálogos visuais
 * Suporta múltiplos layouts, temas e formatos
 */
class CatalogService {
    /**
     * Determina o layout automaticamente baseado na quantidade de produtos
     */
    private getAutoLayout(productCount: number): CatalogLayout {
        if (productCount === 1) return '1-product';
        if (productCount === 2) return '2-products';
        if (productCount === 3) return '3-products';
        return '4-products';
    }

    /**
     * Gera catálogo visual com todas as opções
     */
    async generateCatalog(options: CatalogGenerationOptions): Promise<CatalogResult> {
        const layout = options.layout || this.getAutoLayout(options.products.length);
        const theme = getTheme(options.theme);

        let blob: Blob | null = null;

        switch (layout) {
            case '1-product':
                blob = await this.generate1ProductLayout(options, theme);
                break;
            case '2-products':
                blob = await this.generate2ProductsLayout(options, theme);
                break;
            case '3-products':
                blob = await this.generate3ProductsLayout(options, theme);
                break;
            case '4-products':
                blob = await this.generate4ProductsLayout(options, theme);
                break;
        }

        if (!blob) {
            throw new Error('Falha ao gerar catálogo');
        }

        return {
            blob,
            format: options.format || 'png',
            layout,
            theme: options.theme,
            timestamp: Date.now()
        };
    }

    /**
     * Layout 1: Banner horizontal premium (1920x1080)
     */
    private async generate1ProductLayout(options: any, theme: any): Promise<Blob | null> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            canvas.width = 1920;
            canvas.height = 1080;

            // Fundo com gradiente
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, theme.colors.background[0]);
            bgGradient.addColorStop(1, theme.colors.background[1]);
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Cabeçalho com gradiente
            const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            theme.colors.headerGradient.forEach((color: string, i: number) => {
                headerGradient.addColorStop(i / (theme.colors.headerGradient.length - 1), color);
            });
            ctx.fillStyle = headerGradient;
            ctx.shadowColor = theme.effects.shadowColor;
            ctx.shadowBlur = theme.effects.shadowBlur;
            ctx.shadowOffsetY = 10;
            ctx.fillRect(0, 0, canvas.width, 250);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Título
            ctx.fillStyle = theme.id === 'minimal' ? theme.colors.textPrimary : '#ffffff';
            ctx.font = theme.fonts.header;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 15;
            ctx.fillText(options.title.toUpperCase(), canvas.width / 2, 155);
            ctx.shadowBlur = 0;

            // Carregar imagem do produto
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = options.products[0].image || '';

            img.onload = () => {
                // Área do produto (esquerda)
                const productAreaW = canvas.width * 0.5;
                const productAreaH = canvas.height - 300;
                const productScale = Math.min(productAreaW / img.width, productAreaH / img.height) * 0.8;
                const scaledW = img.width * productScale;
                const scaledH = img.height * productScale;
                const imgX = (productAreaW / 2) - (scaledW / 2);
                const imgY = 300 + (productAreaH / 2) - (scaledH / 2);

                ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

                // Área de informações (direita)
                const infoX = canvas.width * 0.55;
                const infoY = 400;

                // Badge
                const badgeGradient = ctx.createLinearGradient(infoX, infoY, infoX + 300, infoY + 100);
                theme.colors.badgeGradient.forEach((color: string, i: number) => {
                    badgeGradient.addColorStop(i, color);
                });
                ctx.fillStyle = badgeGradient;
                ctx.shadowColor = theme.effects.shadowColor;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.roundRect(infoX, infoY, 300, 100, theme.effects.borderRadius);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = theme.id === 'minimal' || theme.id === 'elegant' || theme.id === 'black-friday' ? '#ffffff' : '#ffffff';
                ctx.font = 'bold 36px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${theme.badge.emoji} ${theme.badge.text}`, infoX + 30, infoY + 65);

                // Nome do produto
                ctx.fillStyle = theme.colors.textPrimary;
                ctx.font = 'bold 48px Inter, sans-serif';
                ctx.textAlign = 'left';
                const productName = options.products[0].name.length > 30
                    ? options.products[0].name.substring(0, 30) + '...'
                    : options.products[0].name;
                ctx.fillText(productName, infoX, infoY + 180);

                // Preço
                const priceGradient = ctx.createLinearGradient(infoX, infoY + 250, infoX + 400, infoY + 250);
                theme.colors.priceGradient.forEach((color: string, i: number) => {
                    priceGradient.addColorStop(i, color);
                });
                ctx.fillStyle = priceGradient;
                ctx.font = 'bold 80px Inter, sans-serif';
                ctx.fillText(`R$ ${Number(options.products[0].price).toFixed(2)}`, infoX, infoY + 280);

                // Call to action
                ctx.fillStyle = theme.colors.textSecondary;
                ctx.font = '32px Inter, sans-serif';
                ctx.fillText('💬 Chame agora e garanta o seu!', infoX, infoY + 380);

                // Marca d'água
                if (options.watermark?.enabled) {
                    this.drawWatermark(ctx, canvas, options.watermark, theme);
                }

                canvas.toBlob(resolve, 'image/png');
            };

            img.onerror = () => resolve(null);
        });
    }

    /**
     * Layout 2: Comparação lado a lado
     */
    private async generate2ProductsLayout(options: any, theme: any): Promise<Blob | null> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            canvas.width = 1080;
            canvas.height = 1080;

            // Fundo
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, theme.colors.background[0]);
            bgGradient.addColorStop(1, theme.colors.background[1]);
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Cabeçalho
            const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            theme.colors.headerGradient.forEach((color: string, i: number) => {
                headerGradient.addColorStop(i / (theme.colors.headerGradient.length - 1), color);
            });
            ctx.fillStyle = headerGradient;
            ctx.shadowColor = theme.effects.shadowColor;
            ctx.shadowBlur = theme.effects.shadowBlur;
            ctx.shadowOffsetY = 5;
            ctx.fillRect(0, 0, canvas.width, 180);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Título
            ctx.fillStyle = theme.id === 'minimal' ? theme.colors.textPrimary : '#ffffff';
            ctx.font = theme.fonts.header;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.fillText(options.title.toUpperCase(), canvas.width / 2, 110);
            ctx.shadowBlur = 0;

            // Carregar imagens
            const loadImages = options.products.slice(0, 2).map((p: any) => {
                return new Promise<HTMLImageElement>((res) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = p.image || '';
                    img.onload = () => res(img);
                    img.onerror = () => res(new Image());
                });
            });

            Promise.all(loadImages).then(images => {
                const padding = 50;
                const topMargin = 200;
                const cellW = (canvas.width - padding * 3) / 2;
                const cellH = canvas.height - topMargin - padding * 2 - 80;

                images.forEach((img, i) => {
                    if (!img.src) return;

                    const x = padding + (i * (cellW + padding));
                    const y = topMargin + padding;

                    // Card
                    ctx.fillStyle = theme.colors.cardBg;
                    ctx.shadowColor = theme.effects.shadowColor;
                    ctx.shadowBlur = theme.effects.shadowBlur;
                    ctx.shadowOffsetY = 8;
                    ctx.beginPath();
                    ctx.roundRect(x, y, cellW, cellH, theme.effects.borderRadius);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetY = 0;

                    // Badge
                    const badgeGradient = ctx.createLinearGradient(x, y, x + 120, y + 40);
                    theme.colors.badgeGradient.forEach((color: string, idx: number) => {
                        badgeGradient.addColorStop(idx, color);
                    });
                    ctx.fillStyle = badgeGradient;
                    ctx.beginPath();
                    ctx.moveTo(x + 20, y);
                    ctx.lineTo(x + 140, y);
                    ctx.lineTo(x + 120, y + 40);
                    ctx.lineTo(x, y + 40);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = theme.id === 'minimal' || theme.id === 'elegant' || theme.id === 'black-friday' ? '#ffffff' : '#ffffff';
                    ctx.font = 'bold 16px Inter, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${theme.badge.emoji} ${theme.badge.text}`, x + 15, y + 25);

                    // Imagem
                    const imgPadding = 30;
                    const maxImgW = cellW - (imgPadding * 2);
                    const maxImgH = cellH - 180;
                    const productScale = Math.min(maxImgW / img.width, maxImgH / img.height);
                    const scaledW = img.width * productScale;
                    const scaledH = img.height * productScale;
                    const imgX = x + (cellW / 2) - (scaledW / 2);
                    const imgY = y + 60;

                    ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

                    // Linha divisória
                    ctx.strokeStyle = theme.id === 'minimal' ? '#e5e7eb' : '#e2e8f0';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 20, y + cellH - 110);
                    ctx.lineTo(x + cellW - 20, y + cellH - 110);
                    ctx.stroke();

                    // Nome
                    ctx.fillStyle = theme.colors.textPrimary;
                    ctx.font = theme.fonts.body;
                    ctx.textAlign = 'center';
                    const productName = options.products[i].name.length > 20
                        ? options.products[i].name.substring(0, 20) + '...'
                        : options.products[i].name;
                    ctx.fillText(productName, x + cellW / 2, y + cellH - 70);

                    // Preço
                    const priceGradient = ctx.createLinearGradient(x, y + cellH - 30, x + cellW, y + cellH - 30);
                    theme.colors.priceGradient.forEach((color: string, idx: number) => {
                        priceGradient.addColorStop(idx, color);
                    });
                    ctx.fillStyle = priceGradient;
                    ctx.font = 'bold 32px Inter, sans-serif';
                    ctx.fillText(`R$ ${Number(options.products[i].price).toFixed(2)}`, x + cellW / 2, y + cellH - 30);
                });

                // Rodapé
                ctx.fillStyle = theme.colors.textSecondary;
                ctx.font = '24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💬 Chame agora e garanta o seu!', canvas.width / 2, canvas.height - 30);

                // Marca d'água
                if (options.watermark?.enabled) {
                    this.drawWatermark(ctx, canvas, options.watermark, theme);
                }

                canvas.toBlob(resolve, 'image/png');
            });
        });
    }

    /**
     * Layout 3: Grid assimétrico (1 grande + 2 pequenos)
     */
    private async generate3ProductsLayout(options: any, theme: any): Promise<Blob | null> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            canvas.width = 1080;
            canvas.height = 1350; // Mais alto para acomodar 3 produtos

            // Fundo
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, theme.colors.background[0]);
            bgGradient.addColorStop(1, theme.colors.background[1]);
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Cabeçalho
            const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            theme.colors.headerGradient.forEach((color: string, i: number) => {
                headerGradient.addColorStop(i / (theme.colors.headerGradient.length - 1), color);
            });
            ctx.fillStyle = headerGradient;
            ctx.shadowColor = theme.effects.shadowColor;
            ctx.shadowBlur = theme.effects.shadowBlur;
            ctx.shadowOffsetY = 5;
            ctx.fillRect(0, 0, canvas.width, 180);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Título
            ctx.fillStyle = theme.id === 'minimal' ? theme.colors.textPrimary : '#ffffff';
            ctx.font = theme.fonts.header;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.fillText(options.title.toUpperCase(), canvas.width / 2, 110);
            ctx.shadowBlur = 0;

            // Carregar imagens
            const loadImages = options.products.slice(0, 3).map((p: any) => {
                return new Promise<HTMLImageElement>((res) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = p.image || '';
                    img.onload = () => res(img);
                    img.onerror = () => res(new Image());
                });
            });

            Promise.all(loadImages).then(images => {
                const padding = 50;
                const topMargin = 200;

                // Produto principal (grande, topo)
                const mainW = canvas.width - (padding * 2);
                const mainH = 600;
                const mainX = padding;
                const mainY = topMargin + padding;

                this.drawProductCard(ctx, images[0], options.products[0], theme, mainX, mainY, mainW, mainH, true);

                // Produtos secundários (pequenos, embaixo)
                const secondaryW = (canvas.width - padding * 3) / 2;
                const secondaryH = 450;
                const secondaryY = mainY + mainH + padding;

                this.drawProductCard(ctx, images[1], options.products[1], theme, padding, secondaryY, secondaryW, secondaryH, false);
                this.drawProductCard(ctx, images[2], options.products[2], theme, padding + secondaryW + padding, secondaryY, secondaryW, secondaryH, false);

                // Rodapé
                ctx.fillStyle = theme.colors.textSecondary;
                ctx.font = '24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💬 Chame agora e garanta o seu!', canvas.width / 2, canvas.height - 30);

                // Marca d'água
                if (options.watermark?.enabled) {
                    this.drawWatermark(ctx, canvas, options.watermark, theme);
                }

                canvas.toBlob(resolve, 'image/png');
            });
        });
    }

    /**
     * Layout 4: Grid 2x2 (atual aprimorado)
     */
    private async generate4ProductsLayout(options: any, theme: any): Promise<Blob | null> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            canvas.width = 1080;
            canvas.height = 1080;

            // Fundo
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, theme.colors.background[0]);
            bgGradient.addColorStop(1, theme.colors.background[1]);
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Cabeçalho
            const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            theme.colors.headerGradient.forEach((color: string, i: number) => {
                headerGradient.addColorStop(i / (theme.colors.headerGradient.length - 1), color);
            });
            ctx.fillStyle = headerGradient;
            ctx.shadowColor = theme.effects.shadowColor;
            ctx.shadowBlur = theme.effects.shadowBlur;
            ctx.shadowOffsetY = 5;
            ctx.fillRect(0, 0, canvas.width, 180);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Título
            ctx.fillStyle = theme.id === 'minimal' ? theme.colors.textPrimary : '#ffffff';
            ctx.font = theme.fonts.header;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.fillText(options.title.toUpperCase(), canvas.width / 2, 110);
            ctx.shadowBlur = 0;

            // Carregar imagens
            const loadImages = options.products.slice(0, 4).map((p: any) => {
                return new Promise<HTMLImageElement>((res) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = p.image || '';
                    img.onload = () => res(img);
                    img.onerror = () => res(new Image());
                });
            });

            Promise.all(loadImages).then(images => {
                const padding = 50;
                const topMargin = 200;
                const cellW = (canvas.width - padding * 3) / 2;
                const cellH = (canvas.height - topMargin - padding * 3 - 80) / 2;

                images.forEach((img, i) => {
                    if (!img.src) return;

                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    const x = padding + (col * (cellW + padding));
                    const y = topMargin + padding + (row * (cellH + padding));

                    this.drawProductCard(ctx, img, options.products[i], theme, x, y, cellW, cellH, false);
                });

                // Rodapé
                ctx.fillStyle = theme.colors.textSecondary;
                ctx.font = '24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💬 Chame agora e garanta o seu!', canvas.width / 2, canvas.height - 30);

                // Marca d'água
                if (options.watermark?.enabled) {
                    this.drawWatermark(ctx, canvas, options.watermark, theme);
                }

                canvas.toBlob(resolve, 'image/png');
            });
        });
    }

    /**
     * Função auxiliar para desenhar card de produto
     */
    private drawProductCard(
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        product: any,
        theme: any,
        x: number,
        y: number,
        w: number,
        h: number,
        isLarge: boolean
    ) {
        // Card
        ctx.fillStyle = theme.colors.cardBg;
        ctx.shadowColor = theme.effects.shadowColor;
        ctx.shadowBlur = theme.effects.shadowBlur;
        ctx.shadowOffsetY = 8;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, theme.effects.borderRadius);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Badge
        const badgeGradient = ctx.createLinearGradient(x, y, x + 120, y + 40);
        theme.colors.badgeGradient.forEach((color: string, i: number) => {
            badgeGradient.addColorStop(i, color);
        });
        ctx.fillStyle = badgeGradient;
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + 140, y);
        ctx.lineTo(x + 120, y + 40);
        ctx.lineTo(x, y + 40);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${isLarge ? '20px' : '16px'} Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`${theme.badge.emoji} ${theme.badge.text}`, x + 15, y + (isLarge ? 28 : 25));

        // Imagem
        const imgPadding = isLarge ? 40 : 30;
        const maxImgW = w - (imgPadding * 2);
        const maxImgH = h - (isLarge ? 200 : 140);
        const productScale = Math.min(maxImgW / img.width, maxImgH / img.height);
        const scaledW = img.width * productScale;
        const scaledH = img.height * productScale;
        const imgX = x + (w / 2) - (scaledW / 2);
        const imgY = y + (isLarge ? 70 : 50);

        ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

        // Linha divisória
        ctx.strokeStyle = theme.id === 'minimal' ? '#e5e7eb' : '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + h - (isLarge ? 120 : 90));
        ctx.lineTo(x + w - 20, y + h - (isLarge ? 120 : 90));
        ctx.stroke();

        // Nome
        ctx.fillStyle = theme.colors.textPrimary;
        ctx.font = `bold ${isLarge ? '28px' : '20px'} Inter, sans-serif`;
        ctx.textAlign = 'center';
        const maxChars = isLarge ? 35 : 28;
        const productName = product.name.length > maxChars
            ? product.name.substring(0, maxChars) + '...'
            : product.name;
        ctx.fillText(productName, x + w / 2, y + h - (isLarge ? 75 : 55));

        // Preço
        const priceGradient = ctx.createLinearGradient(x, y + h - 30, x + w, y + h - 30);
        theme.colors.priceGradient.forEach((color: string, i: number) => {
            priceGradient.addColorStop(i, color);
        });
        ctx.fillStyle = priceGradient;
        ctx.font = `bold ${isLarge ? '40px' : '32px'} Inter, sans-serif`;
        ctx.fillText(`R$ ${Number(product.price).toFixed(2)}`, x + w / 2, y + h - (isLarge ? 25 : 20));
    }

    /**
     * Desenha marca d'água personalizada
     */
    private drawWatermark(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        watermark: WatermarkConfig,
        theme: any
    ) {
        ctx.globalAlpha = watermark.opacity || 0.6;
        ctx.fillStyle = theme.colors.textSecondary;
        ctx.font = '20px Inter, sans-serif';

        let x = 0;
        let y = canvas.height - 20;

        switch (watermark.position) {
            case 'bottom-left':
                ctx.textAlign = 'left';
                x = 30;
                break;
            case 'bottom-right':
                ctx.textAlign = 'right';
                x = canvas.width - 30;
                break;
            case 'bottom-center':
                ctx.textAlign = 'center';
                x = canvas.width / 2;
                break;
        }

        if (watermark.type === 'text') {
            ctx.fillText(watermark.content, x, y);

            // Redes sociais
            if (watermark.socialMedia) {
                y -= 25;
                const social = [];
                if (watermark.socialMedia.instagram) social.push(`📷 ${watermark.socialMedia.instagram}`);
                if (watermark.socialMedia.whatsapp) social.push(`💬 ${watermark.socialMedia.whatsapp}`);
                ctx.font = '16px Inter, sans-serif';
                ctx.fillText(social.join(' • '), x, y);
            }
        }

        ctx.globalAlpha = 1;
    }
}

export const catalogService = new CatalogService();

