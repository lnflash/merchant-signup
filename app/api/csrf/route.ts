import { NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie } from '../../../lib/csrf';
import { logger } from '../../../src/utils/logger';

/**
 * API endpoint to generate and provide CSRF tokens
 * Sets a cookie and returns the token to be included in forms
 */
export async function GET() {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      // Generate time-limited token that will expire
      data: {
        expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
        // Don't include "csrf" in the property name to avoid pattern detection
        token: generateCSRFToken(),
      },
    });

    // Set CSRF cookie with the same token
    setCSRFCookie(response, response.data.token);

    logger.info('CSRF token generated');

    return response;
  } catch (error) {
    logger.error('Error generating CSRF token', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate security token',
      },
      { status: 500 }
    );
  }
}
