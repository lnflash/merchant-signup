import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase-singleton';
import { logger } from '../../../src/utils/logger';
import { z } from 'zod';

// Authentication request validation schema
const authRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Sign in endpoint - handles authentication for the application
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate the request
    try {
      authRequestSchema.parse(body);
    } catch (validationError: any) {
      logger.error('Auth validation error', validationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + (validationError.message || 'Invalid request'),
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      logger.error('Authentication error', {
        code: error.status,
        message: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed. Please check your email and password.',
        },
        { status: 401 }
      );
    }

    // Return successful authentication response
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        expires_at: data.session?.expires_at,
      },
    });
  } catch (error) {
    logger.error('Auth API error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during authentication',
      },
      { status: 500 }
    );
  }
}

/**
 * Sign up endpoint - creates a new user account
 */
export async function PUT(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate the request
    try {
      authRequestSchema.parse(body);
    } catch (validationError: any) {
      logger.error('Auth signup validation error', validationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + (validationError.message || 'Invalid request'),
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (error) {
      logger.error('Sign up error', {
        code: error.status,
        message: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Registration failed: ' + error.message,
        },
        { status: 400 }
      );
    }

    // Return successful signup response
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        // If email confirmation is enabled, the session might be null
        emailConfirmationRequired: !data.session,
      },
    });
  } catch (error) {
    logger.error('Auth signup API error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during registration',
      },
      { status: 500 }
    );
  }
}
