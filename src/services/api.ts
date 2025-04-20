import { config } from '../config';
import { ApiResponse, SignupFormData } from '../types';

/**
 * API service for interacting with the backend
 */
export const apiService = {
  /**
   * Submit merchant signup form data
   */
  async submitSignupForm(data: SignupFormData): Promise<ApiResponse> {
    try {
      // Get the base URL from config or use the current location
      const baseUrl =
        config.api.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      console.log('Submitting form to:', `${baseUrl}/api/submit`);

      const response = await fetch(`${baseUrl}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
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
    } catch (error) {
      console.error('API error:', error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
      };
    }
  },
};
