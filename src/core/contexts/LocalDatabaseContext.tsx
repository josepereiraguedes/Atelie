import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import useLocalStorage from '@/shared/hooks/useLocalStorage';

import { useDatabaseOperations } from '@/shared/hooks/useDatabaseOperations';
import { apiService } from '@/shared/services/api';
import { pricingService } from '@/features/marketplace/services/pricingService';
import { transactionService } from '@/features/financial/services/transactionService';
import { orderService } from '@/features/pos/services/orderService';
import toast from 'react-hot-toast';

// Imports de tipos
import { 
  Product, 
  Category, 
  MarketplacePricingConfig, 
  CustomCost,
  Client,
  Supplier,
  Transaction,
  TransactionItem,
  FinancialSummary,
  FixedCost,
  MonthlyGoal,
  ClientQuote,
  ClientQuoteItem,
  PurchaseQuote,
  PurchaseQuoteItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem
} from '@/shared/types/database.types';

// Re-exportar tipos para manter compatibilidade com imports existentes em outros arquivos
export type {
  Product,
  Category,
  MarketplacePricingConfig,
  CustomCost,
  Client,
  Supplier,
  Transaction,
  TransactionItem,
  FinancialSummary,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  MonthlyGoal
};

// Tipo do contexto
interface LocalDatabaseContextType {
  // Estados
  products: Product[];
  categories: Category[];
  clients: Client[];
  suppliers: Supplier[];
  transactions: Transaction[];
  fixedCosts: FixedCost[];
  clientQuotes: ClientQuote[];
  purchaseQuotes: PurchaseQuote[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  monthlyGoals: MonthlyGoal[];
  isLoading: boolean;

  // Propriedades calculadas
  lowStockAlerts: Product[];
  subcategories: Record<string, string[]>;
  marketplaceConfigs: MarketplacePricingConfig[];

  // Funções para produtos
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  bulkUpdateProducts: (ids: number[], data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;

  // Funções para categorias
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => void;
  updateCategory: (id: number, category: Partial<Category>) => void;
  deleteCategory: (id: number) => void;

  // Funções para subcategorias
  addSubcategory: (category: string, subcategory: string) => void;
  updateSubcategory: (category: string, oldSubcategory: string, newSubcategory: string) => void;
  deleteSubcategory: (category: string, subcategory: string) => void;

  // Funções para clientes
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;

  // Funções para fornecedores
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => void;
  updateSupplier: (id: number, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;

  // Funções para transações
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => void;
  updateTransactionStatus: (id: number, status: 'paid' | 'pending') => void;
  deleteTransaction: (id: number) => void;

  // Funções para custos fixos
  addFixedCost: (fixedCost: Omit<FixedCost, 'id' | 'created_at'>) => void;
  updateFixedCost: (id: number, fixedCost: Partial<FixedCost>) => void;
  deleteFixedCost: (id: number) => void;

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
  getFinancialSummary: () => FinancialSummary;

  // Funções para Metas
  addMonthlyGoal: (goal: Omit<MonthlyGoal, 'id' | 'created_at'>) => void;
  updateMonthlyGoal: (id: number, goal: Partial<MonthlyGoal>) => void;

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
  // Estados para os diferentes tipos de dados
  const [products, setProducts] = useState<Product[]>([]); // Removido useLocalStorage para evitar conflitos
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
  const [subcategories, setSubcategories] = useLocalStorage<Record<string, string[]>>('subcategories', {});
  const [clients, setClients] = useState<Client[]>([]); // Removido useLocalStorage
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [fixedCosts, setFixedCosts] = useLocalStorage<FixedCost[]>('fixedCosts', []);
  const [clientQuotes, setClientQuotes] = useLocalStorage<ClientQuote[]>('clientQuotes', []);
  const [purchaseQuotes, setPurchaseQuotes] = useLocalStorage<PurchaseQuote[]>('purchaseQuotes', []);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', []);
  const [goodsReceipts, setGoodsReceipts] = useLocalStorage<GoodsReceipt[]>('goodsReceipts', []);
  const [monthlyGoals, setMonthlyGoals] = useLocalStorage<MonthlyGoal[]>('monthly_goals', []);

  // Estado para conexão com API
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais da API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const online = await apiService.checkConnection();
        setIsOnline(online);

        if (online) {
          try {
            const [apiProducts, apiClients, apiTransactions, apiSuppliers, apiCategories] = await Promise.all([
              apiService.getProducts(),
              apiService.getClients(),
              apiService.getTransactions(),
              apiService.getSuppliers(),
              apiService.getCategories()
            ]);

            // Atualizar estado com dados do servidor
            setProducts(apiProducts);
            setClients(apiClients);
            setTransactions(apiTransactions);
            setSuppliers(apiSuppliers);
            setCategories(apiCategories);
            console.log('✅ Dados sincronizados com o Banco de Dados Local');
          } catch (err) {
            console.error('Erro ao carregar dados do servidor:', err);
            toast.error('Erro ao sincronizar dados com o servidor.');
          }
        } else {
          console.log('⚠️ Modo Offline: Usando dados locais.');
        }
      } catch (e) {
        console.log('⚠️ Backend não detectado.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Configurações de marketplaces
  const [marketplaceConfigs, setMarketplaceConfigs] = useLocalStorage<MarketplacePricingConfig[]>('marketplaceConfigs', pricingService.defaultMarketplaceConfigs);

  // Hook para operações de banco de dados otimizadas
  const { createEntity, updateById, removeById, calculateStockChanges } = useDatabaseOperations();

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

    return pricingService.calculateMarketplacePrice(product, marketplaceConfig, desiredProfitMargin);
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
    return pricingService.calculateAllMarketplacePrices(product, marketplaceConfigs, desiredProfitMargin);
  }, [marketplaceConfigs]);

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
    return products.filter(product =>
      product.min_stock !== undefined &&
      product.quantity <= product.min_stock
    );
  }, [products]);

  // Funções para produtos
  // Funções para produtos (Conectadas ao MySQL via API)
  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Tenta salvar no backend primeiro
      const newProduct = await apiService.createProduct(product);
      setProducts(prev => [...prev, newProduct]);
      toast.success('Produto salvo no Banco de Dados!');
    } catch (e) {
      console.error('Erro ao salvar produto:', e);
      // Fallback: Salvar localmente com ID temporário negativo se estiver offline? 
      // Por segurança, vamos apenas alertar e não salvar localmente para evitar conflitos de ID depois,
      // mas mantendo a logica original se falhar a API seria ideal ter uma fila de sync.
      // Como é "Recomendação Imediata", vamos apenas dar erro.
      toast.error('Erro ao salvar no servidor. Verifique a conexão.');
      throw e;
    }
  };

  const updateProduct = async (id: number, product: Partial<Product>) => {
    try {
      await apiService.updateProduct(id, product);
      setProducts(prev => updateById(prev, id, product));
      toast.success('Produto atualizado!');
    } catch (e) {
      toast.error('Erro ao atualizar no servidor.');
      console.error(e);
    }
  };

  const bulkUpdateProducts = async (ids: number[], data: Partial<Product>) => {
    try {
      // Como o backend atualmente não tem um endpoint de bulk, fazemos um de cada vez, 
      // mas podemos otimizar a atualização do estado local para ser feita uma única vez após todas as promessas.
      const loadingToast = toast.loading(`Atualizando ${ids.length} produtos...`);

      const updatePromises = ids.map(id => apiService.updateProduct(id, data));
      await Promise.all(updatePromises);

      setProducts(prev => {
        let nextProducts = [...prev];
        ids.forEach(id => {
          nextProducts = updateById(nextProducts, id, data);
        });
        return nextProducts;
      });

      toast.dismiss(loadingToast);
      toast.success(`${ids.length} produtos atualizados com sucesso!`);
    } catch (e) {
      toast.error('Erro ao atualizar produtos em massa.');
      console.error(e);
      throw e;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await apiService.deleteProduct(id);
      setProducts(prev => removeById(prev, id));
      toast.success('Produto excluído!');
    } catch (e) {
      toast.error('Erro ao excluir no servidor.');
      console.error(e);
    }
  };

  // Funções para categorias
  const addCategory = (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCategory = createEntity<Category>(category);
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      handleError(error, 'category', true);
    }
  };

  const updateCategory = (id: number, category: Partial<Category>) => {
    try {
      setCategories(prev => updateById(prev, id, category));

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
    } catch (error) {
      handleError(error, 'category', true);
    }
  };

  const deleteCategory = (id: number) => {
    try {
      const categoryToDelete = categories.find(c => c.id === id);
      if (categoryToDelete) {
        setCategories(prev => removeById(prev, id));

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
    } catch (error) {
      handleError(error, 'category', true);
    }
  };

  // Funções para subcategorias
  const addSubcategory = (category: string, subcategory: string) => {
    try {
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
    } catch (error) {
      handleError(error, 'subcategory', true);
    }
  };

  const updateSubcategory = (category: string, oldSubcategory: string, newSubcategory: string) => {
    try {
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
    } catch (error) {
      handleError(error, 'subcategory', true);
    }
  };

  const deleteSubcategory = (category: string, subcategory: string) => {
    try {
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
    } catch (error) {
      handleError(error, 'subcategory', true);
    }
  };

  // Funções para clientes
  // Funções para clientes (Conectadas ao MySQL via API)
  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await apiService.createClient(client);
      setClients(prev => [...prev, newClient]);
      toast.success('Cliente cadastrado!');
    } catch (e) {
      toast.error('Erro ao cadastrar cliente.');
      console.error(e);
    }
  };

  const updateClient = async (id: number, client: Partial<Client>) => {
    try {
      await apiService.updateClient(id, client);
      setClients(prev => updateById(prev, id, client));
      toast.success('Cliente atualizado!');
    } catch (e) {
      toast.error('Erro ao atualizar cliente.');
      console.error(e);
    }
  };

  const deleteClient = async (id: number) => {
    try {
      await apiService.deleteClient(id);
      setClients(prev => removeById(prev, id));
      toast.success('Cliente removido!');
    } catch (e) {
      toast.error('Erro ao remover cliente.');
      console.error(e);
    }
  };

  // Funções para fornecedores
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSupplier = createEntity<Supplier>(supplier);
      setSuppliers(prev => [...prev, newSupplier]);
    } catch (error) {
      handleError(error, 'supplier', true);
    }
  };

  const updateSupplier = (id: number, supplier: Partial<Supplier>) => {
    try {
      setSuppliers(prev => updateById(prev, id, supplier));
    } catch (error) {
      handleError(error, 'supplier', true);
    }
  };

  const deleteSupplier = (id: number) => {
    try {
      setSuppliers(prev => removeById(prev, id));
    } catch (error) {
      handleError(error, 'supplier', true);
    }
  };

  // Funções para transações
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const transactionData = transactionService.prepareTransactionData(transaction, clients);

      // Lógica de Fidelidade: R$ 10 = 1 ponto
      if (transactionData.type === 'sale') {
        const pointsToEarn = Math.floor((transactionData.total + (transactionData.points_redeemed || 0) * 0.5) / 10);
        transactionData.points_earned = pointsToEarn;

        if (transactionData.client_id) {
          const client = clients.find(c => c.id === transactionData.client_id);
          if (client) {
            const currentPoints = client.loyalty_points || 0;
            const pointsRedeemed = transactionData.points_redeemed || 0;
            const newPointsBalance = currentPoints + pointsToEarn - pointsRedeemed;

            await updateClient(client.id!, {
              loyalty_points: Math.max(0, newPointsBalance)
            });
          }
        }
      }

      const savedTransaction = await apiService.createTransaction(transactionData);

      setTransactions(prev => [...prev, savedTransaction]);
      setProducts(prev => calculateStockChanges(prev, savedTransaction));

      toast.success('Transação registrada!');
      return savedTransaction;
    } catch (e) {
      console.error('Erro ao registrar transação:', e);
      toast.error('Erro ao salvar transação no servidor.');
      throw e;
    }
  };

  const updateTransaction = (id: number, transaction: Partial<Transaction>) => {
    try {
      // Se o client_id foi atualizado, obter as informações do cliente
      let clientInfo = undefined;
      if (transaction.client_id) {
        const client = clients.find(c => c.id === transaction.client_id);
        if (client) {
          clientInfo = { name: client.name };
        }
      }

      setTransactions(prev => updateById(prev, id, {
        ...transaction,
        client: clientInfo || (prev.find(t => t.id === id)?.client)
      }));
    } catch (error) {
      handleError(error, 'transaction', true);
    }
  };

  const updateTransactionStatus = async (id: number, status: 'paid' | 'pending') => {
    try {
      return new Promise<void>((resolve, reject) => {
        try {
          setTransactions(prev => updateById(prev, id, { payment_status: status }));
          // Pequeno atraso para simular operação assíncrona
          setTimeout(() => resolve(), 10);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      handleError(error, 'transaction', true);
      throw error;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = transactions.find(t => t.id === id);

          if (transaction) {
            const reversal = transactionService.getReversalTransaction(transaction);
            if (reversal) {
              setProducts(prev => calculateStockChanges(prev, reversal));
            }
          }

          setTransactions(prev => removeById(prev, id));
          setTimeout(() => resolve(), 10);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      handleError(error, 'transaction', true);
      throw error;
    }
  };

  // Funções para custos fixos
  const addFixedCost = (fixedCost: Omit<FixedCost, 'id' | 'created_at'>) => {
    try {
      const newFixedCost = createEntity<FixedCost>(fixedCost);
      setFixedCosts(prev => [...prev, newFixedCost]);
      toast.success('Custo fixo adicionado!');
    } catch (error) {
      handleError(error, 'fixed-cost', true);
    }
  };

  const updateFixedCost = (id: number, fixedCost: Partial<FixedCost>) => {
    try {
      setFixedCosts(prev => updateById(prev, id, fixedCost));
      toast.success('Custo fixo atualizado!');
    } catch (error) {
      handleError(error, 'fixed-cost', true);
    }
  };

  const deleteFixedCost = (id: number) => {
    try {
      setFixedCosts(prev => removeById(prev, id));
      toast.success('Custo fixo removido!');
    } catch (error) {
      handleError(error, 'fixed-cost', true);
    }
  };

  // Funções para orçamentos de clientes
  const addClientQuote = (quote: Omit<ClientQuote, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newQuote = orderService.prepareClientQuote(quote, clients);
      setClientQuotes(prev => [...prev, newQuote]);
    } catch (error) {
      handleError(error, 'client-quote', true);
    }
  };

  const updateClientQuote = (id: number, quote: Partial<ClientQuote>) => {
    try {
      // Encontrar o cliente se o client_id foi atualizado
      let clientInfo = undefined;
      if (quote.client_id) {
        const client = clients.find(c => c.id === quote.client_id);
        if (client) {
          clientInfo = { id: client.id, name: client.name };
        }
      }

      setClientQuotes(prev => updateById(prev, id, {
        ...quote,
        client: clientInfo || (prev.find(q => q.id === id)?.client)
      }));
    } catch (error) {
      handleError(error, 'client-quote', true);
    }
  };

  const deleteClientQuote = (id: number) => {
    try {
      setClientQuotes(prev => removeById(prev, id));
    } catch (error) {
      handleError(error, 'client-quote', true);
    }
  };

  // Funções para orçamentos de fornecedores
  const addPurchaseQuote = (quote: Omit<PurchaseQuote, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newQuote = createEntity<PurchaseQuote>(quote);
      setPurchaseQuotes(prev => [...prev, newQuote]);
    } catch (error) {
      handleError(error, 'purchase-quote', true);
    }
  };

  const updatePurchaseQuote = (id: number, quote: Partial<PurchaseQuote>) => {
    try {
      setPurchaseQuotes(prev => updateById(prev, id, quote));
    } catch (error) {
      handleError(error, 'purchase-quote', true);
    }
  };

  const deletePurchaseQuote = (id: number) => {
    try {
      setPurchaseQuotes(prev => removeById(prev, id));
    } catch (error) {
      handleError(error, 'purchase-quote', true);
    }
  };

  // Funções para pedidos de compra
  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newOrder = orderService.preparePurchaseOrder(order);
      setPurchaseOrders(prev => [...prev, newOrder]);
    } catch (error) {
      handleError(error, 'purchase-order', true);
    }
  };

  const updatePurchaseOrder = (id: number, order: Partial<PurchaseOrder>) => {
    try {
      setPurchaseOrders(prev => updateById(prev, id, order));
      return Promise.resolve();
    } catch (error) {
      handleError(error, 'purchase-order', true);
      return Promise.reject(error);
    }
  };

  const deletePurchaseOrder = (id: number) => {
    try {
      setPurchaseOrders(prev => removeById(prev, id));
    } catch (error) {
      handleError(error, 'purchase-order', true);
    }
  };

  // Funções para recebimentos
  const addGoodsReceipt = (receipt: Omit<GoodsReceipt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newReceipt = createEntity<GoodsReceipt>(receipt);
      setGoodsReceipts(prev => [...prev, newReceipt]);
      return newReceipt;
    } catch (error) {
      handleError(error, 'goods-receipt', true);
      throw error;
    }
  };

  const updateGoodsReceipt = (id: number, receipt: Partial<GoodsReceipt>) => {
    try {
      setGoodsReceipts(prev => updateById(prev, id, receipt));
    } catch (error) {
      handleError(error, 'goods-receipt', true);
    }
  };

  const deleteGoodsReceipt = (id: number) => {
    try {
      setGoodsReceipts(prev => removeById(prev, id));
    } catch (error) {
      handleError(error, 'goods-receipt', true);
    }
  };

  // Função para obter resumo financeiro
  const getFinancialSummary = useCallback((): FinancialSummary => {
    return transactionService.calculateFinancialSummary(transactions, fixedCosts);
  }, [transactions, fixedCosts]);

  // Funções para Metas Mensais
  const addMonthlyGoal = (goal: Omit<MonthlyGoal, 'id' | 'created_at'>) => {
    try {
      const newGoal: MonthlyGoal = {
        ...goal,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      setMonthlyGoals(prev => [...prev, newGoal]);
    } catch (error) {
      handleError(error, 'monthly-goal', true);
    }
  };

  const updateMonthlyGoal = (id: number, goal: Partial<MonthlyGoal>) => {
    try {
      setMonthlyGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    } catch (error) {
      handleError(error, 'monthly-goal', true);
    }
  };

  // Valor do contexto
  const contextValue = {
    // Estados
    products,
    categories,
    subcategories,
    clients,
    suppliers,
    transactions,
    fixedCosts,
    clientQuotes,
    purchaseQuotes,
    purchaseOrders,
    goodsReceipts,

    // Propriedades calculadas
    lowStockAlerts,
    marketplaceConfigs,

    // Funções para produtos
    addProduct,
    updateProduct,
    bulkUpdateProducts,
    deleteProduct,

    // Funções para categorias
    addCategory,
    updateCategory,
    deleteCategory,

    // Funções para subcategorias
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,

    // Funções para clientes
    addClient,
    updateClient,
    deleteClient,

    // Funções para fornecedores
    addSupplier,
    updateSupplier,
    deleteSupplier,

    // Funções para transações
    addTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
    getFinancialSummary,

    // Funções para custos fixos
    addFixedCost,
    updateFixedCost,
    deleteFixedCost,

    // Funções para orçamentos de clientes
    addClientQuote,
    updateClientQuote,
    deleteClientQuote,

    // Funções para orçamentos de fornecedores
    addPurchaseQuote,
    updatePurchaseQuote,
    deletePurchaseQuote,

    // Funções para pedidos de compra
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,

    // Funções para recebimentos
    addGoodsReceipt,
    updateGoodsReceipt,
    deleteGoodsReceipt,

    // Funções para precificação de marketplaces
    calculateMarketplacePricing,
    calculateAllMarketplacePricing,
    updateMarketplaceConfig,
    addMarketplaceConfig,
    removeMarketplaceConfig,
    monthlyGoals,
    addMonthlyGoal,
    updateMonthlyGoal,
    isLoading,
    isOnline
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
