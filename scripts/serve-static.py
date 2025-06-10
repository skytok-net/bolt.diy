#!/usr/bin/env python3

"""
Static File Server with WebContainer Support (Python Alternative)

Serves static build files from dist/static/ with proper CORS headers
required for WebContainer functionality.

Features:
- WebContainer-compatible CORS headers
- Proper MIME type detection
- SPA fallback routing
- Error handling and logging
- Configurable port

Usage:
    python scripts/serve-static.py [port]
    python scripts/serve-static.py 8080
"""

import os
import sys
import mimetypes
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import signal
import datetime

# Configuration
DEFAULT_PORT = 3000
SCRIPT_DIR = Path(__file__).parent
STATIC_DIR = SCRIPT_DIR.parent / "dist" / "static"
INDEX_FILE = "index.html"

class WebContainerHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler with WebContainer support"""
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve from
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)
    
    def end_headers(self):
        """Add WebContainer-required headers to all responses"""
        # Essential WebContainer headers
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        
        # Additional CORS headers for broader compatibility
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        super().end_headers()
    
    def do_GET(self):
        """Handle GET requests with SPA fallback"""
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        request_path = parsed_path.path.lstrip('/')
        
        # Default to index.html for root requests
        if not request_path or request_path == '/':
            request_path = INDEX_FILE
        
        # Construct full file path
        file_path = STATIC_DIR / request_path
        
        # Security check: ensure file is within static directory
        try:
            file_path.resolve().relative_to(STATIC_DIR.resolve())
        except ValueError:
            self.log_message("Security warning: Attempted access outside static directory: %s", request_path)
            self.send_error(403, "Forbidden")
            return
        
        # Check if file exists
        if file_path.exists() and file_path.is_file():
            # Serve the file
            self.serve_file(file_path, request_path)
        elif file_path.exists() and file_path.is_dir():
            # Try to serve index.html from directory
            index_path = file_path / INDEX_FILE
            if index_path.exists():
                self.serve_file(index_path, f"{request_path}/{INDEX_FILE}")
            else:
                self.send_error(404, "Directory listing not allowed")
        else:
            # File not found - for SPA, fallback to index.html
            index_path = STATIC_DIR / INDEX_FILE
            if index_path.exists():
                self.log_message("[SPA Fallback] %s -> %s", request_path, INDEX_FILE)
                self.serve_file(index_path, INDEX_FILE)
            else:
                self.send_error(404, "Not Found")
    
    def serve_file(self, file_path, request_path):
        """Serve a file with proper headers"""
        try:
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if mime_type is None:
                mime_type = 'application/octet-stream'
            
            # Read file content
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            
            # Set cache headers
            if file_path.suffix == '.html':
                self.send_header('Cache-Control', 'no-cache')
            else:
                self.send_header('Cache-Control', 'public, max-age=31536000')
            
            self.end_headers()
            self.wfile.write(content)
            
            # Log successful request
            timestamp = datetime.datetime.now().isoformat()
            self.log_message("[%s] 200 %s (%s)", timestamp, request_path, mime_type)
            
        except Exception as e:
            self.log_error("Error serving file %s: %s", file_path, str(e))
            self.send_error(500, "Internal Server Error")
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        sys.stdout.write("%s\n" % (format % args))
        sys.stdout.flush()

def check_static_build():
    """Check if static build exists"""
    if not STATIC_DIR.exists():
        print("❌ Error: Static build directory not found!")
        print(f"   Expected: {STATIC_DIR}")
        print("")
        print("🔧 To create the static build, run:")
        print("   npm run build:static")
        print("   or")
        print("   pnpm build:static")
        print("")
        sys.exit(1)
    
    index_path = STATIC_DIR / INDEX_FILE
    if not index_path.exists():
        print("❌ Error: index.html not found in static build!")
        print(f"   Expected: {index_path}")
        print("")
        print("🔧 Please rebuild the static version:")
        print("   npm run build:static")
        print("")
        sys.exit(1)

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\n🛑 Shutting down server...")
    print("✅ Server stopped successfully")
    sys.exit(0)

def start_server():
    """Start the HTTP server"""
    # Check if static build exists
    check_static_build()
    
    # Get port from command line argument or environment
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"❌ Error: Invalid port number '{sys.argv[1]}'")
            sys.exit(1)
    elif 'PORT' in os.environ:
        try:
            port = int(os.environ['PORT'])
        except ValueError:
            print(f"❌ Error: Invalid PORT environment variable '{os.environ['PORT']}'")
            sys.exit(1)
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start server
    try:
        server = HTTPServer(('localhost', port), WebContainerHandler)
        
        print("🚀 Static File Server with WebContainer Support (Python)")
        print("")
        print(f"📁 Serving: {STATIC_DIR}")
        print(f"🌐 URL: http://localhost:{port}")
        print("")
        print("✅ WebContainer Headers Enabled:")
        print("   • Cross-Origin-Embedder-Policy: credentialless")
        print("   • Cross-Origin-Opener-Policy: same-origin")
        print("   • Cross-Origin-Resource-Policy: cross-origin")
        print("")
        print("🎯 Features:")
        print("   • Static file serving with proper MIME types")
        print("   • SPA fallback routing to index.html")
        print("   • Security headers and CORS support")
        print("   • Request logging and error handling")
        print("")
        print("🛑 To stop the server: Ctrl+C")
        print("")
        
        server.serve_forever()
        
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Error: Port {port} is already in use!")
            print("   Try a different port:")
            print(f"   python scripts/serve-static.py 8080")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    start_server()