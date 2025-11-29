"""
Vercel Serverless Function Entry Point for FastAPI
Uses HTTP handler class pattern that Vercel expects
"""
from http.server import BaseHTTPRequestHandler
import os
import sys
import json
import asyncio
from pathlib import Path

# Setup path before any imports
_backend_dir = Path(__file__).parent.parent.absolute()
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
os.chdir(str(_backend_dir))

# Set VERCEL environment variable
os.environ["VERCEL"] = "1"

# Import FastAPI app
from main import app as fastapi_app
from loguru import logger

# Set VERCEL environment variable explicitly for other modules
os.environ["VERCEL"] = "1"

# CORS allowed origins
ALLOWED_ORIGINS = [
    "https://comchatx.icu",
    "https://www.comchatx.icu",
    "http://localhost:5173",
    "http://localhost:3000",
]


class handler(BaseHTTPRequestHandler):
    """
    HTTP Handler that proxies requests to FastAPI app
    Vercel expects a class named 'handler' that inherits from BaseHTTPRequestHandler
    """
    
    def _get_origin(self):
        """Get and validate origin header"""
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            return origin
        return ALLOWED_ORIGINS[0]  # Default to main domain
    
    def _add_cors_headers(self):
        """Add CORS headers to response"""
        origin = self._get_origin()
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Max-Age", "86400")
    
    def _call_fastapi(self, method: str, body: bytes = b""):
        """Call FastAPI app using TestClient"""
        from starlette.testclient import TestClient
        
        # Create TestClient per request to avoid state issues
        with TestClient(fastapi_app, raise_server_exceptions=False) as client:
            # Build headers dict (filter out problematic headers)
            headers = {}
            for key, value in self.headers.items():
                key_lower = key.lower()
                if key_lower not in ('host', 'content-length', 'connection'):
                    headers[key] = value
            
            url = self.path
            
            # Make request based on method
            if method == "GET":
                return client.get(url, headers=headers)
            elif method == "POST":
                return client.post(url, content=body, headers=headers)
            elif method == "PUT":
                return client.put(url, content=body, headers=headers)
            elif method == "DELETE":
                return client.delete(url, headers=headers)
            elif method == "OPTIONS":
                return client.options(url, headers=headers)
            elif method == "PATCH":
                return client.patch(url, content=body, headers=headers)
            elif method == "HEAD":
                return client.head(url, headers=headers)
            else:
                return client.get(url, headers=headers)
    
    def _handle_request(self, method: str):
        """Handle HTTP request"""
        try:
            # Read body for POST/PUT/PATCH
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else b""
            
            # Call FastAPI
            response = self._call_fastapi(method, body)
            
            # Send response
            self.send_response(response.status_code)
            
            # Add CORS headers
            self._add_cors_headers()
            
            # Send headers (skip problematic ones)
            skip_headers = {'content-encoding', 'transfer-encoding', 'connection', 
                          'access-control-allow-origin', 'access-control-allow-methods',
                          'access-control-allow-headers', 'access-control-allow-credentials'}
            for key, value in response.headers.items():
                if key.lower() not in skip_headers:
                    self.send_header(key, value)
            self.end_headers()
            
            # Send body
            self.wfile.write(response.content)
            
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            self.send_response(500)
            self._add_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": str(e),
                "detail": error_detail
            }).encode())
    
    def do_GET(self):
        self._handle_request("GET")
    
    def do_POST(self):
        self._handle_request("POST")
    
    def do_PUT(self):
        self._handle_request("PUT")
    
    def do_DELETE(self):
        self._handle_request("DELETE")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self._add_cors_headers()
        self.end_headers()
    
    def do_PATCH(self):
        self._handle_request("PATCH")
    
    def do_HEAD(self):
        self._handle_request("HEAD")

