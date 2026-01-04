import { useCallback } from 'react';
import { generateUniqueId } from '@/shared/utils/idGenerator';

/**
 * Custom hook for optimized database operations
 * Provides utilities for common database operations with better performance
 */
export const useDatabaseOperations = () => {
  /**
   * Creates a new entity with a unique ID and timestamps
   * @param entity Partial entity data
   * @returns Entity with ID and timestamps
   */
  const createEntity = useCallback(<T extends Record<string, any>>(
    entity: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): T & { id: number; created_at: string; updated_at: string } => {
    return {
      ...entity,
      id: generateUniqueId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as T & { id: number; created_at: string; updated_at: string };
  }, []);

  /**
   * Updates an entity with new data and updated timestamp
   * @param entity Original entity
   * @param updates Partial updates to apply
   * @returns Updated entity
   */
  const updateEntity = useCallback(<T extends Record<string, any>>(entity: T, updates: Partial<T>): T => {
    return {
      ...entity,
      ...updates,
      updated_at: new Date().toISOString()
    } as T;
  }, []);

  /**
   * Finds an entity by ID in an array
   * @param entities Array of entities
   * @param id Entity ID to find
   * @returns Entity if found, undefined otherwise
   */
  const findById = useCallback(<T extends { id: number }>(entities: T[], id: number): T | undefined => {
    return entities.find(entity => entity.id === id);
  }, []);

  /**
   * Updates an entity in an array by ID
   * @param entities Array of entities
   * @param id Entity ID to update
   * @param updates Partial updates to apply
   * @returns New array with updated entity
   */
  const updateById = useCallback(<T extends { id?: number }>(
    entities: T[],
    id: number,
    updates: Partial<T>
  ): T[] => {
    return entities.map(entity =>
      entity.id === id
        ? { ...entity, ...updates, updated_at: new Date().toISOString() }
        : entity
    );
  }, []);

  /**
   * Removes an entity from an array by ID
   * @param entities Array of entities
   * @param id Entity ID to remove
   * @returns New array without the removed entity
   */
  const removeById = useCallback(<T extends { id?: number }>(entities: T[], id: number): T[] => {
    return entities.filter(entity => entity.id !== id);
  }, []);

  /**
   * Calculates stock changes based on transaction type
   * @param products Array of products
   * @param transaction Transaction data
   * @returns Updated products array with stock changes
   */
  const calculateStockChanges = useCallback((
    products: any[],
    transaction: any
  ): any[] => {
    return products.map(product => {
      // Verificar se este produto está na transação
      const isProductInTransaction = transaction.items?.some((item: any) => item.product_id === product.id) ||
        transaction.product_id === product.id;

      if (isProductInTransaction) {
        // Calcular a quantidade
        let quantityChange = 0;
        if (transaction.items && transaction.items.length > 0) {
          // Transação com múltiplos itens
          const item = transaction.items.find((item: any) => item.product_id === product.id);
          if (item) {
            quantityChange = item.quantity;
          }
        } else if (transaction.product_id === product.id && transaction.quantity !== undefined) {
          // Transação com item único
          quantityChange = transaction.quantity;
        }

        // Aplicar mudança de estoque baseada no tipo de transação
        let newQuantity = product.quantity;
        if (transaction.type === 'sale') {
          // Para vendas, reduzir o estoque
          newQuantity = Math.max(0, product.quantity - quantityChange);
        } else if (transaction.type === 'purchase' || transaction.type === 'adjustment') {
          // Para compras e ajustes, aumentar o estoque
          newQuantity = product.quantity + quantityChange;
        }

        return {
          ...product,
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        };
      }
      return product;
    });
  }, []);

  return {
    createEntity,
    updateEntity,
    findById,
    updateById,
    removeById,
    calculateStockChanges
  };
};

export default useDatabaseOperations;
