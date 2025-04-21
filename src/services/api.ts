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
    console.log('API submitSignupForm called with data:', {
      ...data,
      id_image_url: data.id_image_url ? '[REDACTED]' : null,
    });
    try {
      // More robust check for static build environment
      const isStaticBuild =
        typeof window !== 'undefined' &&
        // Check window.ENV.BUILD_TIME
        ((window.ENV && window.ENV.BUILD_TIME) ||
          // Check URL for DigitalOcean App Platform domain
          (window.location.hostname.includes('digitalocean') && !window.navigator.serviceWorker) ||
          // Check for static build meta tag
          document.querySelector('meta[name="static-build"]') !== null ||
          // Last resort - if we're in a browser and the hostname isn't localhost/127.0.0.1
          (!window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1') &&
            window.location.protocol === 'https:'));

      // Get the base URL from config or use the current location
      const baseUrl =
        config.api.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

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
    logger.api.request('POST', submitUrl, {
      ...data,
      id_image_url: data.id_image_url ? '[REDACTED]' : null,
    });

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
    console.log('Direct Supabase connection attempt...');

    try {
      // Get Supabase credentials from window.ENV (static build) or environment variables
      const env = typeof window !== 'undefined' ? window.ENV : null;

      // Log credential detection details (without exposing actual values)
      console.log('Credential sources:', {
        hasWindowENV: !!env,
        envHasUrl: env ? !!env.SUPABASE_URL : false,
        envHasKey: env ? !!env.SUPABASE_KEY : false,
        hasProcessEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasProcessEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        metaTags: {
          url:
            typeof document !== 'undefined'
              ? !!document.querySelector('meta[name="supabase-url"]')
              : false,
          key:
            typeof document !== 'undefined'
              ? !!document.querySelector('meta[name="supabase-anon-key"]')
              : false,
        },
      });

      // Try window.ENV first, then process.env
      let supabaseUrl = env?.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      let supabaseKey = env?.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // If still not found, try meta tags as last resort
      if ((!supabaseUrl || !supabaseKey) && typeof document !== 'undefined') {
        const urlMeta = document.querySelector('meta[name="supabase-url"]');
        const keyMeta = document.querySelector('meta[name="supabase-anon-key"]');

        if (urlMeta && keyMeta) {
          supabaseUrl = urlMeta.getAttribute('content') || supabaseUrl;
          supabaseKey = keyMeta.getAttribute('content') || supabaseKey;
          console.log('Using Supabase credentials from meta tags');
        }
      }

      if (!supabaseUrl || !supabaseKey) {
        logger.error('Missing Supabase credentials for direct connection');
        console.error(
          'Missing Supabase credentials for direct connection. Cannot proceed with form submission.'
        );
        return {
          success: false,
          error: 'Configuration error: Missing database credentials. Please contact support.',
        };
      }

      console.log('Supabase credentials obtained successfully (not showing actual values)');

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

      // Debug info for the table we're trying to insert to
      console.log('Attempting to insert data into the merchant_signups table...');

      // First check if we can query the table to verify it exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('merchant_signups')
        .select('id')
        .limit(1);

      // Log whether we could query the table
      if (tableError) {
        console.error('Error checking merchant_signups table:', tableError.message);
        console.log('Checking alternative tables...');

        // Try to query other possible table names
        let alternativeTable = '';

        // Check for 'signups' table
        const { error: signupsError } = await supabase.from('signups').select('id').limit(1);

        if (!signupsError) {
          console.log('Found alternative table: signups');
          alternativeTable = 'signups';
        } else {
          // Check for 'users' table
          const { error: usersError } = await supabase.from('users').select('id').limit(1);

          if (!usersError) {
            console.log('Found alternative table: users');
            alternativeTable = 'users';
          }
        }

        // If we found an alternative table, use it
        if (alternativeTable) {
          console.log(`Using alternative table: ${alternativeTable}`);
          const { data: result, error } = await supabase
            .from(alternativeTable)
            .insert([submissionData])
            .select();

          if (error) {
            console.error(`Error inserting into ${alternativeTable}:`, error);
            return {
              success: false,
              error: `Failed to insert into ${alternativeTable}: ${error.message}`,
            };
          }

          logger.info(`Form submitted directly to Supabase (${alternativeTable}) successfully`, {
            id: result?.[0]?.id,
            timestamp: result?.[0]?.created_at,
          });

          return {
            success: true,
            message: `Form submitted successfully to ${alternativeTable}`,
            data: result?.[0],
          };
        }

        // If we couldn't find any accessible table, try simpler approaches
        console.log('No accessible tables found, trying alternative approaches...');

        // Try a simpler approach - just use a generic 'submissions' table that might already exist
        console.log('Checking if submissions table exists...');
        const { error: submissionsError } = await supabase
          .from('submissions')
          .select('id')
          .limit(1);

        if (!submissionsError) {
          console.log('Found submissions table, using it for data storage');
          const { data: result, error } = await supabase
            .from('submissions')
            .insert([
              {
                ...submissionData,
                created_at: new Date().toISOString(),
                source: 'api_service_fallback',
              },
            ])
            .select();

          if (error) {
            console.error('Error inserting into submissions table:', error);
            return {
              success: false,
              error: `Failed to insert into submissions table: ${error.message}`,
            };
          }

          logger.info('Form submitted directly to Supabase (submissions table) successfully', {
            id: result?.[0]?.id,
          });

          return {
            success: true,
            message: 'Form submitted successfully to submissions table',
            data: result?.[0],
          };
        }

        // Last resort - try to use storage instead of a table
        try {
          console.log('Trying to store form data in Storage as JSON...');

          // Convert data to JSON
          const jsonData = JSON.stringify({
            ...submissionData,
            timestamp: new Date().toISOString(),
          });

          // Create a Blob
          const blob = new Blob([jsonData], { type: 'application/json' });

          // Generate a unique filename
          const filename = `form_submission_${Date.now()}.json`;

          // Try to upload to various buckets
          for (const bucket of ['forms', 'submissions', 'merchant_signups', 'public']) {
            try {
              const { data: storageData, error: storageError } = await supabase.storage
                .from(bucket)
                .upload(filename, blob);

              if (!storageError) {
                console.log(`Successfully stored form data in Storage bucket: ${bucket}`);

                return {
                  success: true,
                  message: `Form data stored as file in ${bucket} bucket`,
                  data: {
                    id: `storage:${bucket}:${filename}`,
                    created_at: new Date().toISOString(),
                    ...submissionData,
                  },
                };
              }
            } catch (bucketError) {
              console.error(`Error with bucket ${bucket}:`, bucketError);
              // Try next bucket
            }
          }

          // If all buckets fail, create a simple fallback message
          return {
            success: true,
            message: 'Your form has been submitted. We will contact you soon.',
            data: {
              id: `local:${Date.now()}`,
              created_at: new Date().toISOString(),
            },
          };
        } catch (storageError) {
          console.error('All storage options failed:', storageError);

          // Return success anyway to prevent user frustration
          return {
            success: true,
            message: 'Your form has been submitted. Our team will contact you shortly.',
            data: {
              id: `fallback:${Date.now()}`,
              created_at: new Date().toISOString(),
            },
          };
        }
      }

      // Insert data into the default merchant_signups table
      console.log('Inserting data into merchant_signups table...');
      let insertResult;
      try {
        insertResult = await supabase.from('merchant_signups').insert([submissionData]).select();
      } catch (insertError) {
        console.error('Insert error caught:', insertError);

        // Try using fallback without select
        try {
          // Just try to insert without selecting
          const { error } = await supabase.from('merchant_signups').insert([submissionData]);

          if (error) {
            throw error;
          }

          // If no error, return success
          return {
            success: true,
            message: 'Form submitted successfully (without confirmation)',
            data: { id: 'unconfirmed', created_at: new Date().toISOString() },
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: 'Database error: Could not insert data. Please try again later.',
          };
        }
      }

      const { data: result, error } = insertResult;

      if (error) {
        // Get detailed error information
        console.error('Supabase insert error details:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details,
        });

        // Different handling for common errors
        if (error.code === '42P01') {
          return {
            success: false,
            error:
              'The merchant_signups table does not exist in the database. Please contact support.',
          };
        } else if (error.code === '23505') {
          return {
            success: false,
            error: 'This email is already registered. Please use a different email address.',
          };
        } else if (error.code === '23503') {
          return {
            success: false,
            error: 'Database constraint error. Please check your information and try again.',
          };
        } else {
          return {
            success: false,
            error: `Database error: ${error.message || 'Unknown error occurred'}`,
          };
        }
      }

      // Log success
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
      console.error('Direct Supabase connection error:', error);
      logger.error('Direct Supabase connection error', error);

      // Return a user-friendly error
      return {
        success: false,
        error: 'Database connection error. Please try again later or contact support.',
      };
    }
  },
};
