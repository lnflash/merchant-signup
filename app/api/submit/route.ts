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
  try {
    // Check if we're in build time (should never happen in production)
    if (process.env.IS_BUILD_TIME === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build-time placeholder response',
      });
    }

    // Get form data from request
    const data = await request.json();

    // Validate form data
    const validatedData = signupFormSchema.parse(data);

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
        businessName: dataToInsert.businessName,
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

      logger.supabase.dataSubmitted('signups', { id: dataToInsert.businessName });

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
