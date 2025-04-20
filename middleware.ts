import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware intercepts requests to handle cookies and security headers
export function middleware(request: NextRequest) {
  // Get the response with forwarded headers
  const response = NextResponse.next();

  // Check for Cloudflare cookies and modify them if needed
  const cfCookie = request.cookies.get('__cf_bm');
  if (cfCookie) {
    // Clear the problematic cookie by setting it with Max-Age=0
    response.cookies.set({
      name: '__cf_bm',
      value: '',
      path: '/',
      // Make sure to set the domain to your app's actual domain
      domain: 'flash-merchant-signup-ov4yh.ondigitalocean.app',
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  }

  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// Apply this middleware to all routes
export const config = {
  matcher: ['/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)'],
};
