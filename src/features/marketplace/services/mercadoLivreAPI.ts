import { Product } from '@/core/contexts/LocalDatabaseContext';
import { MercadoLivreOAuth } from './mercadoLivreOAuth';

interface MercadoLivreItem {
  id?: string;
  title: string;
  description: {
    plain_text: string;
  };
  category_id: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  buying_mode: string;
  listing_type_id: string;
  condition: string;
  pictures: Array<{
    source: string;
  }>;
  attributes: Array<{
    id: string;
    name: string;
    value_name: string;
  }>;
  shipping: {
    mode: string;
    free_shipping: boolean;
    local_pick_up: boolean;
  };
}

interface CategorySearchResult {
  id: string;
  name: string;
  path_from_root: Array<{
    id: string;
    name: string;
  }>;
}

export class MercadoLivreAPI {
  private oauth: MercadoLivreOAuth;

  constructor() {
    this.oauth = new MercadoLivreOAuth();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.oauth.isAuthenticated();
  }

  /**
   * Obtém informações da conta do usuário
   */
  async getAccountInfo(): Promise<any> {
    return this.oauth.getAccountInfo();
  }

  /**
   * Pesquisa categorias no Mercado Livre
   */
  async searchCategory(query: string): Promise<CategorySearchResult[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const result = await this.oauth.makeAuthenticatedRequest(`/sites/MLB/search?category=MLB${query}`);
      return result?.available_filters?.find((filter: any) => filter.id === 'category')?.values || [];
    } catch (error) {
      console.error('Erro ao pesquisar categorias:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma categoria específica
   */
  async getCategoryDetails(categoryId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      return await this.oauth.makeAuthenticatedRequest(`/categories/${categoryId}`);
    } catch (error) {
      console.error('Erro ao obter detalhes da categoria:', error);
      throw error;
    }
  }

  /**
   * Converte um produto do sistema para o formato do Mercado Livre
   */
  private convertToMercadoLivreFormat(product: Product): MercadoLivreItem {
    // Determinar categoria apropriada com base na categoria do produto
    let categoryId = 'MLB1743'; // Categoria padrão - pode ser ajustada com base na categoria do produto
    if (product.category) {
      // Aqui poderia haver uma lógica mais sofisticada para mapear categorias
      if (product.category.toLowerCase().includes('eletrônico') || product.category.toLowerCase().includes('eletronico')) {
        categoryId = 'MLB1051'; // Eletrônicos
      } else if (product.category.toLowerCase().includes('roupa') || product.category.toLowerCase().includes('vestuário')) {
        categoryId = 'MLB1430'; // Roupas e Acessórios
      } else if (product.category.toLowerCase().includes('casa') || product.category.toLowerCase().includes('móvel')) {
        categoryId = 'MLB1367'; // Casa, Móveis e Decoração
      }
      // Adicionar mais mapeamentos conforme necessário
    }

    // Preparar imagens
    const pictures = [];
    if (product.image) {
      pictures.push({ source: product.image });
    }
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (typeof img === 'string' && img !== product.image) {
          pictures.push({ source: img });
        }
      });
    }

    // Preparar atributos
    const attributes = [];
    
    // Adicionar marca se existir
    if (product.brand) {
      attributes.push({
        id: 'BRAND',
        name: 'Marca',
        value_name: product.brand
      });
    }
    
    // Adicionar modelo se existir
    if (product.model) {
      attributes.push({
        id: 'MODEL',
        name: 'Modelo',
        value_name: product.model
      });
    }
    
    // Adicionar peso se existir
    if (product.weight) {
      attributes.push({
        id: 'WEIGHT',
        name: 'Peso',
        value_name: `${product.weight} kg`
      });
    }
    
    // Adicionar dimensões se existirem
    if (product.height || product.width || product.length) {
      const dimensions = [
        product.height ? `${product.height} cm` : null,
        product.width ? `${product.width} cm` : null,
        product.length ? `${product.length} cm` : null
      ].filter(Boolean).join(' x ');
      
      attributes.push({
        id: 'PACKAGING_DIMENSIONS',
        name: 'Dimensões da embalagem',
        value_name: dimensions
      });
    }

    // Adicionar especificações técnicas
    if (product.technical_specs && Array.isArray(product.technical_specs)) {
      product.technical_specs.forEach(spec => {
        attributes.push({
          id: spec.name.toUpperCase().replace(/\s+/g, '_'),
          name: spec.name,
          value_name: spec.value
        });
      });
    }

    return {
      title: product.name.substring(0, 60), // Título limitado a 60 caracteres
      description: {
        plain_text: product.description || `Produto ${product.name} de qualidade`
      },
      category_id: categoryId,
      price: product.sale_price,
      currency_id: 'BRL',
      available_quantity: product.quantity || 0,
      buying_mode: 'buy_it_now', // Modo de compra imediata
      listing_type_id: 'gold_pro', // Tipo de anúncio padrão
      condition: 'new', // Condição do produto (novo)
      pictures: pictures,
      attributes: attributes,
      shipping: {
        mode: 'me2', // Mercado Envios
        free_shipping: false, // Pode ser ajustado com base em regras de negócio
        local_pick_up: false // Retirada local desativada por padrão
      }
    };
  }

  /**
   * Cria um novo item (produto) no Mercado Livre
   */
  async createItem(product: Product): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const mercadoLivreItem = this.convertToMercadoLivreFormat(product);
      return await this.oauth.makeAuthenticatedRequest('/items', {
        method: 'POST',
        body: JSON.stringify(mercadoLivreItem)
      });
    } catch (error) {
      console.error('Erro ao criar item no Mercado Livre:', error);
      throw error;
    }
  }

  /**
   * Atualiza um item existente no Mercado Livre
   */
  async updateItem(mlItemId: string, product: Product): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const mercadoLivreItem = this.convertToMercadoLivreFormat(product);
      return await this.oauth.makeAuthenticatedRequest(`/items/${mlItemId}`, {
        method: 'PUT',
        body: JSON.stringify(mercadoLivreItem)
      });
    } catch (error) {
      console.error('Erro ao atualizar item no Mercado Livre:', error);
      throw error;
    }
  }

  /**
   * Atualiza apenas o estoque de um item no Mercado Livre
   */
  async updateItemStock(mlItemId: string, quantity: number): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const stockUpdate = {
        available_quantity: quantity
      };

      return await this.oauth.makeAuthenticatedRequest(`/items/${mlItemId}`, {
        method: 'PUT',
        body: JSON.stringify(stockUpdate)
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque no Mercado Livre:', error);
      throw error;
    }
  }

  /**
   * Atualiza apenas o preço de um item no Mercado Livre
   */
  async updateItemPrice(mlItemId: string, price: number): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const priceUpdate = {
        price: price
      };

      return await this.oauth.makeAuthenticatedRequest(`/items/${mlItemId}`, {
        method: 'PUT',
        body: JSON.stringify(priceUpdate)
      });
    } catch (error) {
      console.error('Erro ao atualizar preço no Mercado Livre:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um item específico no Mercado Livre
   */
  async getItem(mlItemId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      return await this.oauth.makeAuthenticatedRequest(`/items/${mlItemId}`);
    } catch (error) {
      console.error('Erro ao obter item do Mercado Livre:', error);
      throw error;
    }
  }

  /**
   * Obtém lista de itens do usuário no Mercado Livre
   */
  async getUserItems(status?: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const params = status ? `?status=${status}` : '';
      return await this.oauth.makeAuthenticatedRequest(`/users/me/items${params}`);
    } catch (error) {
      console.error('Erro ao obter itens do usuário no Mercado Livre:', error);
      throw error;
    }
  }

  /**
   * Publica múltiplos produtos no Mercado Livre
   */
  async publishProducts(products: Product[]): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const product of products) {
      try {
        await this.createItem(product);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Produto ${product.name}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Sincroniza estoque entre o sistema local e o Mercado Livre
   */
  async syncStock(localProducts: Product[]): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Obter lista de itens do Mercado Livre
    const mlItems = await this.getUserItems();

    for (const localProduct of localProducts) {
      try {
        // Procurar item correspondente no Mercado Livre
        // Aqui precisamos de uma forma de mapear o produto local com o item no ML
        // Por enquanto, vamos usar o SKU ou nome como referência
        const mlItem = mlItems.results?.find((item: any) => 
          item.seller_custom_field === localProduct.sku || 
          item.title.includes(localProduct.name.substring(0, 20)) // Comparação parcial do título
        );

        if (mlItem) {
          // Atualizar estoque
          await this.updateItemStock(mlItem.id, localProduct.quantity || 0);
          results.success++;
        } else {
          // Item não encontrado, pode ser necessário criar
          console.log(`Item não encontrado no Mercado Livre: ${localProduct.name}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Produto ${localProduct.name}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Obtém estatísticas de vendas do Mercado Livre
   */
  async getSalesStats(): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Obter pedidos do Mercado Livre
      const orders = await this.oauth.makeAuthenticatedRequest('/orders/search');
      return orders;
    } catch (error) {
      console.error('Erro ao obter estatísticas de vendas:', error);
      throw error;
    }
  }

  /**
   * Desconecta a conta do Mercado Livre
   */
  logout(): void {
    this.oauth.logout();
  }
}