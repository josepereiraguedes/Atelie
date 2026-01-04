/**
 * Serviço centralizado para lidar com comunicações externas (WhatsApp)
 * Segue o princípio DRY para evitar repetição de montagem de strings de templates
 */
export const communicationService = {
    /**
     * Formata um número de telefone para o padrão internacional (DDI 55)
     */
    formatPhone(phone: string): string {
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11 || clean.length === 10) {
            return `55${clean}`;
        }
        return clean;
    },

    /**
     * Abre o WhatsApp com uma mensagem específica ou envia o card visual
     */
    async openWhatsApp(phone: string, message: string, data: any, skipText: boolean = false, companyName: string = 'Nome da Empresa'): Promise<void> {
        const formattedPhone = this.formatPhone(phone);

        // Geramos o card visual premium com o nome dinâmico
        const cardBlob = await this.generateProductOfferCard(data, companyName);

        if (cardBlob && navigator.clipboard && window.ClipboardItem) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ [cardBlob.type]: cardBlob })
                ]);
            } catch (e) {
                console.warn('Erro ao copiar card para o clipboard:', e);
            }
        }

        const textParam = skipText ? '' : `?text=${encodeURIComponent(message)}`;
        const url = `https://wa.me/${formattedPhone}${textParam}`;
        window.open(url, '_blank');
    },

    /**
     * Gera templates de mensagens padronizados
     */
    getTemplate(type: 'recompra' | 'aniversario' | 'cobranca' | 'feedback' | 'oferta' | 'catalogo', data: any, companyName: string = 'Nome da Empresa'): string {
        switch (type) {
            case 'recompra':
                return `Olá ${data.name}! Notamos que faz cerca de ${data.days} dias desde sua última compra de ${data.product}. Gostaria de repor seu estoque? Estamos com condições especiais hoje!`;
            case 'aniversario':
                return `Parabéns, ${data.name}! 🎂 Desejamos um dia incrível e cheio de realizações. Como presente do ${companyName}, preparamos um cupom de 10% OFF para sua próxima compra: PARABENS10. Aproveite!`;
            case 'cobranca':
                return `Olá ${data.name}, tudo bem? Passando para lembrar sobre o pagamento pendente de R$ ${data.value}. Podemos te ajudar com algo?`;
            case 'feedback':
                return `Olá ${data.name}! O que achou da sua última compra? Seu feedback é muito importante para nós do ${companyName}!`;
            case 'oferta':
                const priceFormatted = Number(data.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const productName = (data.product || 'Produto').toUpperCase();

                // Variações de Abertura para não ser sempre igual
                const intros = [
                    `✨ CATÁLOGO ${companyName.toUpperCase()}: EDIÇÃO LIMITADA ✨`,
                    "💎 SELEÇÃO EXCLUSIVA: OPORTUNIDADE ÚNICA 💎",
                    "🌟 DESTAQUE DO DIA: QUALIDADE PREMIUM 🌟"
                ];

                // Variações de Escassez
                const randomIdx = Math.floor(Math.random() * intros.length);
                const intro = intros[randomIdx];

                // Escassez Artificial Solicitada: Sempre números baixos aleatórios
                const fakeStock = Math.floor(Math.random() * 10) + 3; // Entre 3 e 12 unidades
                const scarcityMsg = [
                    `🔥 Somente *${fakeStock}* unidades disponíveis no estoque agora.`,
                    `🚨 Atenção: Restam apenas *${fakeStock}* itens para envio imediato!`,
                    `⏳ Aproveite: Últimas *${fakeStock}* unidades em promoção.`
                ][randomIdx];

                // Variações de Fechamento/Dúvidas
                const closings = [
                    "Ficou alguma dúvida? Fique a vontade para perguntar!",
                    "Qualquer dúvida, nossa equipe está pronta para te atender!",
                    "Precisa de mais informações? É só chamar!"
                ];

                // Variações de rodapé/garantia (Removido 'Satisfação garantida')
                const footers = [
                    "Garantia do vendedor: 7 dias",
                    `Qualidade testada e aprovada pelo ${companyName}`,
                    "Acompanha Nota Fiscal"
                ];

                const closing = closings[Math.floor(Math.random() * closings.length)];
                const footer = footers[Math.floor(Math.random() * footers.length)];

                const descriptionText = data.description ?
                    `\n\n*Sobre o produto:* \n${data.description}` :
                    '\n\n*Sobre o produto:* \nQualidade garantida e excelência no acabamento.';

                // O link da imagem no topo é a melhor forma de gerar o preview visual no WhatsApp web/mobile
                return `${data.image || ''}

${intro}

*${productName}*
__________

💰 *VALOR:* *${priceFormatted}*${descriptionText}

${closing}

${footer}

🚨 *OPORTUNIDADE:* 
${scarcityMsg}

🎫 *Responda agora para reservar o seu*`;
            case 'catalogo':
                const itemsList = data.products.map((p: any) => {
                    const price = Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    return `✅ *${p.name.toUpperCase()}*\n💰 Por apenas: *${price}*`;
                }).join('\n\n');

                return `✨ *CATÁLOGO SEMANAL: SELEÇÃO EXCLUSIVA* ✨

Olá! Preparamos uma seleção especial de produtos para você conferir hoje:

${itemsList}

__________

🛵 *Entregamos para você!*
💬 *Responda com o nome do produto para reservar.*`;
            default:
                return `Olá ${data.name}!`;
        }
    },

    /**
     * Gera um card visual (imagem) da oferta usando Canvas
     * Isso permite enviar a foto com os dados "embutidos"
     */
    async generateProductOfferCard(data: any, companyName: string = 'Nome da Empresa'): Promise<Blob | null> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            // Dimensões do card (proporção Instagram/WhatsApp Vertical)
            canvas.width = 1080;
            canvas.height = 1920;

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = data.image || '';

            img.onload = () => {
                // 1. Fundo Branco Puro (para misturar com fotos sem fundo)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Desenhar Imagem Centralizada (Parte Superior)
                const imgSize = 800;
                const scale = Math.min(imgSize / img.width, imgSize / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = 150;

                // Desenha imagem pura (sem sombras agora)
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                // 3. Título do Produto (Caixa Alta)
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 54px Inter, sans-serif';
                ctx.textAlign = 'center';
                const name = (data.product || 'PRODUTO EXCLUSIVO').toUpperCase();

                // Quebra de linha para o título se for longo
                const words = name.split(' ');
                let line = '';
                let titleY = y + (img.height * scale) + 100;
                for (let n = 0; n < words.length; n++) {
                    let testLine = line + words[n] + ' ';
                    let metrics = ctx.measureText(testLine);
                    if (metrics.width > 900 && n > 0) {
                        ctx.fillText(line.trim(), canvas.width / 2, titleY);
                        line = words[n] + ' ';
                        titleY += 70;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line.trim(), canvas.width / 2, titleY);

                // 4. Divisória Elegante
                titleY += 40;
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(340, titleY);
                ctx.lineTo(740, titleY);
                ctx.stroke();

                // 5. Preço (Destaque)
                titleY += 120;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 90px Inter, sans-serif';
                const price = Number(data.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                ctx.fillText(`VALOR: ${price}`, canvas.width / 2, titleY);

                // 6. Descrição e Benefícios
                titleY += 100;
                ctx.fillStyle = '#334155';
                ctx.font = 'bold 36px Inter, sans-serif';
                ctx.textAlign = 'left';

                // Removendo repetição do nome no início da descrição
                const rawDesc = (data.description || "Qualidade garantida e excelência em cada detalhe.\nIdeal para quem busca o melhor custo-benefício.").trim();
                const nameCheck = (data.product || '').trim().toUpperCase();
                let cleanDesc = rawDesc;
                if (cleanDesc.toUpperCase().startsWith(nameCheck)) {
                    cleanDesc = cleanDesc.substring(nameCheck.length).trim();
                    if (cleanDesc.startsWith('-') || cleanDesc.startsWith(':') || cleanDesc.startsWith('.')) {
                        cleanDesc = cleanDesc.substring(1).trim();
                    }
                }

                const descLines = cleanDesc.split('\n');
                let currentY = titleY;

                ctx.fillText("Sobre o produto:", 100, currentY);
                currentY += 60;
                ctx.font = '32px Inter, sans-serif';

                let lineCount = 0;
                const maxLines = 5;

                for (let descLine of descLines) {
                    if (lineCount >= maxLines) break;
                    if (!descLine.trim()) continue;

                    let wds = descLine.trim().split(' ');
                    let l = '';
                    for (let n = 0; n < wds.length; n++) {
                        if (lineCount >= maxLines) break;
                        let testL = l + wds[n] + ' ';
                        let metrics = ctx.measureText(testL);
                        if (metrics.width > 880 && n > 0) {
                            ctx.fillText(l.trim(), 100, currentY);
                            l = wds[n] + ' ';
                            currentY += 45;
                            lineCount++;
                        } else {
                            l = testL;
                        }
                    }
                    if (l.trim() && lineCount < maxLines) {
                        ctx.fillText(l.trim(), 100, currentY);
                        currentY += 45;
                        lineCount++;
                    }
                }

                // 7. Banner de Escassez (Rodapé)
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(0, canvas.height - 180, canvas.width, 180);

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = 'bold 42px Inter, sans-serif';
                ctx.font = '30px Inter, sans-serif';
                ctx.fillText("Responda agora para reservar o seu", canvas.width / 2, canvas.height - 45);

                // 8. Selo da Marca (Canto Superior - Dinâmico)
                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'left';
                ctx.font = 'bold 40px Inter, sans-serif';
                ctx.fillText(companyName.toUpperCase(), 100, 100);

                canvas.toBlob(resolve, 'image/png');
            };

            img.onerror = () => resolve(null);
        });
    },

    /**
     * Gera um card de grade (até 4 produtos) para campanhas de catálogo
     * @param products - Array de produtos (máximo 4)
     * @param campaignTitle - Título personalizável da campanha
     */
    async generateProductGridCard(products: any[], campaignTitle: string = 'OFERTAS DA SEMANA'): Promise<Blob | null> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            canvas.width = 1080;
            canvas.height = 1080;

            // 1. Fundo com gradiente sutil
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, '#f8fafc');
            bgGradient.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Cabeçalho com gradiente moderno
            const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            headerGradient.addColorStop(0, '#3b82f6');
            headerGradient.addColorStop(0.5, '#8b5cf6');
            headerGradient.addColorStop(1, '#ec4899');
            ctx.fillStyle = headerGradient;
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            ctx.fillRect(0, 0, canvas.width, 180);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // 3. Título da campanha
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 56px Inter, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.fillText(campaignTitle.toUpperCase(), canvas.width / 2, 110);
            ctx.shadowBlur = 0;

            // 4. Desenhar até 4 produtos
            const displayProducts = products.slice(0, 4);
            const loadImages = displayProducts.map(p => {
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

                    // Card com sombra e bordas arredondadas
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.15)';
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetY = 8;

                    // Bordas arredondadas
                    const radius = 20;
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + cellW - radius, y);
                    ctx.quadraticCurveTo(x + cellW, y, x + cellW, y + radius);
                    ctx.lineTo(x + cellW, y + cellH - radius);
                    ctx.quadraticCurveTo(x + cellW, y + cellH, x + cellW - radius, y + cellH);
                    ctx.lineTo(x + radius, y + cellH);
                    ctx.quadraticCurveTo(x, y + cellH, x, y + cellH - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetY = 0;

                    // Badge "OFERTA" no canto superior
                    const badgeGradient = ctx.createLinearGradient(x, y, x + 120, y + 40);
                    badgeGradient.addColorStop(0, '#ef4444');
                    badgeGradient.addColorStop(1, '#dc2626');
                    ctx.fillStyle = badgeGradient;
                    ctx.beginPath();
                    ctx.moveTo(x + 20, y);
                    ctx.lineTo(x + 140, y);
                    ctx.lineTo(x + 120, y + 40);
                    ctx.lineTo(x, y + 40);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 18px Inter, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('🔥 OFERTA', x + 15, y + 26);

                    // Imagem do produto
                    const imgPadding = 30;
                    const maxImgW = cellW - (imgPadding * 2);
                    const maxImgH = cellH - 140;
                    const productScale = Math.min(maxImgW / img.width, maxImgH / img.height);
                    const scaledW = img.width * productScale;
                    const scaledH = img.height * productScale;
                    const imgX = x + (cellW / 2) - (scaledW / 2);
                    const imgY = y + 50;

                    ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

                    // Linha divisória sutil
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 20, y + cellH - 90);
                    ctx.lineTo(x + cellW - 20, y + cellH - 90);
                    ctx.stroke();

                    // Nome do produto
                    ctx.fillStyle = '#1e293b';
                    ctx.font = 'bold 20px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    const productName = displayProducts[i].name.length > 28
                        ? displayProducts[i].name.substring(0, 28) + '...'
                        : displayProducts[i].name;
                    ctx.fillText(productName, x + cellW / 2, y + cellH - 55);

                    // Preço com destaque
                    const priceGradient = ctx.createLinearGradient(x, y + cellH - 30, x + cellW, y + cellH - 30);
                    priceGradient.addColorStop(0, '#059669');
                    priceGradient.addColorStop(1, '#10b981');
                    ctx.fillStyle = priceGradient;
                    ctx.font = 'bold 32px Inter, sans-serif';
                    ctx.fillText(`R$ ${Number(displayProducts[i].price).toFixed(2)}`, x + cellW / 2, y + cellH - 20);
                });

                // 5. Rodapé com call-to-action
                ctx.fillStyle = '#64748b';
                ctx.font = '24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💬 Chame agora e garanta o seu!', canvas.width / 2, canvas.height - 30);

                canvas.toBlob(resolve, 'image/png');
            });
        });
    }
};



