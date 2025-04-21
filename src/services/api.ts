import { config } from '../config';
import { ApiResponse, SignupFormData } from '../types';
import { logger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';

/**
 * API service for interacting with the backend
 * With fallback to direct Supabase connection for static deployments
 */
export const apiService = {
  /**
   * Submit merchant signup form data
   * Uses the API endpoint if available, falls back to direct Supabase connection for static builds
   */
  async submitSignupForm(data: SignupFormData): Promise<ApiResponse> {
    console.log('API submitSignupForm called with data:', { ...data, id_image_url: data.id_image_url ? '[REDACTED]' : null });
    try {
      // Check if we're in a static build with window.ENV
      const isStaticBuild = typeof window !== 'undefined' && window.ENV && window.ENV.BUILD_TIME;
      
      // Get the base URL from config or use the current location
      const baseUrl = config.api.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      // For static builds, try direct Supabase connection first
      if (isStaticBuild) {
        return await this.submitFormWithSupabaseDirect(data);
      }

      // For regular builds, use the API endpoint
      return await this.submitFormWithApi(data, baseUrl);
    } catch (error) {
      logger.error('API service error', error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
      };
    }
  },

  /**
   * Submit form data using the API endpoint
   */
  async submitFormWithApi(data: SignupFormData, baseUrl: string): Promise<ApiResponse> {
    // Construct the correct URL - avoiding double /api/ issues
    const submitUrl = new URL('/api/submit', baseUrl).href;

    // Use enhanced logger for API requests
    logger.api.request('POST', submitUrl, { ...data, id_image_url: data.id_image_url ? '[REDACTED]' : null });

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
      
      // If API request fails, try direct Supabase as a fallback
      logger.info('API request failed, trying direct Supabase connection as fallback');
      return await this.submitFormWithSupabaseDirect(data);
    }
  },

  /**
   * Submit form data directly to Supabase
   * Used as a fallback for static builds or when the API endpoint is not available
   */
  async submitFormWithSupabaseDirect(data: SignupFormData): Promise<ApiResponse> {
    logger.info('Submitting form directly to Supabase');
    
    try {
      // Get Supabase credentials from window.ENV (static build) or environment variables
      const env = typeof window !== 'undefined' ? window.ENV : null;
      
      const supabaseUrl = env?.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = env?.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        logger.error('Missing Supabase credentials for direct connection');
        return {
          success: false,
          error: 'Configuration error: Missing database credentials',
        };
      }
      
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Add metadata for tracking
      const submissionData = {
        ...data,
        submitted_at: new Date().toISOString(),
        submission_source: 'static_client',
        client_version: config.app.version,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };
      
      // Insert data into the merchant_signups table
      const { data: result, error } = await supabase
        .from('merchant_signups')
        .insert([submissionData])
        .select();
        
      if (error) {
        logger.error('Supabase insert error', error);
        return {
          success: false,
          error: error.message || 'Database error occurred',
        };
      }
      
      logger.info('Form submitted directly to Supabase successfully', {
        id: result?.[0]?.id,
        timestamp: result?.[0]?.created_at,
      });
      
      return {
        success: true,
        message: 'Form submitted successfully',
        data: result?.[0],
      };
    } catch (error) {
      logger.error('Direct Supabase connection error', error);
      return {
        success: false,
        error: 'Database connection error. Please try again later.',
      };
    }
  }
};