import { apiService } from '../../services/api';
import { SignupFormData } from '../../types';

// Mock the createClient function from @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => {
  // Database mock to store inserted data for verification
  const mockDb = {
    data: null,
    error: null,
    reset() {
      this.data = null;
      this.error = null;
    },
    setResponse(data: any, error: any = null) {
      this.data = data;
      this.error = error;
    },
  };

  // Mock implementation of createClient
  return {
    createClient: jest.fn(() => ({
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => {
            return {
              data: mockDb.data,
              error: mockDb.error,
            };
          }),
        })),
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => ({
            data: { path: 'test-path' },
            error: null,
          })),
        })),
      },
    })),
    mockDb, // Expose the mock database for test verification
  };
});

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    api: {
      request: jest.fn(),
      response: jest.fn(),
    },
  },
}));

// Mock window.ENV for static build detection
Object.defineProperty(window, 'ENV', {
  value: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    BUILD_TIME: '2023-01-01',
  },
  writable: true,
});

describe('API Service - Coordinate Handling', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Reset mock database
    const { mockDb } = require('@supabase/supabase-js');
    mockDb.reset();

    // Set up successful response
    mockDb.setResponse([{ id: 'test-id', created_at: new Date().toISOString() }]);

    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('should include numeric latitude and longitude in Supabase submission', async () => {
    // Test data with numeric coordinates
    const formData: SignupFormData = {
      name: 'Test User',
      phone: '+18765551234',
      email: 'test@example.com',
      account_type: 'business',
      business_name: 'Test Business',
      business_address: '123 Test St',
      latitude: 18.0179,
      longitude: -76.8099,
      terms_accepted: true as unknown as true,
    };

    // Call the API service
    const result = await apiService.submitFormWithSupabaseDirect(formData);

    // Check the result
    expect(result.success).toBe(true);

    // Check that the console.log was called with coordinate information
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('FINAL COORDINATES BEING SENT TO SUPABASE'),
      expect.objectContaining({
        hasLatitude: true,
        latitude: 18.0179,
        hasLongitude: true,
        longitude: -76.8099,
      })
    );
  });

  test('should handle string latitude and longitude values', async () => {
    // Test data with string coordinates
    const formData: SignupFormData = {
      name: 'Test User',
      phone: '+18765551234',
      email: 'test@example.com',
      account_type: 'business',
      business_name: 'Test Business',
      business_address: '123 Test St',
      latitude: '18.0179' as unknown as number, // Cast to expected type but use string
      longitude: '-76.8099' as unknown as number, // Cast to expected type but use string
      terms_accepted: true as unknown as true,
    };

    // Call the API service
    const result = await apiService.submitFormWithSupabaseDirect(formData);

    // Check the result
    expect(result.success).toBe(true);

    // Check that the console.log was called with coordinate information that shows parsing
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('PREPARING SCHEMA DATA - COORDINATES'),
      expect.objectContaining({
        latIsString: true,
        lngIsString: true,
      })
    );

    // Check that the string values were properly parsed to numbers
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('FINAL COORDINATES BEING SENT TO SUPABASE'),
      expect.objectContaining({
        hasLatitude: true,
        latitude: 18.0179, // Should be parsed to number
        hasLongitude: true,
        longitude: -76.8099, // Should be parsed to number
      })
    );
  });

  test('should handle undefined latitude and longitude values', async () => {
    // Test data with undefined coordinates
    const formData: SignupFormData = {
      name: 'Test User',
      phone: '+18765551234',
      email: 'test@example.com',
      account_type: 'business',
      business_name: 'Test Business',
      business_address: '123 Test St',
      // latitude and longitude are undefined
      terms_accepted: true as unknown as true,
    };

    // Call the API service
    const result = await apiService.submitFormWithSupabaseDirect(formData);

    // Check the result
    expect(result.success).toBe(true);

    // Check that the console.log was called showing the coordinates are undefined
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('PREPARING SCHEMA DATA - COORDINATES'),
      expect.objectContaining({
        latIsUndefined: true,
        lngIsUndefined: true,
      })
    );

    // Check that the final data sent doesn't have coordinates
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('FINAL COORDINATES BEING SENT TO SUPABASE'),
      expect.objectContaining({
        hasLatitude: false,
        hasLongitude: false,
      })
    );
  });
});
