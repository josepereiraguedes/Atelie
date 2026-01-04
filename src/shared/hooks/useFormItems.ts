import { useState, useCallback } from 'react';

interface FormItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  [key: string]: any; // Allow additional properties
}

/**
 * Custom hook for managing form items with automatic total calculation
 * @returns Form items state and helper functions
 */
const useFormItems = <T extends FormItem>(initialItems: T[] = []) => {
  const [items, setItems] = useState<T[]>(initialItems);

  /**
   * Update an item field and recalculate total
   */
  const updateItem = useCallback((index: number, field: keyof T, value: any) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const currentItem = { ...updatedItems[index] } as T;
      
      // Apenas atualizar o valor no estado sem conversão imediata
      if (field === 'quantity') {
        // Armazenar o valor como string durante a digitação
        currentItem.quantity = value;
      } else if (field === 'unit_price') {
        // Armazenar o valor como string durante a digitação
        currentItem.unit_price = value;
      } else if (field === 'total') {
        // Armazenar o valor como string durante a digitação
        currentItem.total = value;
      } else {
        // Handle other fields
        currentItem[field] = value;
      }
      
      // Recalcular total apenas quando tivermos valores numéricos válidos
      const quantity = typeof currentItem.quantity === 'string' ? parseFloat(currentItem.quantity) || 0 : currentItem.quantity;
      const unit_price = typeof currentItem.unit_price === 'string' ? parseFloat(currentItem.unit_price) || 0 : currentItem.unit_price;
      
      if (!isNaN(quantity) && !isNaN(unit_price)) {
        currentItem.total = quantity * unit_price;
      }
      
      updatedItems[index] = currentItem;
      return updatedItems;
    });
  }, []);

  /**
   * Add a new item to the list
   */
  const addItem = useCallback((newItem: T) => {
    setItems(prev => [...prev, newItem]);
  }, []);

  /**
   * Remove an item from the list
   */
  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);

  /**
   * Clear all items
   */
  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    updateItem,
    addItem,
    removeItem,
    clearItems
  };
};

export default useFormItems;