/**
 * Consolidated Database Types
 * 
 * This file contains all entity types used throughout the application.
 * Import from '@/shared/types' for cleaner imports.
 */

// ============================================
// INVENTORY TYPES
// ============================================

export interface CustomCost {
    name: string;
    value: number;
    type: 'fixed' | 'percentage';
    category?: string;
}

export interface MarketplacePricingConfig {
    name: string;
    commission_rate: number;
    fixed_fee: number;
    tax_rate: number;
    operational_cost_rate: number;
    shipping_cost: number;
    marketing_rate: number;
    average_payment_term: number;
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
    images?: string[];
    created_at: string;
    updated_at: string;
    min_stock?: number;
    location?: string;
    barcode?: string;
    supplier_id?: number;
    sku?: string;
    brand?: string;
    model?: string;
    weight?: number;
    height?: number;
    width?: number;
    length?: number;
    unit?: string;
    technical_specs?: { name: string; value: string; }[];
    marketplace_link?: string;
    marketplace_pricing?: Record<string, {
        suggested_price: number;
        profit_margin: number;
        total_cost: number;
    }>;
    supplier_mappings?: Record<string, string>;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// FINANCE TYPES
// ============================================

export interface TransactionItem {
    id?: number;
    transaction_id?: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface Transaction {
    id?: number;
    type: 'sale' | 'purchase' | 'adjustment';
    client_id?: number;
    payment_status: 'paid' | 'pending';
    description?: string;
    created_at: string;
    user_id?: string;
    client?: {
        name: string;
    };
    items?: TransactionItem[];
    total: number;
    product_id?: number;
    quantity?: number;
    unit_price?: number;
    points_earned?: number;
    points_redeemed?: number;
    channel?: string;
    channel_fees?: number;
}

export interface FixedCost {
    id: number;
    description: string;
    value: number;
    category: 'aluguel' | 'energia' | 'internet' | 'marketing' | 'salarios' | 'sistemas' | 'outros';
    due_day: number;
    created_at: string;
}

export interface MonthlyGoal {
    id: number;
    month: number;
    year: number;
    target: number;
    created_at: string;
}

export interface FinancialSummary {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalFixedCosts: number;
    netProfit: number;
    salesCount: number;
    purchasesCount: number;
    breakEvenPoint: number;
}

// ============================================
// CLIENT & SUPPLIER TYPES
// ============================================

export interface Client {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    birthday?: string;
    origin?: 'whatsapp' | 'manual' | 'import';
    loyalty_points?: number;
    status: 'customer' | 'lead';
    source?: string;
    created_at: string;
    updated_at: string;
}

export interface Supplier {
    id: number;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    payment_terms?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// QUOTES & ORDERS TYPES
// ============================================

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
    status?: 'pending' | 'received' | 'partially_received' | 'rejected';
    created_at?: string;
    updated_at?: string;
    purchase_order?: {
        id: number;
        order_number: string;
        supplier?: {
            id: number;
            name: string;
        };
    };
    items?: GoodsReceiptItem[];
}

// ============================================
// CATALOG TYPES
// ============================================

export type CatalogLayout = '1-product' | '2-products' | '3-products' | '4-products';

export type CatalogTheme = 'vibrant' | 'elegant' | 'minimal' | 'christmas' | 'black-friday';

export interface CatalogProduct {
    name: string;
    price: number;
    image?: string;
}

export interface CatalogThemeConfig {
    id: CatalogTheme;
    name: string;
    description: string;
    colors: {
        headerGradient: string[];
        background: string[];
        cardBg: string;
        badgeGradient: string[];
        priceGradient: string[];
        textPrimary: string;
        textSecondary: string;
    };
    fonts: {
        header: string;
        body: string;
    };
    effects: {
        shadowColor: string;
        shadowBlur: number;
        borderRadius: number;
    };
    badge: {
        text: string;
        emoji: string;
    };
}

export interface WatermarkConfig {
    enabled: boolean;
    type: 'text' | 'logo';
    content: string;
    position: 'bottom-left' | 'bottom-right' | 'bottom-center';
    opacity: number;
    socialMedia?: {
        instagram?: string;
        whatsapp?: string;
    };
}

export interface CatalogGenerationOptions {
    products: CatalogProduct[];
    title: string;
    theme: CatalogTheme;
    watermark?: WatermarkConfig;
    format?: 'png' | 'jpg' | 'gif';
    layout?: CatalogLayout;
}

export interface CatalogResult {
    blob: Blob;
    format: string;
    layout: CatalogLayout;
    theme: CatalogTheme;
    timestamp: number;
}
