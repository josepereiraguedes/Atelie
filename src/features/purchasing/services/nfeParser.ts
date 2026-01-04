
/**
 * Serviço para parsing de Notas Fiscais Eletrônicas (NFe) XML
 * Permite importar dados de compras automaticamente
 */

export interface NFeData {
    accessKey: string;
    number: string;
    series: string;
    date: string;
    supplier: {
        cnpj: string;
        name: string;
        tradeName?: string;
        address: {
            street: string;
            number: string;
            neighborhood: string;
            city: string;
            state: string;
            zipCode: string;
        };
        phone?: string;
    };
    items: NFeItem[];
    totals: {
        products: number;
        discount: number;
        shipping: number;
        tax: number;
        total: number;
    };
}

export interface NFeItem {
    code: string;
    ean: string;
    name: string;
    ncm: string;
    cfop: string;
    uom: string; // Unidade de Medida
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export class NFeParserService {
    /**
     * Analisa um arquivo XML de NFe e extrai os dados relevantes
     * @param xmlContent Conteúdo string do arquivo XML
     */
    parseNFe(xmlContent: string): NFeData {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

        // Verificar se é uma NFe válida
        const infNFe = xmlDoc.querySelector("infNFe");
        if (!infNFe) {
            throw new Error("Arquivo XML inválido ou não é uma Nota Fiscal Eletrônica (NFe).");
        }

        const accessKey = infNFe.getAttribute("Id")?.replace("NFe", "") || "";

        // Dados da Identificação (ide)
        const ide = xmlDoc.querySelector("ide");
        const number = this.getNodeValue(ide, "nNF");
        const series = this.getNodeValue(ide, "serie");
        const dateStr = this.getNodeValue(ide, "dhEmi") || this.getNodeValue(ide, "dEmi");

        // Dados do Emitente (emit)
        const emit = xmlDoc.querySelector("emit");
        const enderEmit = emit?.querySelector("enderEmit");

        const supplier = {
            cnpj: this.getNodeValue(emit, "CNPJ"),
            name: this.getNodeValue(emit, "xNome"),
            tradeName: this.getNodeValue(emit, "xFant"),
            address: {
                street: this.getNodeValue(enderEmit, "xLgr"),
                number: this.getNodeValue(enderEmit, "nro"),
                neighborhood: this.getNodeValue(enderEmit, "xBairro"),
                city: this.getNodeValue(enderEmit, "xMun"),
                state: this.getNodeValue(enderEmit, "UF"),
                zipCode: this.getNodeValue(enderEmit, "CEP"),
            },
            phone: this.getNodeValue(enderEmit, "fone"),
        };

        // Itens (det)
        const dets = xmlDoc.querySelectorAll("det");
        const items: NFeItem[] = [];

        dets.forEach((det) => {
            const prod = det.querySelector("prod");
            if (prod) {
                items.push({
                    code: this.getNodeValue(prod, "cProd"),
                    ean: this.getNodeValue(prod, "cEAN"),
                    name: this.getNodeValue(prod, "xProd"),
                    ncm: this.getNodeValue(prod, "NCM"),
                    cfop: this.getNodeValue(prod, "CFOP"),
                    uom: this.getNodeValue(prod, "uCom"),
                    quantity: parseFloat(this.getNodeValue(prod, "qCom") || "0"),
                    unitPrice: parseFloat(this.getNodeValue(prod, "vUnCom") || "0"),
                    totalPrice: parseFloat(this.getNodeValue(prod, "vProd") || "0"),
                });
            }
        });

        // Totais (total)
        const ICMSTot = xmlDoc.querySelector("ICMSTot");
        const totals = {
            products: parseFloat(this.getNodeValue(ICMSTot, "vProd") || "0"),
            discount: parseFloat(this.getNodeValue(ICMSTot, "vDesc") || "0"),
            shipping: parseFloat(this.getNodeValue(ICMSTot, "vFrete") || "0"),
            tax: parseFloat(this.getNodeValue(ICMSTot, "vICMS") || "0"), // Simplificado, somar IPI etc depois se precisar
            total: parseFloat(this.getNodeValue(ICMSTot, "vNF") || "0"),
        };

        return {
            accessKey,
            number,
            series,
            date: dateStr,
            supplier,
            items,
            totals,
        };
    }

    private getNodeValue(parent: Element | null | undefined, tagName: string): string {
        if (!parent) return "";
        const node = parent.querySelector(tagName);
        return node?.textContent || "";
    }
}

export const nfeParser = new NFeParserService();
