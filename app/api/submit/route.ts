import { NextResponse } from 'next/server';
import { signupFormSchema } from '../../../lib/validators';
import { getSupabaseClient, createMockSupabaseClient } from '../../../lib/supabase-singleton';
import { serverCredentials } from '../../../lib/server-credentials';
import { getErrorMessage } from '../../../src/utils/validation';
import { logger } from '../../../src/utils/logger';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { withCSRF } from '../../../lib/csrf';

/**
 * Form submission endpoint
 * Validates and saves signup data to Supabase
 * Requires authentication and CSRF protection
 */
export async function POST(request: Request) {
  // Apply CSRF protection first
  return withCSRF(async csrfValidatedRequest => {
    // Then apply authentication middleware
    return requireAuth(csrfValidatedRequest, handleSubmission);
  })(request);
}

/**
 * Handle authenticated form submission
 */
async function handleSubmission(request: AuthenticatedRequest) {
  console.log('📥 API Route: Received authenticated submission request');
  try {
    // Check for actual Supabase credentials instead of relying on IS_BUILD_TIME
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasSupabaseCredentials =
      supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';

    // Log environment variables for debugging (omitting sensitive parts)
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV,
      isBuildTime: process.env.IS_BUILD_TIME,
    });

    // Log authenticated user info (redacted)
    const authenticatedUser = request.auth.user;
    logger.info('Authenticated user submission', {
      userId: authenticatedUser?.id,
      userEmail: authenticatedUser?.email ? `${authenticatedUser.email.substring(0, 3)}...` : null,
      authMethod: authenticatedUser?.app_metadata?.provider || 'unknown',
    });

    // Get Supabase client with server credentials
    let supabase;
    if (hasSupabaseCredentials) {
      try {
        supabase = getSupabaseClient(serverCredentials.supabaseUrl, serverCredentials.supabaseKey);
        logger.info('API using real Supabase client with server credentials');
      } catch (error) {
        logger.error('Error creating Supabase client', error);
        supabase = createMockSupabaseClient();
      }
    } else {
      console.log('⚠️ API Route: No Supabase credentials available, using mock client');
      supabase = createMockSupabaseClient();
    }

    console.log('🔄 API Route: Parsing request body...');
    // Get form data from request
    let data;
    try {
      data = await request.json();
      console.log('✅ API Route: Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ API Route: Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate form data
    console.log('🔄 API Route: Validating form data...', {
      accountType: data.account_type,
      name: data.name,
      phone: data.phone,
    });

    let validatedData;
    try {
      // To help debug, log what fields are expected based on account type
      console.log(`Account type is "${data.account_type}" - checking required fields`);
      if (data.account_type === 'business') {
        console.log(
          'Required fields for business: name, phone, business_name, business_address, terms_accepted'
        );
      } else if (data.account_type === 'merchant') {
        console.log('Required fields for merchant: name, phone, bank info fields, etc.');
      } else {
        console.log('Required fields for personal: name, phone, terms_accepted');
      }

      validatedData = signupFormSchema.parse(data);
      console.log('✅ API Route: Form data validated successfully');
    } catch (validationError) {
      console.error('❌ API Route: Form validation failed:', validationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + getErrorMessage(validationError),
        },
        { status: 400 }
      );
    }

    // Sanitize data (example: trim strings)
    Object.keys(validatedData).forEach((key: string) => {
      const value = validatedData[key as keyof typeof validatedData];
      if (typeof value === 'string') {
        (validatedData as any)[key] = value.trim();
      }
    });

    try {
      // Add creation timestamp and user ID
      const dataToInsert = {
        ...validatedData,
        created_at: new Date().toISOString(),
        // Add authenticated user ID to link the submission to the user account
        user_id: request.auth.user?.id,
      };

      // Create loggable object with properly redacted sensitive data
      const loggableData = {
        accountType: dataToInsert.account_type,
        hasBusinessName: !!dataToInsert.business_name,
        hasEmail: !!dataToInsert.email,
        hasIdImage: !!dataToInsert.id_image_url,
        timestamp: dataToInsert.created_at,
        userId: request.auth.user?.id,
        // Generate a reference ID for the submission that doesn't contain PII
        referenceId: `sub_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      };

      logger.info('Processing authenticated merchant signup form submission', loggableData);

      // Insert data into Supabase
      logger.info('Sending data to Supabase...');
      const { error } = await supabase.from('signups').insert([dataToInsert]);

      if (error) {
        logger.error('Supabase insertion error in API route', error);
        // Log the actual error for debugging but return a generic message to the client
        logger.error('Detailed database error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        return NextResponse.json(
          {
            success: false,
            error: 'An error occurred while saving your information. Please try again later.',
            referenceId: `err_${Date.now().toString(36)}`,
          },
          {
            status: 500,
          }
        );
      }

      logger.supabase.dataSubmitted('signups', { id: dataToInsert.business_name });

      // Set appropriate response headers
      const headers = new Headers();
      headers.set('Cache-Control', 'no-store');

      return NextResponse.json(
        {
          success: true,
          message: 'Signup successful',
          data: {
            created_at: dataToInsert.created_at,
          },
        },
        {
          status: 201, // Created
          headers,
        }
      );
    } catch (dbError: any) {
      console.error('Database operation error:', dbError);
      // Log detailed error but return a generic message
      logger.error('Database operation detailed error:', {
        message: getErrorMessage(dbError),
        stack: dbError?.stack,
        code: dbError?.code,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'An error occurred while processing your request. Please try again later.',
          referenceId: `err_${Date.now().toString(36)}`,
        },
        {
          status: 500,
        }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);

    // Handle validation errors
    if (error?.errors) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors,
        },
        {
          status: 400,
        }
      );
    }

    // Log the full error details for debugging
    logger.error('Unexpected API error:', {
      message: getErrorMessage(error),
      stack: error?.stack,
      code: error?.code,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
        referenceId: `err_${Date.now().toString(36)}`,
      },
      {
        status: 500,
      }
    );
  }
}
