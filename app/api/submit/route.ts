import { NextResponse } from 'next/server';
import { signupFormSchema } from '../../../lib/validators';
import { supabase } from '../../../lib/supabase';
import { getErrorMessage } from '../../../src/utils/validation';
import { logger } from '../../../src/utils/logger';

/**
 * Form submission endpoint
 * Validates and saves signup data to Supabase
 */
export async function POST(request: Request) {
  console.log('📥 API Route: Received submission request');
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

    // If no Supabase credentials are available, return a more informative message
    if (!hasSupabaseCredentials) {
      console.log('⚠️ API Route: No Supabase credentials available, returning placeholder');
      return NextResponse.json({
        success: true,
        message:
          'API is running but database connection is unavailable. Please set Supabase environment variables.',
      });
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
      // Add creation timestamp
      const dataToInsert = {
        ...validatedData,
        created_at: new Date().toISOString(),
      };

      // Create loggable object with limited sensitive data
      const loggableData = {
        businessName: dataToInsert.business_name,
        email: dataToInsert.email,
        timestamp: dataToInsert.created_at,
      };

      logger.info('Processing merchant signup form submission', loggableData);

      // Insert data into Supabase
      logger.info('Sending data to Supabase...');
      const { error } = await supabase.from('signups').insert([dataToInsert]);

      if (error) {
        logger.error('Supabase insertion error in API route', error);
        return NextResponse.json(
          {
            success: false,
            error: `Database error: ${error.message || 'Failed to save data'}`,
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

      // No need to handle Cloudflare cookies server-side

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
      return NextResponse.json(
        {
          success: false,
          error: `Database operation failed: ${getErrorMessage(dbError)}`,
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

    return NextResponse.json(
      {
        success: false,
        error: `Unexpected error: ${getErrorMessage(error)}`,
      },
      {
        status: 500,
      }
    );
  }
}
