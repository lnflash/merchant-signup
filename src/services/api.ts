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
      const response = await fetch(`${config.api.baseUrl}/api/submit`, {
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
