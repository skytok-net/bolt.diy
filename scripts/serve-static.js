#!/usr/bin/env node

/**
 * Static File Server with WebContainer Support
 *
 * Serves static build files from dist/static/ with proper CORS headers
 * required for WebContainer functionality.
 *
 * Features:
 * - WebContainer-compatible CORS headers
 * - Proper MIME type detection
 * - SPA fallback routing
 * - Error handling and logging
 * - Configurable port
 */

import { createServer } from 'http';
import { readFile, stat, readdir } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DEFAULT_PORT = 3000;
const STATIC_DIR = join(__dirname, '../dist/static');
const INDEX_FILE = 'index.html';

// MIME types mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Set WebContainer-required CORS headers
 */
function setWebContainerHeaders(res) {
  // Essential WebContainer headers
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Additional CORS headers for broader compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Send error response
 */
function sendError(res, statusCode, message) {
  setWebContainerHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

/**
 * Send file response
 */
async function sendFile(res, filePath, requestPath) {
  try {
    const data = await readFile(filePath);
    const mimeType = getMimeType(filePath);

    setWebContainerHeaders(res);
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': data.length,
      'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000',
    });

    res.end(data);

    // Log successful request
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 200 ${requestPath} (${mimeType})`);
  } catch (error) {
    console.error(`Error serving file ${filePath}:`, error.message);
    sendError(res, 500, 'Internal Server Error');
  }
}

/**
 * Handle incoming requests
 */
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let requestPath = decodeURIComponent(url.pathname);

  // Remove leading slash and normalize path
  requestPath = requestPath.replace(/^\/+/, '');

  // Default to index.html for root requests
  if (!requestPath || requestPath === '/') {
    requestPath = INDEX_FILE;
  }

  // Construct full file path
  const filePath = join(STATIC_DIR, requestPath);

  // Security check: ensure file is within static directory
  if (!filePath.startsWith(STATIC_DIR)) {
    console.warn(`Security warning: Attempted access outside static directory: ${requestPath}`);
    sendError(res, 403, 'Forbidden');

    return;
  }

  try {
    const stats = await stat(filePath);

    if (stats.isFile()) {
      // Serve the file
      await sendFile(res, filePath, requestPath);
    } else if (stats.isDirectory()) {
      // Try to serve index.html from directory
      const indexPath = join(filePath, INDEX_FILE);

      try {
        await stat(indexPath);
        await sendFile(res, indexPath, `${requestPath}/${INDEX_FILE}`);
      } catch {
        sendError(res, 404, 'Directory listing not allowed');
      }
    } else {
      sendError(res, 404, 'Not Found');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File not found - for SPA, fallback to index.html
      const indexPath = join(STATIC_DIR, INDEX_FILE);

      try {
        await stat(indexPath);
        console.log(`[SPA Fallback] ${requestPath} -> ${INDEX_FILE}`);
        await sendFile(res, indexPath, INDEX_FILE);
      } catch {
        sendError(res, 404, 'Not Found');
      }
    } else {
      console.error(`Error accessing ${filePath}:`, error.message);
      sendError(res, 500, 'Internal Server Error');
    }
  }
}

/**
 * Check if static build exists
 */
function checkStaticBuild() {
  if (!existsSync(STATIC_DIR)) {
    console.error('❌ Error: Static build directory not found!');
    console.error(`   Expected: ${STATIC_DIR}`);
    console.error('');
    console.error('🔧 To create the static build, run:');
    console.error('   npm run build:static');
    console.error('   or');
    console.error('   pnpm build:static');
    console.error('');
    process.exit(1);
  }

  const indexPath = join(STATIC_DIR, INDEX_FILE);

  if (!existsSync(indexPath)) {
    console.error('❌ Error: index.html not found in static build!');
    console.error(`   Expected: ${indexPath}`);
    console.error('');
    console.error('🔧 Please rebuild the static version:');
    console.error('   npm run build:static');
    console.error('');
    process.exit(1);
  }
}

/**
 * Start the server
 */
function startServer() {
  // Check if static build exists
  checkStaticBuild();

  // Get port from environment or use default
  const port = process.env.PORT || DEFAULT_PORT;

  // Create HTTP server
  const server = createServer(handleRequest);

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Error: Port ${port} is already in use!`);
      console.error('   Try a different port:');
      console.error(`   PORT=8080 npm run serve:static`);
    } else {
      console.error('❌ Server error:', error.message);
    }

    process.exit(1);
  });

  // Start listening
  server.listen(port, () => {
    console.log('🚀 Static File Server with WebContainer Support');
    console.log('');
    console.log(`📁 Serving: ${STATIC_DIR}`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log('');
    console.log('✅ WebContainer Headers Enabled:');
    console.log('   • Cross-Origin-Embedder-Policy: credentialless');
    console.log('   • Cross-Origin-Opener-Policy: same-origin');
    console.log('   • Cross-Origin-Resource-Policy: cross-origin');
    console.log('');
    console.log('🎯 Features:');
    console.log('   • Static file serving with proper MIME types');
    console.log('   • SPA fallback routing to index.html');
    console.log('   • Security headers and CORS support');
    console.log('   • Request logging and error handling');
    console.log('');
    console.log('🛑 To stop the server: Ctrl+C');
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
      console.log('✅ Server stopped successfully');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.close(() => {
      console.log('✅ Server stopped successfully');
      process.exit(0);
    });
  });
}

// Start the server
startServer();
