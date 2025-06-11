import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// MIME type mappings for static files
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.wasm': 'application/wasm',
};

// Get MIME type from file extension
function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// Set headers required for WebContainer (SharedArrayBuffer support)
function setWebContainerHeaders(response: NextResponse): void {
  // Cross-Origin Embedder Policy - Required for SharedArrayBuffer
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin Opener Policy - Required for SharedArrayBuffer
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin Resource Policy - Allow cross-origin requests
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache control for static assets
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
}

// Set headers for HTML files (different cache strategy)
function setHtmlHeaders(response: NextResponse): void {
  setWebContainerHeaders(response);

  // Override cache control for HTML files
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');

  /*
   * Content Security Policy for enhanced security
   */
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss: https:",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'self'",
    "media-src 'self' blob:",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
}

// Handle GET requests for static files
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }): Promise<NextResponse> {
  try {
    // Get the requested path
    const requestedPath = params.path ? params.path.join('/') : '';

    /*
     * Define the base directory for Bolt.diy static files
     * This should point to your built Bolt.diy static files
     */
    const staticDir = join(process.cwd(), 'public', 'bolt-diy');

    // Determine the file path
    let filePath: string;

    if (!requestedPath || requestedPath === '') {
      // Serve index.html for root requests
      filePath = join(staticDir, 'index.html');
    } else {
      // Serve the requested file
      filePath = join(staticDir, requestedPath);
    }

    // Security check: Ensure the file is within the static directory
    const resolvedPath = join(staticDir, requestedPath);

    if (!resolvedPath.startsWith(staticDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      // For SPA routing, serve index.html for non-existent routes
      const indexPath = join(staticDir, 'index.html');

      if (existsSync(indexPath)) {
        const indexContent = await readFile(indexPath);
        const response = new NextResponse(indexContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        });
        setHtmlHeaders(response);

        return response;
      }

      return new NextResponse('Not Found', { status: 404 });
    }

    // Get file stats
    const stats = await stat(filePath);

    // Check if it's a directory
    if (stats.isDirectory()) {
      // Try to serve index.html from the directory
      const indexPath = join(filePath, 'index.html');

      if (existsSync(indexPath)) {
        const content = await readFile(indexPath);
        const response = new NextResponse(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        });
        setHtmlHeaders(response);

        return response;
      }

      return new NextResponse('Directory listing not allowed', { status: 403 });
    }

    // Read the file
    const content = await readFile(filePath);

    // Determine content type
    const contentType = getMimeType(filePath);

    // Create response
    const response = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Last-Modified': stats.mtime.toUTCString(),
      },
    });

    // Set appropriate headers based on file type
    if (contentType === 'text/html') {
      setHtmlHeaders(response);
    } else {
      setWebContainerHeaders(response);
    }

    // Handle conditional requests
    const ifModifiedSince = request.headers.get('if-modified-since');

    if (ifModifiedSince) {
      const modifiedSince = new Date(ifModifiedSince);

      if (stats.mtime <= modifiedSince) {
        return new NextResponse(null, { status: 304 });
      }
    }

    return response;
  } catch (error) {
    console.error('Error serving Bolt.diy static file:', error);

    // Return a generic error response
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// Handle HEAD requests (same as GET but without body)
export async function HEAD(request: NextRequest, { params }: { params: { path: string[] } }): Promise<NextResponse> {
  const getResponse = await GET(request, { params });

  // Return the same headers but without the body
  return new NextResponse(null, {
    status: getResponse.status,
    headers: getResponse.headers,
  });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 200 });

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  // Set WebContainer headers
  setWebContainerHeaders(response);

  return response;
}