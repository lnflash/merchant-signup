import { config } from '../config';
import { ApiResponse } from '../types';
import { getErrorMessage } from '../utils/validation';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_COUNT = 1;

/**
 * Enhanced fetch with timeout, retries, and error handling
 */
async function enhancedFetch<T>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
    retry = DEFAULT_RETRY_COUNT,
  } = options;

  // Add default headers
  const fetchHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Create fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  };

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    // Attempt the fetch
    const response = await attemptFetch<T>(url, fetchOptions, retry);
    return response;
  } catch (error) {
    // Handle errors
    return {
      success: false,
      error: getErrorMessage(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper function to attempt a fetch with retries
 */
async function attemptFetch<T>(
  url: string,
  options: RequestInit,
  retriesLeft: number
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    if (retriesLeft > 0 && !(error instanceof DOMException && error.name === 'AbortError')) {
      // Wait before retry (simple exponential backoff)
      const delay = 2000 * (DEFAULT_RETRY_COUNT - retriesLeft + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return attemptFetch<T>(url, options, retriesLeft - 1);
    }
    throw error;
  }
}

/**
 * API client for making requests to the backend
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || config.api.baseUrl || '';
    const url = `${baseUrl}${endpoint}`;
    return enhancedFetch<T>(url, { ...options, method: 'GET' });
  },

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    data: any,
    options: Omit<FetchOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || config.api.baseUrl || '';
    const url = `${baseUrl}${endpoint}`;
    return enhancedFetch<T>(url, { ...options, method: 'POST', body: data });
  },

  /**
   * Check health status of the API
   */
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/api/health');
  },

  /**
   * Submit merchant signup form data
   */
  async submitSignupForm<T>(data: any): Promise<ApiResponse<T>> {
    return this.post<T>('/api/submit', data);
  },
};
