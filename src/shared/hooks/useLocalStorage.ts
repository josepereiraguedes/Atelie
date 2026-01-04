import { useState, useEffect } from 'react';

/**
 * Custom hook for managing state that is persisted in localStorage
 * @param key - The localStorage key to use
 * @param initialValue - The initial value to use if no value is found in localStorage
 * @returns A tuple containing the current value and a function to update it
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get value from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      
      // Try to parse as JSON, if it fails, return the raw string value
      try {
        return JSON.parse(item);
      } catch {
        // If JSON.parse fails, return the raw string value
        // This handles cases where the value is a simple string like "light" or "dark"
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      // Removido log de depuração para produção
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;