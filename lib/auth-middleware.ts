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

  if (!supabase) {
    authReq.auth.error = 'Supabase client initialization failed';
    return authReq;
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      authReq.auth.error = 'Missing or invalid Authorization header';
      return authReq;
    }

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
    };

    return authReq;
  } catch (error) {
    logger.error('Authentication middleware error', error);
    authReq.auth.error = 'Authentication check failed';
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
