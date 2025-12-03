import { Product } from '../contexts/LocalDatabaseContext';

/**
 * Converte um produto do sistema para o formato compatível com Mercado Livre
 * @param product Produto do sistema
 * @returns Produto formatado para Mercado Livre
 */
export const convertToMercadoLivreFormat = (product: Product) => {
  return {
    title: product.name,
    description: product.description || `Produto ${product.name} de qualidade`,
    price: product.sale_price,
    quantity: product.quantity,
    sku: product.sku || `SKU-${product.id || Date.now()}`,
    barcode: product.barcode,
    brand: product.brand || 'Sem marca',
    model: product.model || '',
    weight: product.weight ? product.weight * 1000 : 0, // Converter kg para gramas
    height: product.height ? product.height * 10 : 0, // Converter cm para mm
    width: product.width ? product.width * 10 : 0, // Converter cm para mm
    length: product.length ? product.length * 10 : 0, // Converter cm para mm
    category: product.category,
    supplier: product.supplier,
    images: product.image ? [product.image] : []
  };
};

/**
 * Converte um produto do sistema para o formato compatível com Shopee
 * @param product Produto do sistema
 * @returns Produto formatado para Shopee
 */
export const convertToShopeeFormat = (product: Product) => {
  return {
    name: product.name,
    description: product.description || `Produto ${product.name} de qualidade`,
    price: product.sale_price,
    stock: product.quantity,
    sku: product.sku || `SKU-${product.id || Date.now()}`,
    barcode: product.barcode,
    brand: product.brand || 'Sem marca',
    model: product.model || '',
    weight: product.weight || 0, // Em kg
    package_height: product.height || 0, // Em cm
    package_width: product.width || 0, // Em cm
    package_length: product.length || 0, // Em cm
    category: product.category,
    supplier: product.supplier,
    images: product.image ? [product.image] : [],
    condition: 'NEW' // Novo produto
  };
};

/**
 * Exporta produtos para formato CSV compatível com Mercado Livre
 * @param products Lista de produtos
 * @returns String CSV formatada
 */
export const exportToMercadoLivreCSV = (products: Product[]): string => {
  // Cabeçalhos do CSV do Mercado Livre
  const headers = [
    'title', 'description', 'price', 'quantity', 'sku', 'barcode', 
    'brand', 'model', 'weight', 'height', 'width', 'length', 
    'category', 'supplier', 'image_url'
  ];
  
  // Converter produtos para o formato do Mercado Livre
  const mlProducts = products.map(convertToMercadoLivreFormat);
  
  // Criar linhas do CSV
  const csvRows = [
    headers.join(','), // Cabeçalho
    ...mlProducts.map(product => [
      `"${product.title}"`,
      `"${product.description}"`,
      product.price,
      product.quantity,
      `"${product.sku}"`,
      `"${product.barcode || ''}"`,
      `"${product.brand}"`,
      `"${product.model || ''}"`,
      product.weight,
      product.height,
      product.width,
      product.length,
      `"${product.category}"`,
      `"${product.supplier}"`,
      `"${product.images[0] || ''}"`
    ].join(','))
  ];
  
  return csvRows.join('\n');
};

/**
 * Exporta produtos para formato CSV compatível com Shopee
 * @param products Lista de produtos
 * @returns String CSV formatada
 */
export const exportToShopeeCSV = (products: Product[]): string => {
  // Cabeçalhos do CSV da Shopee
  const headers = [
    'name', 'description', 'price', 'stock', 'sku', 'barcode', 
    'brand', 'model', 'weight', 'package_height', 'package_width', 
    'package_length', 'category', 'supplier', 'image_url', 'condition'
  ];
  
  // Converter produtos para o formato da Shopee
  const shopeeProducts = products.map(convertToShopeeFormat);
  
  // Criar linhas do CSV
  const csvRows = [
    headers.join(','), // Cabeçalho
    ...shopeeProducts.map(product => [
      `"${product.name}"`,
      `"${product.description}"`,
      product.price,
      product.stock,
      `"${product.sku}"`,
      `"${product.barcode || ''}"`,
      `"${product.brand}"`,
      `"${product.model || ''}"`,
      product.weight,
      product.package_height,
      product.package_width,
      product.package_length,
      `"${product.category}"`,
      `"${product.supplier}"`,
      `"${product.images[0] || ''}"`,
      `"${product.condition}"`
    ].join(','))
  ];
  
  return csvRows.join('\n');
};

/**
 * Baixa um arquivo CSV
 * @param csvContent Conteúdo CSV
 * @param filename Nome do arquivo
 */
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Exporta produtos selecionados para Mercado Livre
 * @param products Lista de produtos
 */
export const exportProductsToMercadoLivre = (products: Product[]) => {
  const csvContent = exportToMercadoLivreCSV(products);
  downloadCSV(csvContent, `produtos_mercado_livre_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Exporta produtos selecionados para Shopee
 * @param products Lista de produtos
 */
export const exportProductsToShopee = (products: Product[]) => {
  const csvContent = exportToShopeeCSV(products);
  downloadCSV(csvContent, `produtos_shopee_${new Date().toISOString().split('T')[0]}.csv`);
};