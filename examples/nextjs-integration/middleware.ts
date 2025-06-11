import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to set headers required for WebContainer support
 * This ensures that all responses include the necessary COOP/COEP headers
 * for SharedArrayBuffer functionality used by WebContainer.
 */
export function middleware(_request: NextRequest): NextResponse {
  // Get the response
  const response = NextResponse.next();

  // Set headers required for WebContainer (SharedArrayBuffer support)
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Set Permissions Policy for enhanced security
  const permissionsPolicy = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);

  return response;
}

/**
 * Configure which routes the middleware should run on
 * This matcher ensures the middleware runs on all routes
 * but excludes static files and API routes that don't need it
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that handle their own headers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};