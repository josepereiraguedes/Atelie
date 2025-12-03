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
      
      // Handle numeric fields
      if (field === 'quantity') {
        const quantity = parseInt(value as string) || 0;
        currentItem.quantity = Math.max(0, quantity);
        currentItem.total = currentItem.quantity * currentItem.unit_price;
      } else if (field === 'unit_price') {
        const price = parseFloat(value as string) || 0;
        currentItem.unit_price = Math.max(0, price);
        currentItem.total = currentItem.quantity * currentItem.unit_price;
      } else if (field === 'total') {
        currentItem.total = parseFloat(value as string) || 0;
      } else {
        // Handle other fields
        currentItem[field] = value;
      }
      
      updatedItems[index] = currentItem;
      return updatedItems;
    });
  }, []);

  /**
   * Add a new item to the list
   */
  const addItem = useCallback((newItem: T) => {
    setItems(prevItems => [...prevItems, newItem]);
  }, []);

  /**
   * Remove an item from the list
   */
  const removeItem = useCallback((index: number) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
  }, []);

  /**
   * Calculate the total of all items
   */
  const calculateTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  /**
   * Update item product and automatically set unit price from product data
   */
  const updateItemProduct = useCallback((
    index: number, 
    productId: number, 
    productCost?: number
  ) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const currentItem = { ...updatedItems[index] } as T;
      
      currentItem.product_id = productId;
      
      // If product cost is provided, update unit price and recalculate total
      if (productCost !== undefined) {
        currentItem.unit_price = productCost;
        currentItem.total = currentItem.quantity * currentItem.unit_price;
      }
      
      updatedItems[index] = currentItem;
      return updatedItems;
    });
  }, []);

  return {
    items,
    setItems,
    updateItem,
    addItem,
    removeItem,
    calculateTotal,
    updateItemProduct
  };
};

export default useFormItems;