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
    console.log('API submitSignupForm called with data', data);
    try {
      // Get the base URL from config or use the current location
      const baseUrl =
        config.api.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      console.log('Submitting form to:', `${baseUrl}/api/submit`);

      // Log the actual data being sent
      console.log('Request payload:', JSON.stringify(data, null, 2));

      // Delay for debugging
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const response = await fetch(`${baseUrl}/api/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        console.log('Fetch response status:', response.status);

        let result;
        try {
          result = await response.json();
          console.log('Response data:', result);
        } catch (jsonError) {
          console.error('Failed to parse response as JSON:', jsonError);
          return {
            success: false,
            error: 'Failed to parse server response',
          };
        }

        if (!response.ok) {
          console.error('API returned error:', result);
          return {
            success: false,
            error: result.error || 'An error occurred during form submission',
          };
        }

        console.log('API request successful:', result);
        return {
          success: true,
          message: result.message || 'Form submitted successfully',
          data: result.data,
        };
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return {
          success: false,
          error: 'Failed to connect to server. Please check your connection.',
        };
      }
    } catch (error) {
      console.error('API service error:', error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
      };
    }
  },
};
