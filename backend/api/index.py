"""
Vercel Serverless Function Entry Point for FastAPI
Uses HTTP handler class pattern that Vercel expects
"""
from http.server import BaseHTTPRequestHandler
import os
import sys
import json
from pathlib import Path

# Setup path before any imports
_backend_dir = Path(__file__).parent.parent.absolute()
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
os.chdir(str(_backend_dir))

# Import FastAPI app and create TestClient
from main import app as fastapi_app
from starlette.testclient import TestClient

# Create a single TestClient instance
_test_client = TestClient(fastapi_app, raise_server_exceptions=False)


class handler(BaseHTTPRequestHandler):
    """
    HTTP Handler that proxies requests to FastAPI app
    Vercel expects a class named 'handler' that inherits from BaseHTTPRequestHandler
    """
    
    def _call_fastapi(self, method: str, body: bytes = b""):
        """Call FastAPI app using TestClient"""
        # Build headers dict (filter out problematic headers)
        headers = {}
        for key, value in self.headers.items():
            key_lower = key.lower()
            if key_lower not in ('host', 'content-length'):
                headers[key] = value
        
        url = self.path
        
        # Make request based on method
        if method == "GET":
            return _test_client.get(url, headers=headers)
        elif method == "POST":
            return _test_client.post(url, content=body, headers=headers)
        elif method == "PUT":
            return _test_client.put(url, content=body, headers=headers)
        elif method == "DELETE":
            return _test_client.delete(url, headers=headers)
        elif method == "OPTIONS":
            return _test_client.options(url, headers=headers)
        elif method == "PATCH":
            return _test_client.patch(url, content=body, headers=headers)
        elif method == "HEAD":
            return _test_client.head(url, headers=headers)
        else:
            return _test_client.get(url, headers=headers)
    
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
            
            # Send headers (skip problematic ones)
            skip_headers = {'content-encoding', 'transfer-encoding', 'connection'}
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
        self._handle_request("OPTIONS")
    
    def do_PATCH(self):
        self._handle_request("PATCH")
    
    def do_HEAD(self):
        self._handle_request("HEAD")

