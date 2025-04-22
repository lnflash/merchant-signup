import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';

/**
 * Authentication middleware for API routes
 * Verifies JWT tokens and provides authentication status
 */

export interface AuthenticatedRequest extends Request {
  auth: {
    isAuthenticated: boolean;
    user: any | null;
    session: any | null;
    authMethod?: 'email' | 'phone' | 'anonymous';
    error?: any;
  };
}

/**
 * Get Supabase client using credentials from environment variables
 */
const getSupabaseAuth = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('Missing Supabase credentials for auth middleware');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Check if the request has a valid authentication token
 * Returns authenticated request with auth information
 * Supports both email and phone-based authentication
 */
export async function checkAuth(req: Request): Promise<AuthenticatedRequest> {
  const supabase = getSupabaseAuth();
  const authReq = req as AuthenticatedRequest;

  // Default auth state
  authReq.auth = {
    isAuthenticated: false,
    user: null,
    session: null,
  };

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      authReq.auth.error = 'Missing Authorization header';
      return authReq;
    }

    // Check for phone auth token first
    if (authHeader.startsWith('PhoneAuth ')) {
      return await handlePhoneAuthentication(authReq, authHeader);
    }

    // Then try standard JWT auth with Supabase
    if (authHeader.startsWith('Bearer ')) {
      if (!supabase) {
        authReq.auth.error = 'Supabase client initialization failed';
        return authReq;
      }

      return await handleEmailAuthentication(authReq, authHeader, supabase);
    }

    // Unknown auth method
    authReq.auth.error = 'Invalid Authorization header format';
    return authReq;
  } catch (error) {
    logger.error('Authentication middleware error', error);
    authReq.auth.error = 'Authentication check failed';
    return authReq;
  }
}

/**
 * Handle Email-based authentication via Supabase
 */
async function handleEmailAuthentication(
  authReq: AuthenticatedRequest,
  authHeader: string,
  supabase: any
): Promise<AuthenticatedRequest> {
  try {
    const token = authHeader.replace('Bearer ', '');

    // Verify the token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      authReq.auth.error = error || 'Invalid token';
      return authReq;
    }

    // Check if the session is valid
    const { data: sessionData } = await supabase.auth.getSession();

    // Set authentication info
    authReq.auth = {
      isAuthenticated: true,
      user: data.user,
      session: sessionData.session,
      authMethod: 'email',
    };

    return authReq;
  } catch (error) {
    logger.error('Email authentication error', error);
    authReq.auth.error = 'Email authentication check failed';
    return authReq;
  }
}

/**
 * Handle Phone-based authentication
 * Format: PhoneAuth {userId}:{phoneNumber}:{authToken}
 */
async function handlePhoneAuthentication(
  authReq: AuthenticatedRequest,
  authHeader: string
): Promise<AuthenticatedRequest> {
  try {
    const token = authHeader.replace('PhoneAuth ', '');
    const [userId, phoneNumber, authToken] = token.split(':');

    if (!userId || !phoneNumber || !authToken) {
      authReq.auth.error = 'Invalid phone authentication token format';
      return authReq;
    }

    // In a real application, we would verify this against a database
    // For demo purposes, we'll accept a valid format as authentic
    if (
      userId.startsWith('user_') &&
      userId.length > 10 &&
      phoneNumber.match(/^\+?[0-9]{10,15}$/) &&
      authToken.startsWith('phone_auth_')
    ) {
      authReq.auth = {
        isAuthenticated: true,
        user: {
          id: userId,
          phone: phoneNumber,
          authToken,
        },
        session: {
          auth_token: authToken,
        },
        authMethod: 'phone',
      };

      return authReq;
    }

    authReq.auth.error = 'Invalid phone authentication token';
    return authReq;
  } catch (error) {
    logger.error('Phone authentication error', error);
    authReq.auth.error = 'Phone authentication check failed';
    return authReq;
  }
}

/**
 * Middleware that requires authentication
 * Returns NextResponse with 401 status if not authenticated
 */
export async function requireAuth(
  req: Request,
  routeHandler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  const authReq = await checkAuth(req);

  if (!authReq.auth.isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
        message: authReq.auth.error || 'You must be logged in to access this resource',
      },
      { status: 401 }
    );
  }

  return routeHandler(authReq);
}
