import { NextResponse } from 'next/server';
import { logger } from '../src/utils/logger';

/**
 * CSRF protection implementation for API routes
 * Uses double submit cookie pattern
 */

// Generate a cryptographically secure random token
export function generateCSRFToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Set CSRF token in cookies and return token for form submission
export function setCSRFCookie(response: NextResponse, token?: string): string {
  // Generate token if not provided
  const csrfToken = token || generateCSRFToken();

  // Set cookie with HttpOnly and other security attributes
  response.cookies.set({
    name: 'csrf_token',
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    // Short expiration time for security
    maxAge: 60 * 60, // 1 hour
  });

  return csrfToken;
}

// Validate CSRF token from request
export function validateCSRFToken(request: Request, token: string): boolean {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      logger.warn('CSRF validation failed: No cookies in request');
      return false;
    }

    // Parse cookies
    const cookies: Record<string, string> = {};

    // Safely parse cookies
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2 && parts[0] !== undefined) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim(); // Handle values that may contain =
        if (key && key.length > 0) {
          cookies[key] = value;
        }
      }
    });

    // Get CSRF cookie
    const csrfCookie = cookies['csrf_token'];

    if (!csrfCookie) {
      logger.warn('CSRF validation failed: No CSRF cookie found');
      return false;
    }

    // Validate token match
    const isValid = csrfCookie === token;

    if (!isValid) {
      logger.warn('CSRF validation failed: Token mismatch');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('CSRF validation error', error);
    return false;
  }
}

// CSRF middleware for API routes
export function withCSRF(handler: (req: Request) => Promise<NextResponse>) {
  return async (request: Request) => {
    // Only validate POST, PUT, DELETE, PATCH requests
    const method = request.method.toUpperCase();

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      // Don't validate for safe methods
      return handler(request);
    }

    try {
      // Clone request to read body
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();

      // Check for CSRF token in request body
      if (!body.csrf_token) {
        logger.warn('CSRF validation failed: Missing token in request body');
        return NextResponse.json(
          {
            success: false,
            error: 'CSRF token validation failed',
          },
          { status: 403 }
        );
      }

      // Validate CSRF token
      if (!validateCSRFToken(request, body.csrf_token)) {
        logger.warn('CSRF validation failed: Invalid token');
        return NextResponse.json(
          {
            success: false,
            error: 'CSRF token validation failed',
          },
          { status: 403 }
        );
      }

      // CSRF validation successful
      return handler(request);
    } catch (error) {
      logger.error('CSRF middleware error', error);
      return NextResponse.json(
        {
          success: false,
          error: 'CSRF validation error',
        },
        { status: 403 }
      );
    }
  };
}
