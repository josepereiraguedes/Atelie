/**
 * Utility for generating unique IDs
 */

/**
 * Generates a unique ID using a combination of timestamp and random number
 * @returns A unique number ID
 */
export const generateUniqueId = (): number => {
  // Combine timestamp with a random number to reduce collision probability
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  // Use a simple hash function to combine timestamp and random number
  return hash(`${timestamp}-${random}`);
};

/**
 * Simple hash function to convert string to number
 * @param str String to hash
 * @returns Number hash
 */
const hash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Generates a UUID v4 string
 * @returns A UUID v4 string
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default {
  generateUniqueId,
  generateUUID
};