import { NextRequest } from 'next/server';
import { POST } from '../../../app/api/submit/route';

// Mock signupFormSchema
jest.mock('../../../lib/validators', () => ({
  signupFormSchema: {
    parse: jest.fn(data => data),
  },
}));

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('Submit API', () => {
  const mockFormData = {
    name: 'Test User',
    phone: '+12345678901',
    email: 'test@example.com',
    account_type: 'personal',
    terms_accepted: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process form submission', async () => {
    const request = new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockFormData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Signup successful',
      })
    );

    // Check that supabase.from was called correctly
    expect(require('../../../lib/supabase').supabase.from).toHaveBeenCalledWith('signups');

    // Check that insert was called with sanitized data
    const insertMock = require('../../../lib/supabase').supabase.from().insert;
    expect(insertMock).toHaveBeenCalledWith([expect.objectContaining(mockFormData)]);
  });

  it('should return build-time response when IS_BUILD_TIME is true', async () => {
    const originalEnv = process.env.IS_BUILD_TIME;
    process.env.IS_BUILD_TIME = 'true';

    const request = new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockFormData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data).toEqual({
      success: true,
      message: 'Build-time placeholder response',
    });

    process.env.IS_BUILD_TIME = originalEnv;
  });

  it('should handle validation errors', async () => {
    // Mock validation error
    require('../../../lib/validators').signupFormSchema.parse.mockImplementationOnce(() => {
      throw { errors: ['Name is required'] };
    });

    const request = new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...mockFormData, name: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual(
      expect.objectContaining({
        success: false,
        error: ['Name is required'],
      })
    );
  });

  it('should handle database errors', async () => {
    // Mock database error
    require('../../../lib/supabase').supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });

    const request = new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockFormData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Database error'),
      })
    );
  });

  it('should handle unexpected errors', async () => {
    // Mock JSON parsing error
    const originalJsonMethod = Request.prototype.json;
    Request.prototype.json = jest.fn().mockRejectedValueOnce(new Error('Invalid JSON'));

    const request = new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{ invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Unexpected error'),
      })
    );

    // Restore original method
    Request.prototype.json = originalJsonMethod;
  });
});
