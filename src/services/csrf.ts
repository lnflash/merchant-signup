import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * CSRF protection client service
 * Fetches and provides CSRF tokens for form submissions
 */

// Type for CSRF token response
interface CSRFTokenResponse {
  success: boolean;
  data?: {
    token: string;
    expires: number;
  };
  error?: string;
}

/**
 * CSRF service
 */
export const csrfService = {
  /**
   * Current CSRF token
   */
  token: null as string | null,

  /**
   * Token expiration timestamp
   */
  expires: 0,

  /**
   * Fetch a new CSRF token from the server
   */
  async getToken(): Promise<string> {
    try {
      // Check if we already have a valid token
      if (this.token && this.expires > Date.now()) {
        return this.token;
      }

      // Fetch a new token
      const response = await fetch(`${config.api.baseUrl || ''}/api/csrf`, {
        method: 'GET',
        credentials: 'include', // Important to include cookies
      });

      const data: CSRFTokenResponse = await response.json();

      if (!data.success || !data.data?.token) {
        throw new Error(data.error || 'Failed to get CSRF token');
      }

      // Store the token and expiration
      this.token = data.data.token;
      this.expires = data.data.expires;

      return this.token;
    } catch (error) {
      logger.error('Error fetching CSRF token', error);
      // Fall back to a generated local token in case of error
      // Not ideal for security but prevents complete failure
      return this.generateFallbackToken();
    }
  },

  /**
   * Generate a fallback token
   * Less secure but prevents complete failure
   */
  generateFallbackToken(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    // Set a short expiration time for fallback tokens
    this.token = token;
    this.expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    logger.warn('Using fallback CSRF token');
    return token;
  },

  /**
   * Include CSRF token in form data
   */
  async includeToken<T extends Record<string, any>>(
    formData: T
  ): Promise<T & { csrf_token: string }> {
    const token = await this.getToken();
    return {
      ...formData,
      csrf_token: token,
    };
  },
};
