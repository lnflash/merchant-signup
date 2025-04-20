import { config } from '../config';
import { ApiResponse, SignupFormData } from '../types';
import { logger } from '../utils/logger';

/**
 * API service for interacting with the backend
 */
export const apiService = {
  /**
   * Submit merchant signup form data
   */
  async submitSignupForm(data: SignupFormData): Promise<ApiResponse> {
    console.log('API submitSignupForm called with data', data);
    try {
      // Get the base URL from config or use the current location
      const baseUrl =
        config.api.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      // Construct the correct URL - avoiding double /api/ issues
      const submitUrl = new URL('/api/submit', baseUrl).href;

      // Use enhanced logger for API requests
      logger.api.request('POST', submitUrl, data);

      // Delay for debugging
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const response = await fetch(submitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const status = response.status;

        let result;
        try {
          result = await response.json();
          // Log the response with our enhanced logger
          logger.api.response('POST', submitUrl, status, result);
        } catch (jsonError) {
          logger.error('Failed to parse response as JSON', jsonError);
          return {
            success: false,
            error: 'Failed to parse server response',
          };
        }

        if (!response.ok) {
          logger.error('API returned error response', {
            status,
            url: submitUrl,
            response: result,
          });
          return {
            success: false,
            error: result.error || 'An error occurred during form submission',
          };
        }
        return {
          success: true,
          message: result.message || 'Form submitted successfully',
          data: result.data,
        };
      } catch (fetchError) {
        logger.error('Fetch error during API request', fetchError);
        return {
          success: false,
          error: 'Failed to connect to server. Please check your connection.',
        };
      }
    } catch (error) {
      logger.error('API service error', error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
      };
    }
  },
};
