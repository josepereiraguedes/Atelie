const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const app = express();
const PORT = 3001;

// Configuração do DB Local (Pastas e Arquivos)
const DB_BASE_PATH = path.join(__dirname, '../local_database');
const COLLECTIONS = {
    PRODUCTS: 'products',
    CLIENTS: 'clients',
    SUPPLIERS: 'suppliers',
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',
    QUOTES: 'quotes',
    PURCHASE_ORDERS: 'purchase_orders',
    SETTINGS: 'settings',
    LOGS: 'logs',
    MEDIA: 'media'
};

// Cache em memória para performance ultrarápida
const cache = {};

// Inicializa pastas do banco de dados (Apenas estrutura, dados carregados sob demanda)
async function initDatabase() {
    try {
        await fs.mkdir(DB_BASE_PATH, { recursive: true });
        for (const key in COLLECTIONS) {
            const collectionPath = path.join(DB_BASE_PATH, COLLECTIONS[key]);
            await fs.mkdir(collectionPath, { recursive: true });
            cache[COLLECTIONS[key]] = null; // Indica que ainda não foi carregado
        }
        console.log("📁 Estrutura do banco de dados verificada.");
    } catch (e) {
        console.error('❌ Erro na inicialização:', e.message);
    }
}

// Funções de manipulação do DB
const db = {
    async load(collection) {
        if (cache[collection] !== null) return cache[collection];

        console.log(`📥 Carregando coleção [${collection.toUpperCase()}] do disco...`);
        const collectionPath = path.join(DB_BASE_PATH, collection);
        await fs.mkdir(collectionPath, { recursive: true });

        try {
            const files = await fs.readdir(collectionPath);
            const data = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(path.join(collectionPath, file), 'utf-8');
                        data.push(JSON.parse(content));
                    } catch (e) { }
                }
            }
            cache[collection] = data;
            return data;
        } catch (e) {
            console.error(`❌ Erro ao ler coleção ${collection}:`, e.message);
            cache[collection] = [];
            return [];
        }
    },

    async list(collection) {
        return await this.load(collection);
    },

    async save(collection, data) {
        const items = await this.load(collection);

        if (!data.id) {
            data.id = Date.now() + Math.floor(Math.random() * 1000);
        }

        const now = new Date().toISOString();
        if (!data.created_at) data.created_at = now;
        data.updated_at = now;

        const filePath = path.join(DB_BASE_PATH, collection, `${data.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));

        const index = items.findIndex(i => i.id === data.id);
        if (index >= 0) items[index] = data;
        else items.push(data);

        return data;
    },

    async delete(collection, id) {
        const items = await this.load(collection);
        const filePath = path.join(DB_BASE_PATH, collection, `${id}.json`);
        try {
            await fs.unlink(filePath);
            cache[collection] = items.filter(i => i.id != id);
            return true;
        } catch (e) {
            return false;
        }
    },

    async logAction(action, category, description, details = null) {
        try {
            const logs = await this.load(COLLECTIONS.LOGS);

            // Log Rotation: Manter no máximo 500 logs
            if (logs.length >= 500) {
                // Ordenar por data e pegar os mais antigos para remover
                logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const toRemove = logs.slice(0, logs.length - 499);
                for (const oldLog of toRemove) {
                    await this.delete(COLLECTIONS.LOGS, oldLog.id);
                }
            }

            await this.save(COLLECTIONS.LOGS, {
                action,
                category,
                description,
                details,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('Erro no Log Rotation:', e);
        }
    }
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos estáticos (Mídia Local)
app.use('/media', express.static(path.join(DB_BASE_PATH, COLLECTIONS.MEDIA)));

// === CRUD ROTAS (SEM MYSQL) ===

// PRODUTOS
app.get('/api/products', async (req, res) => {
    try {
        const { search, category } = req.query;
        let products = await db.list(COLLECTIONS.PRODUCTS);

        // Se houver busca no servidor (reduz processamento no cliente)
        if (search) {
            const term = search.toLowerCase();
            products = products.filter(p =>
                (p.name || '').toLowerCase().includes(term) ||
                (p.sku || '').toLowerCase().includes(term) ||
                (p.barcode || '').includes(term)
            );
        }

        if (category) {
            products = products.filter(p => p.category === category);
        }

        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const saved = await db.save(COLLECTIONS.PRODUCTS, req.body);
        res.status(201).json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const items = await db.load(COLLECTIONS.PRODUCTS);
        const existing = items.find(i => i.id === Number(id));

        const data = {
            ...(existing || {}),
            ...req.body,
            id: Number(id),
            updated_at: new Date().toISOString()
        };

        const saved = await db.save(COLLECTIONS.PRODUCTS, data);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.delete(COLLECTIONS.PRODUCTS, req.params.id);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CLIENTES
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await db.list(COLLECTIONS.CLIENTS);
        res.json(clients);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const saved = await db.save(COLLECTIONS.CLIENTS, req.body);
        res.status(201).json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const items = await db.load(COLLECTIONS.CLIENTS);
        const existing = items.find(i => i.id === Number(id));

        const data = {
            ...(existing || {}),
            ...req.body,
            id: Number(id),
            updated_at: new Date().toISOString()
        };

        const saved = await db.save(COLLECTIONS.CLIENTS, data);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        await db.delete(COLLECTIONS.CLIENTS, req.params.id);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// FORNECEDORES
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await db.list(COLLECTIONS.SUPPLIERS);
        res.json(suppliers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    try {
        const saved = await db.save(COLLECTIONS.SUPPLIERS, req.body);
        res.status(201).json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const items = await db.load(COLLECTIONS.SUPPLIERS);
        const existing = items.find(i => i.id === Number(id));

        const data = {
            ...(existing || {}),
            ...req.body,
            id: Number(id),
            updated_at: new Date().toISOString()
        };

        const saved = await db.save(COLLECTIONS.SUPPLIERS, data);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await db.delete(COLLECTIONS.SUPPLIERS, req.params.id);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// TRANSAÇÕES
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await db.list(COLLECTIONS.TRANSACTIONS);
        res.json(transactions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = req.body;
        const saved = await db.save(COLLECTIONS.TRANSACTIONS, transaction);

        // Atualizar estoque dos produtos envolvidos
        if (transaction.type === 'sale' || transaction.type === 'purchase' || transaction.type === 'adjustment') {
            const items = transaction.items || [];

            // Se tiver item único (legado)
            if (transaction.product_id && transaction.quantity && items.length === 0) {
                items.push({ product_id: transaction.product_id, quantity: transaction.quantity });
            }

            for (const item of items) {
                try {
                    const productId = Number(item.product_id);
                    const change = Number(item.quantity);

                    // Buscar todos os produtos do cache/db
                    const products = await db.list(COLLECTIONS.PRODUCTS);
                    const product = products.find(p => p.id === productId);

                    if (product) {
                        // Calcular nova quantidade
                        if (transaction.type === 'sale') {
                            product.quantity = Math.max(0, (Number(product.quantity) || 0) - change);
                        } else if (transaction.type === 'purchase') {
                            product.quantity = (Number(product.quantity) || 0) + change;
                        } else if (transaction.type === 'adjustment') {
                            product.quantity = change; // Ajuste direto
                        }

                        // Salvar produto atualizado (o db.save já cuida de cache e disco)
                        await db.save(COLLECTIONS.PRODUCTS, product);
                    }
                } catch (err) {
                    console.error(`Erro ao atualizar estoque do produto ${item.product_id}:`, err.message);
                }
            }
        }

        res.status(201).json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body, id: Number(id) };
        const saved = await db.save(COLLECTIONS.TRANSACTIONS, data);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await db.delete(COLLECTIONS.TRANSACTIONS, req.params.id);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CATEGORIAS
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.list(COLLECTIONS.CATEGORIES);
        res.json(categories);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const saved = await db.save(COLLECTIONS.CATEGORIES, req.body);
        res.status(201).json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body, id: Number(id) };
        const saved = await db.save(COLLECTIONS.CATEGORIES, data);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await db.delete(COLLECTIONS.CATEGORIES, req.params.id);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Inicialização
initDatabase().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server Local-Folder Mode running on port ${PORT}`));
}).catch(err => {
    console.error('❌ Falha crítica ao iniciar banco de dados:', err);
    process.exit(1);
});

let browser = null;

// Rota de Pesquisa (Busca Simples)
app.get('/api/market-spy/search', async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        if (!query) return res.status(400).json({ error: 'Query required' });

        console.log(`🔎 Buscando no ML: ${query}`);

        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
        console.log(`📍 URL: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const products = await page.evaluate(() => {
            const items = [];

            // Debug: verificar quantos elementos existem com cada seletor
            const selectors = {
                'ui-search-layout__item': document.querySelectorAll('.ui-search-layout__item').length,
                'ui-search-result': document.querySelectorAll('.ui-search-result').length,
                'poly-card': document.querySelectorAll('.poly-card').length,
                'andes-card': document.querySelectorAll('.andes-card').length
            };

            console.log('Seletores encontrados:', selectors);

            // Tenta o seletor principal
            let elements = document.querySelectorAll('.ui-search-layout__item');

            // Se não encontrou, tenta alternativas
            if (elements.length === 0) {
                elements = document.querySelectorAll('.poly-card__content');
            }
            if (elements.length === 0) {
                elements = document.querySelectorAll('li[class*="ui-search"]');
            }

            console.log(`Processando ${elements.length} elementos`);

            elements.forEach((item, index) => {
                try {
                    // Múltiplas tentativas para título
                    const title = item.querySelector('.poly-box h2')?.innerText ||
                        item.querySelector('.ui-search-item__title')?.innerText ||
                        item.querySelector('h2')?.innerText ||
                        item.querySelector('[class*="title"]')?.innerText;

                    // Múltiplas tentativas para preço
                    const priceElement = item.querySelector('.andes-money-amount') ||
                        item.querySelector('[class*="price"]');

                    let priceMain = priceElement?.querySelector('.andes-money-amount__fraction')?.innerText;
                    let priceCents = priceElement?.querySelector('.andes-money-amount__cents')?.innerText;

                    // Fallback: pegar qualquer número que pareça um preço
                    if (!priceMain) {
                        const priceText = priceElement?.innerText || '';
                        const match = priceText.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
                        if (match) priceMain = match[1];
                    }

                    // Link
                    const link = item.querySelector('a[href*="MLB"]')?.href ||
                        item.querySelector('a')?.href;

                    // Imagem - tenta múltiplos atributos
                    let image = item.querySelector('img')?.src;
                    if (!image || image.includes('data:image')) {
                        // Tenta data-src (lazy loading)
                        image = item.querySelector('img')?.getAttribute('data-src') ||
                            item.querySelector('img')?.getAttribute('data-lazy') ||
                            item.querySelector('img')?.getAttribute('srcset')?.split(' ')[0];
                    }

                    // ID do produto
                    let id = null;
                    if (link) {
                        const match = link.match(/MLB-?(\d+)/);
                        if (match) id = match[1];
                    }

                    if (title && priceMain && link) {
                        const price = parseFloat(priceMain.replace(/\./g, '').replace(',', '.'));
                        items.push({
                            id: id || link,
                            title,
                            price,
                            permalink: link,  // Mudado de 'link' para 'permalink'
                            thumbnail: image
                        });
                    } else if (index < 3) {
                        // Log dos primeiros 3 itens que falharam para debug
                        console.log(`Item ${index} falhou:`, {
                            hasTitle: !!title,
                            hasPrice: !!priceMain,
                            hasLink: !!link
                        });
                    }
                } catch (err) {
                    console.log(`Erro ao processar item ${index}:`, err.message);
                }
            });

            return items;
        });

        console.log(`✅ Encontrados ${products.length} produtos`);
        res.json({ results: products });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Rota de Detalhes (Scraper Avançado com JSON-LD + Regex)
app.get('/api/market-spy/details', async (req, res) => {
    let browser = null;
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL required' });

        console.log(`🕵️ Extraindo Detalhes (Ultra Robust): ${url.substring(0, 40)}...`);
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        // Anti-Detection e User Agent Realista
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scroll Humano e Agressivo para carregar Lazy Load
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 150;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    // Se chegar ao fim, resolve
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });

        await new Promise(r => setTimeout(r, 2000)); // Calma, respira

        const content = await page.content();

        // 1. VÍDEOS (Matemática Pura - Regex)
        const videoIds = new Set();
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)(?:%2F|\\u002F|\/)?([^"&?\/\\s%]{11})/g;
        let match;
        while ((match = ytRegex.exec(content)) !== null) {
            if (match[1].length === 11) videoIds.add(match[1]);
        }
        const regexVideos = Array.from(videoIds).map(id => `https://www.youtube.com/embed/${id}`);

        // 2. Extração Híbrida (JSON + HTML)
        const details = await page.evaluate((videosFromRegex) => {
            const result = {
                description: '',
                item_attributes: [],
                images: [],
                videos: videosFromRegex,
                technicalSpecs: [],
                ean: null,
                category_path: []
            };

            // A. Tenta ler o cérebro da página (JSON-LD)
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            scripts.forEach(script => {
                try {
                    const data = JSON.parse(script.innerText);
                    const items = Array.isArray(data) ? data : [data];
                    items.forEach(item => {
                        if (item.image) {
                            const imgs = Array.isArray(item.image) ? item.image : [item.image];
                            imgs.forEach(img => result.images.push(img));
                        }
                        if (item.description && !result.description) result.description = item.description;

                        if (item.gtin13 || item.gtin12 || item.gtin8 || item.gtin) {
                            result.ean = item.gtin13 || item.gtin12 || item.gtin8 || item.gtin;
                        }

                        // Video Object no JSON
                        if (item.subjectOf?.type === 'VideoObject' || item['@type'] === 'VideoObject') {
                            const vObj = item.subjectOf || item;
                            const vUrl = vObj.embedUrl || vObj.contentUrl;
                            if (vUrl) result.videos.push(vUrl);
                        }
                    });
                } catch (e) { }
            });

            // B. Tenta ler o corpo da página (HTML Visual)

            // Breedcrumb / Categoria
            const breadcrumb = document.querySelectorAll('.andres-breadcrumb__item, .ui-pdp-breadcrumb__link');
            breadcrumb.forEach(item => {
                const text = item.innerText.trim();
                if (text && !result.category_path.includes(text)) result.category_path.push(text);
            });

            // Descrição (HTML costuma ser mais completo que o JSON snippet)
            const descEl = document.querySelector('.ui-pdp-description__content');
            if (descEl && (descEl.innerText.length > result.description.length)) {
                result.description = descEl.innerText;
            }

            // Ficha Técnica (Varredura de Tabelas)
            const specsTables = document.querySelectorAll('.ui-vpp-striped-specs__table, .ui-pdp-specs__table, .andes-table');
            specsTables.forEach(table => {
                table.querySelectorAll('tr').forEach(tr => {
                    const cols = tr.querySelectorAll('th, td, .andes-table__header, .andes-table__column--value');
                    if (cols.length >= 2) {
                        const label = cols[0].innerText.trim();
                        const value = cols[1].innerText.trim();
                        if (label && value && !result.item_attributes.some(a => a.name === label && a.value === value)) {
                            result.item_attributes.push({ name: label, value });

                            // Detecção de EAN nos atributos
                            const lowerLabel = label.toLowerCase();
                            if (lowerLabel.includes('ean') || lowerLabel.includes('gtin') || lowerLabel.includes('código de barras')) {
                                result.ean = value;
                            }
                        }
                    }
                });
            });

            // Fallback: Listas de Características
            if (result.item_attributes.length === 0) {
                document.querySelectorAll('.ui-pdp-features__container li, .ui-vpp-highlighted-specs__features-list li').forEach(li => {
                    const text = li.innerText;
                    if (text.includes(':')) {
                        const parts = text.split(':');
                        const name = parts[0].trim();
                        const value = parts.slice(1).join(':').trim();
                        if (name && value) result.item_attributes.push({ name, value });
                    } else {
                        result.item_attributes.push({ name: 'Característica', value: text.trim() });
                    }
                });
            }

            // Fallback: Imagens Extras
            document.querySelectorAll('figure.ui-pdp-gallery__figure img').forEach(img => {
                const src = img.getAttribute('data-zoom') || img.src;
                if (src && !result.images.includes(src)) result.images.push(src);
            });

            result.technicalSpecs = result.item_attributes;
            return result;
        }, regexVideos);

        // Deduplicação Final
        details.videos = [...new Set(details.videos)];
        details.images = [...new Set(details.images)];

        console.log(`📊 Detalhes extraídos:`);
        console.log(`   - Vídeos: ${details.videos.length}`);
        console.log(`   - Imagens: ${details.images.length}`);
        console.log(`   - Atributos: ${details.item_attributes.length}`);
        console.log(`   - Descrição: ${details.description.length} chars`);

        res.json(details);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'Local File System' }));

// Backup & Export total do banco
app.get('/api/db/export', async (req, res) => {
    try {
        const fullData = {};
        for (const key in COLLECTIONS) {
            fullData[COLLECTIONS[key]] = await db.list(COLLECTIONS[key]);
        }
        res.json({
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.1',
                backup_type: 'full'
            },
            data: fullData
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Importação total do banco (Cuidado: Sobrescreve tudo)
app.get('/api/db/import', async (req, res) => {
    res.status(405).json({ error: 'Use POST para importar dados.' });
});

app.post('/api/db/import', async (req, res) => {
    try {
        const { data, metadata } = req.body;
        if (!data) return res.status(400).json({ error: 'Dados não fornecidos.' });

        console.log(`📥 Iniciando importação de backup [Versão: ${metadata?.version || 'N/A'}]`);

        for (const collectionName in data) {
            // Verifica se a coleção é válida
            if (Object.values(COLLECTIONS).includes(collectionName)) {
                const items = data[collectionName];
                if (Array.isArray(items)) {
                    console.log(`   - Importando ${items.length} itens para [${collectionName.toUpperCase()}]`);
                    for (const item of items) {
                        await db.save(collectionName, item);
                    }
                }
            }
        }

        res.json({ success: true, message: 'Importação concluída com sucesso.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// LOGS DE ATIVIDADE
app.get('/api/logs', async (req, res) => {
    try {
        let logs = await db.list(COLLECTIONS.LOGS);
        // Ordenar por data decrescente
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Limite padrão de 500 registros para não sobrecarregar
        const limit = parseInt(req.query.limit) || 500;
        res.json(logs.slice(0, limit));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const { action, category, description, details } = req.body;
        const log = await db.save(COLLECTIONS.LOGS, { action, category, description, details });
        res.status(201).json(log);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/logs', async (req, res) => {
    try {
        const files = await fs.readdir(path.join(DB_BASE_PATH, COLLECTIONS.LOGS));
        for (const file of files) {
            await fs.unlink(path.join(DB_BASE_PATH, COLLECTIONS.LOGS, file));
        }
        // Limpa cache também
        cache[COLLECTIONS.LOGS] = [];
        res.json({ success: true, message: 'Histórico de logs removido.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPLOAD DE MÍDIA LOCAL OU DOWNLOAD DE URL
app.post('/api/upload', async (req, res) => {
    try {
        const { image, url, fileName, folder } = req.body;

        let buffer;
        let extension = '.jpg';

        if (image) {
            // Caso 1: Upload de Base64
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
            buffer = Buffer.from(base64Data, 'base64');
            if (fileName) extension = path.extname(fileName) || '.jpg';
        } else if (url) {
            // Caso 2: Download de URL externa
            console.log(`📥 Baixando imagem externa: ${url.substring(0, 50)}...`);
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data, 'binary');

            // Tenta adivinhar extensão da URL ou do Content-Type
            const contentType = response.headers['content-type'];
            if (contentType) {
                if (contentType.includes('png')) extension = '.png';
                else if (contentType.includes('webp')) extension = '.webp';
                else if (contentType.includes('gif')) extension = '.gif';
            } else {
                extension = path.extname(url.split('?')[0]) || '.jpg';
            }
        } else {
            return res.status(400).json({ error: 'Nenhuma imagem ou URL enviada.' });
        }

        const newFileName = `${Date.now()}-${Math.round(Math.random() * 1000)}${extension}`;
        const targetDir = folder ? path.join(DB_BASE_PATH, COLLECTIONS.MEDIA, folder) : path.join(DB_BASE_PATH, COLLECTIONS.MEDIA);

        await fs.mkdir(targetDir, { recursive: true });
        const filePath = path.join(targetDir, newFileName);
        await fs.writeFile(filePath, buffer);

        const serverUrl = folder ? `/media/${folder}/${newFileName}` : `/media/${newFileName}`;
        res.json({ url: `http://localhost:3001${serverUrl}`, fileName: newFileName });
    } catch (e) {
        console.error('❌ Erro no upload/download:', e);
        res.status(500).json({ error: 'Falha ao salvar imagem localmente.' });
    }
});

// Estatísticas do Banco de Dados
app.get('/api/db/stats', async (req, res) => {
    try {
        const stats = {};
        for (const key in COLLECTIONS) {
            const list = await db.list(COLLECTIONS[key]);
            stats[COLLECTIONS[key]] = {
                count: list.length,
                lastUpdate: list.length > 0 ? new Date(Math.max(...list.map(i => new Date(i.updated_at || 0).getTime()))).toISOString() : null
            };
        }
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


