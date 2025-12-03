import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

// Interfaces para entidades de estoque
export interface CustomCost {
  /** Nome do custo personalizado */
  name: string;
  /** Valor do custo (pode ser fixo ou percentual) */
  value: number;
  /** Tipo do custo: fixo ou percentual */
  type: 'fixed' | 'percentage';
  /** Categoria do custo para agrupamento */
  category?: string;
}

export interface MarketplacePricingConfig {
  /** Nome do marketplace (ex: Mercado Livre, Amazon, etc.) */
  name: string;
  /** Percentual de comissão do marketplace */
  commission_rate: number;
  /** Taxa fixa por venda */
  fixed_fee: number;
  /** Percentual de impostos (ex: ICMS, ISS) */
  tax_rate: number;
  /** Percentual de custos operacionais */
  operational_cost_rate: number;
  /** Custo fixo de envio */
  shipping_cost: number;
  /** Percentual de marketing */
  marketing_rate: number;
  /** Tempo médio de recebimento em dias */
  average_payment_term: number;
  /** Custos adicionais personalizados */
  custom_costs?: CustomCost[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  cost: number;
  sale_price: number;
  image?: string;
  created_at: string;
  updated_at: string;
  min_stock?: number;
  barcode?: string;
  supplier_id?: number;
  sku?: string;
  brand?: string;
  model?: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  marketplace_link?: string;
  /** Configurações de precificação para diferentes marketplaces */
  marketplace_pricing?: Record<string, {
    /** Preço sugerido para o marketplace */
    suggested_price: number;
    /** Margem de lucro para o marketplace */
    profit_margin: number;
    /** Custo total para o marketplace */
    total_cost: number;
  }>;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Interfaces para entidades de clientes e fornecedores
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

// Interfaces para itens de transação
export interface TransactionItem {
  id?: number;
  transaction_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

// Interfaces para transações
export interface Transaction {
  /** Unique identifier for the transaction */
  id?: number;
  /** Type of transaction: sale, purchase, or adjustment */
  type: 'sale' | 'purchase' | 'adjustment';
  /** Optional ID of the client (for sales) */
  client_id?: number;
  /** Payment status: paid or pending */
  payment_status: 'paid' | 'pending';
  /** Optional description of the transaction */
  description?: string;
  /** Creation timestamp */
  created_at: string;
  /** User ID for data isolation */
  user_id?: string;
  /** Client details (for display) */
  client?: {
    name: string;
  };
  /** Items in this transaction */
  items?: TransactionItem[];
  /** Total value of the transaction */
  total: number;
  // Campos mantidos para compatibilidade com versão anterior
  product_id?: number;
  quantity?: number;
  unit_price?: number;
}

// Interfaces para orçamentos de clientes
export interface ClientQuoteItem {
  id?: number;
  client_quote_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string;
}

export interface ClientQuote {
  id?: number;
  client_id: number;
  quote_number?: string;
  quote_date: string;
  validity_date?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes?: string;
  total: number;
  created_at?: string;
  updated_at?: string;
  client?: {
    id: number;
    name: string;
  };
  items?: ClientQuoteItem[];
}

// Interfaces para compras
export interface PurchaseQuoteItem {
  id?: number;
  purchase_quote_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string;
}

export interface PurchaseQuote {
  id?: number;
  supplier_id: number;
  quote_number?: string;
  quote_date: string;
  validity_date?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes?: string;
  total: number;
  created_at?: string;
  updated_at?: string;
  supplier?: {
    id: number;
    name: string;
  };
  items?: PurchaseQuoteItem[];
}

export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  received_quantity?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id?: number;
  supplier_id: number;
  order_number?: string;
  order_date: string;
  delivery_date?: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  notes?: string;
  total: number;
  created_at?: string;
  updated_at?: string;
  supplier?: {
    id: number;
    name: string;
  };
  items?: PurchaseOrderItem[];
}

export interface GoodsReceiptItem {
  id?: number;
  goods_receipt_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string;
}

export interface GoodsReceipt {
  id?: number;
  purchase_order_id?: number;
  receipt_number?: string;
  receipt_date: string;
  notes?: string;
  total: number;
  created_at?: string;
  updated_at?: string;
  purchase_order?: {
    id: number;
    order_number: string;
  };
  items?: GoodsReceiptItem[];
}

// Interface para resumo financeiro
export interface FinancialSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  purchasesCount: number;
}

// Tipo do contexto
interface LocalDatabaseContextType {
  // Estados
  products: Product[];
  categories: Category[];
  clients: Client[];
  suppliers: Supplier[];
  transactions: Transaction[];
  clientQuotes: ClientQuote[];
  purchaseQuotes: PurchaseQuote[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  
  // Propriedades calculadas
  lowStockAlerts: Product[];
  subcategories: Record<string, string[]>;
  marketplaceConfigs: MarketplacePricingConfig[];
  
  // Funções para produtos
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProduct: (id: number, product: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  
  // Funções para categorias
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => void;
  updateCategory: (id: number, category: Partial<Category>) => void;
  deleteCategory: (id: number) => void;
  
  // Funções para subcategorias
  addSubcategory: (category: string, subcategory: string) => void;
  updateSubcategory: (category: string, oldSubcategory: string, newSubcategory: string) => void;
  deleteSubcategory: (category: string, subcategory: string) => void;
  
  // Funções para clientes
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  updateClient: (id: number, client: Partial<Client>) => void;
  deleteClient: (id: number) => void;
  
  // Funções para fornecedores
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => void;
  updateSupplier: (id: number, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;
  
  // Funções para transações
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => void;
  updateTransactionStatus: (id: number, status: 'paid' | 'pending') => void;
  deleteTransaction: (id: number) => void;
  
  // Funções para orçamentos de clientes
  addClientQuote: (quote: Omit<ClientQuote, 'id' | 'created_at' | 'updated_at'>) => void;
  updateClientQuote: (id: number, quote: Partial<ClientQuote>) => void;
  deleteClientQuote: (id: number) => void;
  
  // Funções para orçamentos de fornecedores
  addPurchaseQuote: (quote: Omit<PurchaseQuote, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePurchaseQuote: (id: number, quote: Partial<PurchaseQuote>) => void;
  deletePurchaseQuote: (id: number) => void;
  
  // Funções para pedidos de compra
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePurchaseOrder: (id: number, order: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: number) => void;
  
  // Funções para recebimentos
  addGoodsReceipt: (receipt: Omit<GoodsReceipt, 'id' | 'created_at' | 'updated_at'>) => void;
  updateGoodsReceipt: (id: number, receipt: Partial<GoodsReceipt>) => void;
  deleteGoodsReceipt: (id: number) => void;
  
  // Funções para resumo financeiro
  getFinancialSummary: () => Promise<FinancialSummary>;
  
  // Funções de precificação para marketplaces
  calculateMarketplacePricing: (product: Product, marketplaceName: string, desiredProfitMargin?: number) => {
    marketplace: string;
    productCost: number;
    commissionCost: number;
    fixedFee: number;
    taxCost: number;
    operationalCost: number;
    shippingCost: number;
    marketingCost: number;
    customCosts: { name: string; cost: number }[];
    customCostsTotal: number;
    totalCost: number;
    suggestedPrice: number;
    desiredProfitMargin: number;
    actualProfitMargin: number;
    grossProfit: number;
    averagePaymentTerm: number;
  };
  calculateAllMarketplacePricing: (product: Product, desiredProfitMargin?: number) => {
    marketplace: string;
    productCost: number;
    commissionCost: number;
    fixedFee: number;
    taxCost: number;
    operationalCost: number;
    shippingCost: number;
    marketingCost: number;
    customCosts: { name: string; cost: number }[];
    customCostsTotal: number;
    totalCost: number;
    suggestedPrice: number;
    desiredProfitMargin: number;
    actualProfitMargin: number;
    grossProfit: number;
    averagePaymentTerm: number;
  }[];
  updateMarketplaceConfig: (config: MarketplacePricingConfig) => void;
  addMarketplaceConfig: (config: MarketplacePricingConfig) => void;
  removeMarketplaceConfig: (marketplaceName: string) => void;
}

// Criando o contexto
const LocalDatabaseContext = createContext<LocalDatabaseContextType | undefined>(undefined);

// Provedor do contexto
export const LocalDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estados para todas as entidades
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  
  // Verificar se há produtos no total
  console.log('Total de produtos:', products.length);
  
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
  
  // Verificar se há categorias no total
  console.log('Total de categorias:', categories.length);
  
  const [clients, setClients] = useLocalStorage<Client[]>('clients', []);
  
  // Verificar se há clientes no total
  console.log('Total de clientes:', clients.length);
  
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  
  // Verificar se há fornecedores no total
  console.log('Total de fornecedores:', suppliers.length);
  
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  
  // Verificar se há transações com informações do cliente
  console.log('Transações com informações do cliente:', transactions);
  
  // Atualizar transações com informações do cliente quando os clientes forem carregados
  useEffect(() => {
    console.log('Atualizando transações com informações do cliente:', clients);
    if (clients.length > 0) {
      setTransactions((prevTransactions: Transaction[]) => 
        prevTransactions.map((transaction: Transaction) => {
          // Sempre atualizar transações que têm client_id, mesmo que já tenham informações do cliente
          // Isso garante que as informações do cliente sejam atualizadas se elas mudarem
          if (transaction.client_id) {
            const client = clients.find(c => c.id === transaction.client_id);
            console.log('Encontrado cliente para transação:', client);
            if (client) {
              // Verificar se as informações do cliente já estão corretas
              // Se não estiverem ou se forem diferentes, atualizar
              if (!transaction.client || transaction.client.name !== client.name) {
                console.log('Atualizando transação com informações do cliente:', transaction.id, client.name);
                return {
                  ...transaction,
                  client: { name: client.name }
                };
              } else {
                console.log('Transação já tem informações do cliente corretas:', transaction.id, transaction.client.name);
              }
            } else {
              // Se o cliente não for encontrado, remover as informações do cliente para forçar atualização
              // Isso pode acontecer se o cliente foi excluído
              console.log('Cliente não encontrado para transação, removendo informações do cliente:', transaction.id);
              return {
                ...transaction,
                client: undefined
              };
            }
          }
          return transaction;
        })
      );
    }
  }, [clients]);
  
  // Verificar se há transações que precisam ser atualizadas quando clients mudam
  // Isso garante que transações convertidas de orçamentos sejam atualizadas corretamente
  useEffect(() => {
    console.log('Verificando transações com clientes:', transactions, clients);
    if (transactions.length > 0 && clients.length > 0) {
      // Verificar se há transações que precisam ser atualizadas
      const needsUpdate = transactions.some((transaction: Transaction) => 
        transaction.client_id && (!transaction.client || !transaction.client.name)
      );
      
      if (needsUpdate) {
        console.log('Atualizando transações com informações do cliente');
        setTransactions((prevTransactions: Transaction[]) => 
          prevTransactions.map((transaction: Transaction) => {
            // Verificar transações que têm client_id mas podem não ter informações do cliente atualizadas
            if (transaction.client_id && (!transaction.client || !transaction.client.name)) {
              const client = clients.find(c => c.id === transaction.client_id);
              console.log('Verificando transação:', transaction.id, client);
              if (client) {
                console.log('Atualizando transação com informações do cliente:', transaction.id, client.name);
                return {
                  ...transaction,
                  client: { name: client.name }
                };
              }
            }
            return transaction;
          })
        );
      }
    }
  }, [clients]); // Removido transactions das dependências para evitar loop infinito
  
  const [clientQuotes, setClientQuotes] = useLocalStorage<ClientQuote[]>('clientQuotes', []);
  
  // Log para debug
  console.log('ClientQuotes carregados:', clientQuotes);
  
  // Verificar se há orçamentos com client_id
  clientQuotes.forEach(quote => {
    if (quote.client_id) {
      console.log('Orçamento com client_id:', quote.id, quote.client_id);
    }
    
    // Verificar se há informações do cliente no orçamento
    if (quote.client) {
      console.log('Orçamento com informações do cliente:', quote.id, quote.client.name);
    }
  });
  
  // Verificar se há orçamentos no total
  console.log('Total de orçamentos carregados:', clientQuotes.length);
  
  // Verificar se há orçamentos com informações do cliente
  clientQuotes.forEach(quote => {
    if (quote.client) {
      console.log('Orçamento com informações do cliente:', quote.id, quote.client.name);
    }
  });
  
  // Atualizar orçamentos com informações do cliente quando os clientes forem carregados
  useEffect(() => {
    console.log('Atualizando orçamentos com informações do cliente:', clients);
    if (clients.length > 0) {
      setClientQuotes((prevQuotes: ClientQuote[]) => 
        prevQuotes.map((quote: ClientQuote) => {
          if (quote.client_id) {
            const client = clients.find(c => c.id === quote.client_id);
            console.log('Encontrado cliente para orçamento:', client);
            if (client) {
              return {
                ...quote,
                client: { id: client.id, name: client.name }
              };
            }
          }
          return quote;
        })
      );
    }
  }, [clients]);
  
  // Verificar se há orçamentos com informações do cliente
  console.log('Orçamentos com informações do cliente:', clientQuotes);
  
  // Verificar se há orçamentos com informações do cliente
  clientQuotes.forEach(quote => {
    if (quote.client) {
      console.log('Orçamento com informações do cliente carregado:', quote.id, quote.client.name);
    }
  });
  
  // Verificar se há orçamentos com informações do cliente
  console.log('Orçamentos com informações do cliente:', clientQuotes);
  
  const [purchaseQuotes, setPurchaseQuotes] = useLocalStorage<PurchaseQuote[]>('purchaseQuotes', []);
  
  // Verificar se há orçamentos de fornecedores no total
  console.log('Total de orçamentos de fornecedores:', purchaseQuotes.length);
  
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', []);
  
  // Verificar se há pedidos de compra no total
  console.log('Total de pedidos de compra:', purchaseOrders.length);
  
  const [goodsReceipts, setGoodsReceipts] = useLocalStorage<GoodsReceipt[]>('goodsReceipts', []);
  
  // Verificar se há recebimentos no total
  console.log('Total de recebimentos:', goodsReceipts.length);
  
  // Estado para subcategorias
  const [subcategories, setSubcategories] = useLocalStorage<Record<string, string[]>>('subcategories', {});
  
  // Verificar se há subcategorias no total
  console.log('Total de subcategorias:', Object.keys(subcategories).length);
  
  // Configurações de marketplaces
  const [marketplaceConfigs, setMarketplaceConfigs] = useLocalStorage<MarketplacePricingConfig[]>('marketplaceConfigs', [
    // Configurações padrão
    {
      name: 'Mercado Livre',
      commission_rate: 12, // 12% de comissão
      fixed_fee: 5.00, // Taxa fixa de R$ 5,00
      tax_rate: 19, // 19% de impostos (ICMS + ISS)
      operational_cost_rate: 5, // 5% de custos operacionais
      shipping_cost: 15.00, // Custo médio de envio
      marketing_rate: 3, // 3% para marketing
      average_payment_term: 14 // 14 dias para receber
    },
    {
      name: 'Amazon',
      commission_rate: 15, // 15% de comissão
      fixed_fee: 3.00, // Taxa fixa de R$ 3,00
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 4, // 4% de custos operacionais
      shipping_cost: 12.00, // Custo médio de envio
      marketing_rate: 2, // 2% para marketing
      average_payment_term: 10 // 10 dias para receber
    },
    {
      name: 'Shopee',
      commission_rate: 10, // 10% de comissão
      fixed_fee: 2.00, // Taxa fixa de R$ 2,00
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 3, // 3% de custos operacionais
      shipping_cost: 10.00, // Custo médio de envio
      marketing_rate: 4, // 4% para marketing
      average_payment_term: 7 // 7 dias para receber
    },
    {
      name: 'Americanas',
      commission_rate: 18, // 18% de comissão
      fixed_fee: 4.50, // Taxa fixa de R$ 4,50
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 6, // 6% de custos operacionais
      shipping_cost: 14.00, // Custo médio de envio
      marketing_rate: 3.5, // 3.5% para marketing
      average_payment_term: 15 // 15 dias para receber
    },
    {
      name: 'Magazine Luiza',
      commission_rate: 16, // 16% de comissão
      fixed_fee: 3.50, // Taxa fixa de R$ 3,50
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 5.5, // 5.5% de custos operacionais
      shipping_cost: 13.00, // Custo médio de envio
      marketing_rate: 4, // 4% para marketing
      average_payment_term: 12 // 12 dias para receber
    },
    {
      name: 'Casas Bahia',
      commission_rate: 17, // 17% de comissão
      fixed_fee: 4.00, // Taxa fixa de R$ 4,00
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 5.5, // 5.5% de custos operacionais
      shipping_cost: 13.50, // Custo médio de envio
      marketing_rate: 3.5, // 3.5% para marketing
      average_payment_term: 13 // 13 dias para receber
    },
    {
      name: 'Carrefour',
      commission_rate: 14, // 14% de comissão
      fixed_fee: 3.80, // Taxa fixa de R$ 3,80
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 5, // 5% de custos operacionais
      shipping_cost: 12.50, // Custo médio de envio
      marketing_rate: 3, // 3% para marketing
      average_payment_term: 11 // 11 dias para receber
    },
    {
      name: 'Via',
      commission_rate: 16, // 16% de comissão
      fixed_fee: 4.20, // Taxa fixa de R$ 4,20
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 5.2, // 5.2% de custos operacionais
      shipping_cost: 13.00, // Custo médio de envio
      marketing_rate: 3.2, // 3.2% para marketing
      average_payment_term: 12 // 12 dias para receber
    },
    {
      name: 'Submarino',
      commission_rate: 15, // 15% de comissão
      fixed_fee: 3.50, // Taxa fixa de R$ 3,50
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 4.8, // 4.8% de custos operacionais
      shipping_cost: 12.00, // Custo médio de envio
      marketing_rate: 2.8, // 2.8% para marketing
      average_payment_term: 10 // 10 dias para receber
    },
    {
      name: 'Extra',
      commission_rate: 16, // 16% de comissão
      fixed_fee: 4.00, // Taxa fixa de R$ 4,00
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 5.1, // 5.1% de custos operacionais
      shipping_cost: 12.80, // Custo médio de envio
      marketing_rate: 3.1, // 3.1% para marketing
      average_payment_term: 11 // 11 dias para receber
    },
    {
      name: 'Ponto Frio',
      commission_rate: 17, // 17% de comissão
      fixed_fee: 4.30, // Taxa fixa de R$ 4,30
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 5.3, // 5.3% de custos operacionais
      shipping_cost: 13.20, // Custo médio de envio
      marketing_rate: 3.3, // 3.3% para marketing
      average_payment_term: 12 // 12 dias para receber
    },
    {
      name: 'Fast Shop',
      commission_rate: 15, // 15% de comissão
      fixed_fee: 3.70, // Taxa fixa de R$ 3,70
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 4.9, // 4.9% de custos operacionais
      shipping_cost: 12.30, // Custo médio de envio
      marketing_rate: 2.9, // 2.9% para marketing
      average_payment_term: 10 // 10 dias para receber
    },
    {
      name: 'Walmart',
      commission_rate: 13, // 13% de comissão
      fixed_fee: 3.90, // Taxa fixa de R$ 3,90
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 4.7, // 4.7% de custos operacionais
      shipping_cost: 12.60, // Custo médio de envio
      marketing_rate: 3.0, // 3.0% para marketing
      average_payment_term: 9 // 9 dias para receber
    },
    {
      name: 'Lojas Renner',
      commission_rate: 14, // 14% de comissão
      fixed_fee: 3.60, // Taxa fixa de R$ 3,60
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 4.6, // 4.6% de custos operacionais
      shipping_cost: 12.40, // Custo médio de envio
      marketing_rate: 3.1, // 3.1% para marketing
      average_payment_term: 11 // 11 dias para receber
    },
    {
      name: 'C&A',
      commission_rate: 15, // 15% de comissão
      fixed_fee: 3.80, // Taxa fixa de R$ 3,80
      tax_rate: 19, // 19% de impostos
      operational_cost_rate: 4.8, // 4.8% de custos operacionais
      shipping_cost: 12.50, // Custo médio de envio
      marketing_rate: 3.2, // 3.2% para marketing
      average_payment_term: 10 // 10 dias para receber
    }
  ]);
  
  // Remove manual localStorage saving as useLocalStorage handles it automatically
  
  // Funções de precificação para marketplaces
  
  /**
   * Calcula o preço sugerido para um produto em um marketplace específico
   * @param product O produto para calcular o preço
   * @param marketplaceName Nome do marketplace
   * @param desiredProfitMargin Margem de lucro desejada (em %)
   * @returns Objeto com detalhes do cálculo de precificação
   */
  const calculateMarketplacePricing = useCallback((
    product: Product, 
    marketplaceName: string, 
    desiredProfitMargin: number = 20
  ) => {
    // Encontrar configuração do marketplace
    const marketplaceConfig = marketplaceConfigs.find(config => config.name === marketplaceName);
    
    if (!marketplaceConfig) {
      throw new Error(`Configuração não encontrada para o marketplace: ${marketplaceName}`);
    }
    
    // Custo do produto
    const productCost = product.cost;
    
    // Cálculo dos custos padrão
    const commissionCost = (marketplaceConfig.commission_rate / 100) * productCost;
    const fixedFee = marketplaceConfig.fixed_fee;
    const taxCost = (marketplaceConfig.tax_rate / 100) * productCost;
    const operationalCost = (marketplaceConfig.operational_cost_rate / 100) * productCost;
    const shippingCost = marketplaceConfig.shipping_cost;
    const marketingCost = (marketplaceConfig.marketing_rate / 100) * productCost;
    
    // Cálculo dos custos adicionais personalizados
    let customCostsTotal = 0;
    const customCostsDetails: { name: string; cost: number }[] = [];
    
    if (marketplaceConfig.custom_costs && marketplaceConfig.custom_costs.length > 0) {
      marketplaceConfig.custom_costs.forEach(cost => {
        let costValue = 0;
        if (cost.type === 'fixed') {
          costValue = cost.value;
        } else if (cost.type === 'percentage') {
          costValue = (cost.value / 100) * productCost;
        }
        
        customCostsTotal += costValue;
        customCostsDetails.push({ name: cost.name, cost: costValue });
      });
    }
    
    // Custo total
    const totalCost = productCost + commissionCost + fixedFee + taxCost + operationalCost + shippingCost + marketingCost + customCostsTotal;
    
    // Cálculo do preço com margem de lucro desejada
    const suggestedPrice = totalCost / (1 - (desiredProfitMargin / 100));
    
    // Margem de lucro real (pode ser diferente da desejada devido a arredondamentos)
    const actualProfitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;
    
    // Lucro bruto
    const grossProfit = suggestedPrice - totalCost;
    
    return {
      marketplace: marketplaceConfig.name,
      productCost,
      commissionCost,
      fixedFee,
      taxCost,
      operationalCost,
      shippingCost,
      marketingCost,
      customCosts: customCostsDetails,
      customCostsTotal,
      totalCost,
      suggestedPrice,
      desiredProfitMargin,
      actualProfitMargin,
      grossProfit,
      averagePaymentTerm: marketplaceConfig.average_payment_term
    };
  }, [marketplaceConfigs]);
  
  /**
   * Calcula a precificação para todos os marketplaces configurados
   * @param product O produto para calcular o preço
   * @param desiredProfitMargin Margem de lucro desejada (em %)
   * @returns Array com detalhes do cálculo para cada marketplace
   */
  const calculateAllMarketplacePricing = useCallback((
    product: Product, 
    desiredProfitMargin: number = 20
  ) => {
    return marketplaceConfigs.map(config => 
      calculateMarketplacePricing(product, config.name, desiredProfitMargin)
    );
  }, [marketplaceConfigs, calculateMarketplacePricing]);
  
  /**
   * Atualiza as configurações de um marketplace
   * @param config Configuração do marketplace a ser atualizada
   */
  const updateMarketplaceConfig = useCallback((config: MarketplacePricingConfig) => {
    setMarketplaceConfigs(prev => 
      prev.map(c => c.name === config.name ? config : c)
    );
  }, [setMarketplaceConfigs]);
  
  /**
   * Adiciona uma nova configuração de marketplace
   * @param config Nova configuração de marketplace
   */
  const addMarketplaceConfig = useCallback((config: MarketplacePricingConfig) => {
    setMarketplaceConfigs(prev => [...prev, config]);
  }, [setMarketplaceConfigs]);
  
  /**
   * Remove uma configuração de marketplace
   * @param marketplaceName Nome do marketplace a ser removido
   */
  const removeMarketplaceConfig = useCallback((marketplaceName: string) => {
    setMarketplaceConfigs(prev => prev.filter(c => c.name !== marketplaceName));
  }, [setMarketplaceConfigs]);
  
  // Calcular produtos com estoque baixo
  const lowStockAlerts = useMemo(() => {
    console.log('Calculando alertas de estoque baixo:', products);
    const alerts = products.filter(product => 
      product.min_stock !== undefined && 
      product.quantity <= product.min_stock
    );
    console.log('Alertas de estoque baixo:', alerts);
    return alerts;
  }, [products]);
  
  // Funções para produtos
  const addProduct = (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando novo produto:', newProduct);
    
    // Verificar se há produtos no total
    console.log('Total de produtos:', products.length);
    setProducts(prev => [...prev, newProduct]);
  };
  
  const updateProduct = (id: number, product: Partial<Product>) => {
    console.log('Atualizando produto:', id, product);
    
    // Verificar se há produtos no total
    console.log('Total de produtos:', products.length);
    setProducts(prev => 
      prev.map(p => 
        p.id === id 
          ? { ...p, ...product, updated_at: new Date().toISOString() } 
          : p
      )
    );
  };
  
  const deleteProduct = (id: number) => {
    console.log('Excluindo produto:', id);
    
    // Verificar se há produtos no total
    console.log('Total de produtos:', products.length);
    setProducts(prev => prev.filter(p => p.id !== id));
  };
  
  // Funções para categorias
  const addCategory = (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando nova categoria:', newCategory);
    
    // Verificar se há categorias no total
    console.log('Total de categorias:', categories.length);
    setCategories(prev => [...prev, newCategory]);
  };
  
  const updateCategory = (id: number, category: Partial<Category>) => {
    console.log('Atualizando categoria:', id, category);
    
    // Verificar se há categorias no total
    console.log('Total de categorias:', categories.length);
    setCategories(prev => 
      prev.map(c => 
        c.id === id 
          ? { ...c, ...category, updated_at: new Date().toISOString() } 
          : c
      )
    );
    
    // Atualizar também as subcategorias associadas se o nome da categoria mudar
    const oldCategory = categories.find(c => c.id === id);
    if (oldCategory && category.name && oldCategory.name !== category.name) {
      const subcats = subcategories[oldCategory.name] || [];
      setSubcategories(prev => {
        const newSubcats = { ...prev };
        delete newSubcats[oldCategory.name];
        newSubcats[category.name as string] = subcats;
        return newSubcats;
      });
      
      // Atualizar produtos que usam essa categoria
      setProducts(prev => 
        prev.map(p => 
          p.category === oldCategory.name 
            ? { ...p, category: category.name as string } 
            : p
        )
      );
    }
  };
  
  const deleteCategory = (id: number) => {
    console.log('Excluindo categoria:', id);
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete) {
      
      // Verificar se há categorias no total
      console.log('Total de categorias:', categories.length);
      setCategories(prev => prev.filter(c => c.id !== id));
      
      // Remover subcategorias associadas
      setSubcategories(prev => {
        const newSubcats = { ...prev };
        delete newSubcats[categoryToDelete.name];
        return newSubcats;
      });
      
      // Remover categoria dos produtos
      setProducts(prev => 
        prev.map(p => 
          p.category === categoryToDelete.name 
            ? { ...p, category: '' } 
            : p
        )
      );
    }
  };
  
  // Funções para subcategorias
  const addSubcategory = (category: string, subcategory: string) => {
    console.log('Adicionando nova subcategoria:', category, subcategory);
    
    // Verificar se há subcategorias no total
    console.log('Total de subcategorias:', Object.keys(subcategories).length);
    setSubcategories(prev => {
      const newSubcats = { ...prev };
      if (!newSubcats[category]) {
        newSubcats[category] = [];
      }
      
      // Verificar se a subcategoria já existe
      if (!newSubcats[category].includes(subcategory)) {
        newSubcats[category] = [...newSubcats[category], subcategory].sort();
      }
      
      return newSubcats;
    });
  };
  
  const updateSubcategory = (category: string, oldSubcategory: string, newSubcategory: string) => {
    console.log('Atualizando subcategoria:', category, oldSubcategory, newSubcategory);
    
    // Verificar se há subcategorias no total
    console.log('Total de subcategorias:', Object.keys(subcategories).length);
    setSubcategories(prev => {
      const newSubcats = { ...prev };
      if (newSubcats[category]) {
        const index = newSubcats[category].indexOf(oldSubcategory);
        if (index !== -1) {
          newSubcats[category] = [...newSubcats[category]];
          newSubcats[category][index] = newSubcategory;
          newSubcats[category].sort();
        }
      }
      return newSubcats;
    });
    
    // Atualizar produtos que usam essa subcategoria
    setProducts(prev => 
      prev.map(p => 
        p.category === category && p.subcategory === oldSubcategory
          ? { ...p, subcategory: newSubcategory }
          : p
      )
    );
  };
  
  const deleteSubcategory = (category: string, subcategory: string) => {
    console.log('Excluindo subcategoria:', category, subcategory);
    
    // Verificar se há subcategorias no total
    console.log('Total de subcategorias:', Object.keys(subcategories).length);
    setSubcategories(prev => {
      const newSubcats = { ...prev };
      if (newSubcats[category]) {
        newSubcats[category] = newSubcats[category].filter(sub => sub !== subcategory);
        // Se não houver mais subcategorias, remover a chave
        if (newSubcats[category].length === 0) {
          delete newSubcats[category];
        }
      }
      return newSubcats;
    });
    
    // Remover subcategoria dos produtos
    setProducts(prev => 
      prev.map(p => 
        p.category === category && p.subcategory === subcategory
          ? { ...p, subcategory: undefined }
          : p
      )
    );
  };
  
  // Funções para clientes
  const addClient = (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando novo cliente:', newClient);
    
    // Verificar se há clientes no total
    console.log('Total de clientes:', clients.length);
    setClients(prev => [...prev, newClient]);
  };
  
  const updateClient = (id: number, client: Partial<Client>) => {
    console.log('Atualizando cliente:', id, client);
    
    // Verificar se há clientes no total
    console.log('Total de clientes:', clients.length);
    setClients(prev => 
      prev.map(c => 
        c.id === id 
          ? { ...c, ...client, updated_at: new Date().toISOString() } 
          : c
      )
    );
  };
  
  const deleteClient = (id: number) => {
    console.log('Excluindo cliente:', id);
    
    // Verificar se há clientes no total
    console.log('Total de clientes:', clients.length);
    setClients(prev => prev.filter(c => c.id !== id));
  };
  
  // Funções para fornecedores
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando novo fornecedor:', newSupplier);
    
    // Verificar se há fornecedores no total
    console.log('Total de fornecedores:', suppliers.length);
    setSuppliers(prev => [...prev, newSupplier]);
  };
  
  const updateSupplier = (id: number, supplier: Partial<Supplier>) => {
    console.log('Atualizando fornecedor:', id, supplier);
    
    // Verificar se há fornecedores no total
    console.log('Total de fornecedores:', suppliers.length);
    setSuppliers(prev => 
      prev.map(s => 
        s.id === id 
          ? { ...s, ...supplier, updated_at: new Date().toISOString() } 
          : s
      )
    );
  };
  
  const deleteSupplier = (id: number) => {
    console.log('Excluindo fornecedor:', id);
    
    // Verificar se há fornecedores no total
    console.log('Total de fornecedores:', suppliers.length);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };
  
  // Funções para transações
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    console.log('addTransaction called with:', transaction);
    // Priorizar as informações do cliente passadas na transação
    // Se não houver, obter informações do cliente se houver client_id
    let clientInfo = transaction.client;
    console.log('Initial clientInfo:', clientInfo);
    
    if (!clientInfo && transaction.client_id) {
      const client = clients.find(c => c.id === transaction.client_id);
      console.log('Client found for transaction:', client);
      if (client) {
        clientInfo = { name: client.name };
      }
    }
    
    // Garantir que sempre tenhamos as informações do cliente se houver client_id
    // Isso é especialmente importante para transações convertidas de orçamentos
    if (transaction.client_id && !clientInfo) {
      // Procurar o cliente mesmo que já tenha passado por uma verificação anterior
      // Isso garante que mesmo que os clientes tenham sido carregados após a transação,
      // ainda assim obtenhamos as informações do cliente
      const client = clients.find(c => c.id === transaction.client_id);
      if (client) {
        clientInfo = { name: client.name };
      }
    }
    
    const newTransaction: Transaction = {
      ...transaction,
      client: clientInfo, // Garantir que as informações do cliente sejam incluídas
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    
    // Verificação final para garantir que transações convertidas de orçamentos
    // tenham as informações do cliente
    if (newTransaction.client_id && !newTransaction.client) {
      console.warn('Transaction is missing client info despite having client_id. This should not happen.');
      // Forçar a obtenção das informações do cliente
      const client = clients.find(c => c.id === newTransaction.client_id);
      if (client) {
        newTransaction.client = { name: client.name };
        console.log('Client info added to transaction:', newTransaction.client);
      }
    }
    
    console.log('New transaction created:', newTransaction);
    
    // Log para debug
    console.log('Adicionando nova transação:', newTransaction);
    console.log('Client ID na transação:', newTransaction.client_id);
    console.log('Informações do cliente na transação:', newTransaction.client);
    
    // Atualizar o estoque com base no tipo de transação
    if (transaction.type === 'sale') {
      // Para vendas, reduzir o estoque
      setProducts(prev => 
        prev.map(product => {
          // Verificar se este produto está na transação
          const isProductInTransaction = transaction.items?.some(item => item.product_id === product.id) ||
            transaction.product_id === product.id;
          
          if (isProductInTransaction) {
            // Calcular a quantidade vendida
            let soldQuantity = 0;
            if (transaction.items && transaction.items.length > 0) {
              // Transação com múltiplos itens
              const item = transaction.items.find(item => item.product_id === product.id);
              if (item) {
                soldQuantity = item.quantity;
              }
            } else if (transaction.product_id === product.id && transaction.quantity !== undefined) {
              // Transação com item único (compatibilidade com versão anterior)
              soldQuantity = transaction.quantity;
            }
            
            // Reduzir a quantidade em estoque
            return {
              ...product,
              quantity: Math.max(0, product.quantity - soldQuantity),
              updated_at: new Date().toISOString()
            };
          }
          return product;
        })
      );
    } else if (transaction.type === 'purchase' || transaction.type === 'adjustment') {
      // Para compras e ajustes, aumentar o estoque
      setProducts(prev => 
        prev.map(product => {
          // Verificar se este produto está na transação
          const isProductInTransaction = transaction.items?.some(item => item.product_id === product.id) ||
            transaction.product_id === product.id;
          
          if (isProductInTransaction) {
            // Calcular a quantidade adicionada
            let addedQuantity = 0;
            if (transaction.items && transaction.items.length > 0) {
              // Transação com múltiplos itens
              const item = transaction.items.find(item => item.product_id === product.id);
              if (item) {
                addedQuantity = item.quantity;
              }
            } else if (transaction.product_id === product.id && transaction.quantity !== undefined) {
              // Transação com item único (compatibilidade com versão anterior)
              addedQuantity = transaction.quantity;
            }
            
            // Aumentar a quantidade em estoque
            return {
              ...product,
              quantity: product.quantity + addedQuantity,
              updated_at: new Date().toISOString()
            };
          }
          return product;
        })
      );
    }
    
    // Log para debug
    console.log('Transações antes de adicionar:', transactions);
    setTransactions(prev => [...prev, newTransaction]);
    console.log('Transações após adicionar:', [...transactions, newTransaction]);
    
    return newTransaction;
  };
  
  const updateTransaction = (id: number, transaction: Partial<Transaction>) => {
    // Se o client_id foi atualizado, obter as informações do cliente
    let clientInfo = undefined;
    if (transaction.client_id) {
      const client = clients.find(c => c.id === transaction.client_id);
      if (client) {
        clientInfo = { name: client.name };
      }
    }
    
    setTransactions(prev => 
      prev.map(t => {
        if (t.id === id) {
          // Se estamos atualizando o client_id, incluir as informações do cliente
          if (transaction.client_id !== undefined) {
            return { 
              ...t, 
              ...transaction, 
              client: clientInfo || t.client, // Manter informações existentes se não houver nova
              updated_at: new Date().toISOString() 
            };
          }
          // Para outras atualizações, manter as informações do cliente existentes
          return { 
            ...t, 
            ...transaction, 
            client: transaction.client || t.client, // Garantir que as informações do cliente sejam mantidas
            updated_at: new Date().toISOString() 
          };
        }
        return t;
      })
    );
  };
  
  const updateTransactionStatus = async (id: number, status: 'paid' | 'pending') => {
    return new Promise<void>((resolve) => {
      setTransactions(prev => 
        prev.map(t => {
          if (t.id === id) {
            // Manter todas as informações existentes da transação, apenas atualizar o status
            return { 
              ...t, 
              payment_status: status, 
              updated_at: new Date().toISOString() 
            };
          }
          return t;
        })
      );
      // Pequeno atraso para simular operação assíncrona
      setTimeout(() => resolve(), 10);
    });
  };
  
  const deleteTransaction = async (id: number) => {
    return new Promise<void>((resolve) => {
      const transaction = transactions.find(t => t.id === id);
      
      if (transaction) {
        // Reverter as mudanças no estoque
        if (transaction.type === 'sale') {
          // Para vendas, aumentar o estoque (reverter)
          setProducts(prev => 
            prev.map(product => {
              // Verificar se este produto está na transação
              const isProductInTransaction = transaction.items?.some(item => item.product_id === product.id) ||
                transaction.product_id === product.id;
              
              if (isProductInTransaction) {
                // Calcular a quantidade vendida
                let soldQuantity = 0;
                if (transaction.items && transaction.items.length > 0) {
                  // Transação com múltiplos itens
                  const item = transaction.items.find(item => item.product_id === product.id);
                  if (item) {
                    soldQuantity = item.quantity;
                  }
                } else if (transaction.product_id === product.id && transaction.quantity !== undefined) {
                  // Transação com item único (compatibilidade com versão anterior)
                  soldQuantity = transaction.quantity;
                }
                
                // Aumentar a quantidade em estoque (reverter venda)
                return {
                  ...product,
                  quantity: product.quantity + soldQuantity,
                  updated_at: new Date().toISOString()
                };
              }
              return product;
            })
          );
        } else if (transaction.type === 'purchase' || transaction.type === 'adjustment') {
          // Para compras e ajustes, reduzir o estoque (reverter)
          setProducts(prev => 
            prev.map(product => {
              // Verificar se este produto está na transação
              const isProductInTransaction = transaction.items?.some(item => item.product_id === product.id) ||
                transaction.product_id === product.id;
              
              if (isProductInTransaction) {
                // Calcular a quantidade adicionada
                let addedQuantity = 0;
                if (transaction.items && transaction.items.length > 0) {
                  // Transação com múltiplos itens
                  const item = transaction.items.find(item => item.product_id === product.id);
                  if (item) {
                    addedQuantity = item.quantity;
                  }
                } else if (transaction.product_id === product.id && transaction.quantity !== undefined) {
                  // Transação com item único (compatibilidade com versão anterior)
                  addedQuantity = transaction.quantity;
                }
                
                // Reduzir a quantidade em estoque (reverter compra/ajuste)
                return {
                  ...product,
                  quantity: Math.max(0, product.quantity - addedQuantity),
                  updated_at: new Date().toISOString()
                };
              }
              return product;
            })
          );
        }
      }
      
      setTransactions(prev => prev.filter(t => t.id !== id));
      // Pequeno atraso para simular operação assíncrona
      setTimeout(() => resolve(), 10);
    });
  };
  
  // Funções para orçamentos de clientes
  const addClientQuote = (quote: Omit<ClientQuote, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('addClientQuote called with:', quote);
    // Encontrar o cliente para associar ao orçamento
    const client = clients.find(c => c.id === quote.client_id);
    console.log('Found client:', client);
    
    const newQuote: ClientQuote = {
      ...quote,
      client: client ? { id: client.id, name: client.name } : undefined,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('New quote to be added:', newQuote);
    setClientQuotes(prev => [...prev, newQuote]);
  };
  
  // Log para debug
  console.log('ClientQuotes atualizados:', clientQuotes);
  
  // Verificar se há orçamentos com client_id
  clientQuotes.forEach(quote => {
    if (quote.client_id) {
      console.log('Orçamento com client_id:', quote.id, quote.client_id);
    }
    
    // Verificar se há informações do cliente no orçamento
    if (quote.client) {
      console.log('Orçamento com informações do cliente:', quote.id, quote.client.name);
    }
  });
  
  // Verificar se há orçamentos no total
  console.log('Total de orçamentos:', clientQuotes.length);
  
  // Verificar se há orçamentos com client_id
  clientQuotes.forEach(quote => {
    if (quote.client_id) {
      console.log('Orçamento com client_id:', quote.id, quote.client_id);
    }
  });
  
  const updateClientQuote = (id: number, quote: Partial<ClientQuote>) => {
    console.log('updateClientQuote called with id:', id, 'and quote:', quote);
    // Encontrar o cliente se o client_id foi atualizado
    let clientInfo = undefined;
    if (quote.client_id) {
      const client = clients.find(c => c.id === quote.client_id);
      console.log('Found client for update:', client);
      if (client) {
        clientInfo = { id: client.id, name: client.name };
      }
    }
    
    setClientQuotes(prev => 
      prev.map(q => 
        q.id === id 
          ? { ...q, ...quote, client: clientInfo || q.client, updated_at: new Date().toISOString() } 
          : q
      )
    );
  };
  
  const deleteClientQuote = (id: number) => {
    setClientQuotes(prev => prev.filter(q => q.id !== id));
  };
  
  // Funções para orçamentos de fornecedores
  const addPurchaseQuote = (quote: Omit<PurchaseQuote, 'id' | 'created_at' | 'updated_at'>) => {
    const newQuote: PurchaseQuote = {
      ...quote,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando novo orçamento de fornecedor:', newQuote);
    
    // Verificar se há orçamentos de fornecedores no total
    console.log('Total de orçamentos de fornecedores:', purchaseQuotes.length);
    setPurchaseQuotes(prev => [...prev, newQuote]);
  };
  
  const updatePurchaseQuote = (id: number, quote: Partial<PurchaseQuote>) => {
    console.log('Atualizando orçamento de fornecedor:', id, quote);
    
    // Verificar se há orçamentos de fornecedores no total
    console.log('Total de orçamentos de fornecedores:', purchaseQuotes.length);
    setPurchaseQuotes(prev => 
      prev.map(q => 
        q.id === id 
          ? { ...q, ...quote, updated_at: new Date().toISOString() } 
          : q
      )
    );
  };
  
  const deletePurchaseQuote = (id: number) => {
    console.log('Excluindo orçamento de fornecedor:', id);
    
    // Verificar se há orçamentos de fornecedores no total
    console.log('Total de orçamentos de fornecedores:', purchaseQuotes.length);
    setPurchaseQuotes(prev => prev.filter(q => q.id !== id));
  };
  
  // Funções para pedidos de compra
  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando novo pedido de compra:', newOrder);
    
    // Verificar se há pedidos de compra no total
    console.log('Total de pedidos de compra:', purchaseOrders.length);
    setPurchaseOrders(prev => [...prev, newOrder]);
  };
  
  const updatePurchaseOrder = (id: number, order: Partial<PurchaseOrder>) => {
    console.log('Atualizando pedido de compra:', id, order);
    
    // Verificar se há pedidos de compra no total
    console.log('Total de pedidos de compra:', purchaseOrders.length);
    setPurchaseOrders(prev => 
      prev.map(o => 
        o.id === id 
          ? { ...o, ...order, updated_at: new Date().toISOString() } 
          : o
      )
    );
  };
  
  const deletePurchaseOrder = (id: number) => {
    console.log('Excluindo pedido de compra:', id);
    
    // Verificar se há pedidos de compra no total
    console.log('Total de pedidos de compra:', purchaseOrders.length);
    setPurchaseOrders(prev => prev.filter(o => o.id !== id));
  };
  
  // Funções para recebimentos
  const addGoodsReceipt = (receipt: Omit<GoodsReceipt, 'id' | 'created_at' | 'updated_at'>) => {
    const newReceipt: GoodsReceipt = {
      ...receipt,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('Adicionando novo recebimento:', newReceipt);
    
    // Verificar se há recebimentos no total
    console.log('Total de recebimentos:', goodsReceipts.length);
    setGoodsReceipts(prev => [...prev, newReceipt]);
  };
  
  const updateGoodsReceipt = (id: number, receipt: Partial<GoodsReceipt>) => {
    console.log('Atualizando recebimento:', id, receipt);
    
    // Verificar se há recebimentos no total
    console.log('Total de recebimentos:', goodsReceipts.length);
    setGoodsReceipts(prev => 
      prev.map(r => 
        r.id === id 
          ? { ...r, ...receipt, updated_at: new Date().toISOString() } 
          : r
      )
    );
  };
  
  const deleteGoodsReceipt = (id: number) => {
    console.log('Excluindo recebimento:', id);
    
    // Verificar se há recebimentos no total
    console.log('Total de recebimentos:', goodsReceipts.length);
    setGoodsReceipts(prev => prev.filter(r => r.id !== id));
  };
  
  // Função para obter resumo financeiro
  const getFinancialSummary = useCallback(async (): Promise<FinancialSummary> => {
    console.log('Calculando resumo financeiro:', transactions);
    // Calcular vendas totais (apenas transações de venda pagas)
    const totalSales = transactions
      .filter(t => t.type === 'sale' && t.payment_status === 'paid')
      .reduce((sum, t) => sum + t.total, 0);
    
    // Calcular compras totais (apenas transações de compra)
    const totalPurchases = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.total, 0);
    
    // Calcular despesas totais (ajustes negativos)
    const totalExpenses = transactions
      .filter(t => t.type === 'adjustment' && t.total < 0)
      .reduce((sum, t) => sum + Math.abs(t.total), 0);
    
    // Calcular lucro líquido
    const netProfit = totalSales - totalPurchases - totalExpenses;
    
    // Contar vendas (apenas transações de venda pagas)
    const salesCount = transactions
      .filter(t => t.type === 'sale' && t.payment_status === 'paid')
      .length;
    
    // Contar compras (apenas transações de compra)
    const purchasesCount = transactions
      .filter(t => t.type === 'purchase')
      .length;
    
    const summary = {
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      salesCount,
      purchasesCount
    };
    console.log('Resumo financeiro:', summary);
    return summary;
  }, [transactions]);
  
  // Valor do contexto
  const contextValue: LocalDatabaseContextType = {
    // Estados
    products,
    categories,
    clients,
    suppliers,
    transactions,
    clientQuotes,
    purchaseQuotes,
    purchaseOrders,
    goodsReceipts,
    
    // Propriedades calculadas
    lowStockAlerts,
    subcategories,
    marketplaceConfigs,
    
    // Funções
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addClient,
    updateClient,
    deleteClient,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
    addClientQuote,
    updateClientQuote,
    deleteClientQuote,
    addPurchaseQuote,
    updatePurchaseQuote,
    deletePurchaseQuote,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addGoodsReceipt,
    updateGoodsReceipt,
    deleteGoodsReceipt,
    getFinancialSummary,
    
    // Funções de precificação
    calculateMarketplacePricing,
    calculateAllMarketplacePricing,
    updateMarketplaceConfig,
    addMarketplaceConfig,
    removeMarketplaceConfig
  };
  
  return (
    <LocalDatabaseContext.Provider value={contextValue}>
      {children}
    </LocalDatabaseContext.Provider>
  );
};

// Hook para usar o contexto
export const useLocalDatabase = () => {
  const context = useContext(LocalDatabaseContext);
  if (context === undefined) {
    throw new Error('useLocalDatabase must be used within a LocalDatabaseProvider');
  }
  return context;
};

export default LocalDatabaseContext;