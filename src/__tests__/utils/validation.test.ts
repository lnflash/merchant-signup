import {
  isBrowser,
  isFileInstance,
  formatPhoneNumber,
  safeString,
  safeGet,
  isNonEmptyString,
  getErrorMessage,
} from '../../utils/validation';

describe('Validation utilities', () => {
  describe('isBrowser', () => {
    it('should be true when window is defined', () => {
      // In Jest's JSDOM environment, window is defined
      expect(isBrowser).toBe(true);
    });
  });

  describe('isFileInstance', () => {
    it('should return false for non-File values', () => {
      expect(isFileInstance(null)).toBe(false);
      expect(isFileInstance(undefined)).toBe(false);
      expect(isFileInstance('string')).toBe(false);
      expect(isFileInstance(123)).toBe(false);
      expect(isFileInstance({})).toBe(false);
    });

    it('should return true for File objects in browser', () => {
      // Create a mock File object
      const file = new File(['content'], 'filename.txt');
      expect(isFileInstance(file)).toBe(true);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format US phone numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should handle international numbers', () => {
      expect(formatPhoneNumber('+11234567890')).toBe('+1 (123) 456-7890');
      expect(formatPhoneNumber('441234567890')).toBe('+44 (123) 456-7890');
    });

    it('should return original value for invalid lengths', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('12345')).toBe('12345');
    });
  });

  describe('safeString', () => {
    it('should convert values to strings', () => {
      expect(safeString('test')).toBe('test');
      expect(safeString(123)).toBe('123');
      expect(safeString(true)).toBe('true');
    });

    it('should handle nullish values', () => {
      expect(safeString(null)).toBe('');
      expect(safeString(undefined)).toBe('');
    });
  });

  describe('safeGet', () => {
    it('should safely access object properties', () => {
      const obj = { a: 1, b: { c: 2 } };
      expect(safeGet(obj, 'a')).toBe(1);
      expect(safeGet(obj, 'b')).toEqual({ c: 2 });
    });

    it('should return undefined for nullish objects', () => {
      expect(safeGet(null as any, 'a')).toBeUndefined();
      expect(safeGet(undefined as any, 'a')).toBeUndefined();
    });
  });

  describe('isNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true);
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from different error types', () => {
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(new Error('error object'))).toBe('error object');
      expect(getErrorMessage({ message: 'object with message' })).toBe('object with message');
      expect(getErrorMessage({})).toBe('An unknown error occurred');
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });
  });
});
