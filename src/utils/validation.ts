/**
 * Utility functions for form validation
 */

/**
 * Checks if running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Safely checks if a value is a File instance
 * Works in both browser and server environments
 */
export const isFileInstance = (value: unknown): boolean => {
  return isBrowser && value instanceof File;
};

/**
 * Formats a phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid length
  if (cleaned.length < 10) return phone;

  // Format for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format for international numbers
  return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
};

/**
 * Safe string accessor that handles nullish values
 */
export const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Safely accesses nested object properties
 */
export function safeGet<T, K extends keyof T>(obj: T | undefined | null, key: K): T[K] | undefined {
  return obj ? obj[key] : undefined;
}

/**
 * Type guard to check if a value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim() !== '';
};

/**
 * Type-safe way to access error messages from unknown error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'An unknown error occurred';
};
