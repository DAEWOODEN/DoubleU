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
from io import BytesIO
from urllib.parse import urlparse, parse_qs

# Setup path before any imports
_backend_dir = Path(__file__).parent.parent.absolute()
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
os.chdir(str(_backend_dir))

# Import FastAPI app
from main import app as fastapi_app


class handler(BaseHTTPRequestHandler):
    """
    HTTP Handler that proxies requests to FastAPI app
    Vercel expects a class named 'handler' that inherits from BaseHTTPRequestHandler
    """
    
    def _run_async(self, coro):
        """Run async code in sync context"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    
    async def _call_fastapi(self, method: str, body: bytes = b""):
        """Call FastAPI app with ASGI interface"""
        from starlette.testclient import TestClient
        
        # Use Starlette TestClient to make request to FastAPI
        with TestClient(fastapi_app, raise_server_exceptions=False) as client:
            headers = dict(self.headers)
            url = self.path
            
            if method == "GET":
                response = client.get(url, headers=headers)
            elif method == "POST":
                content_type = headers.get("Content-Type", "application/json")
                response = client.post(url, content=body, headers=headers)
            elif method == "PUT":
                response = client.put(url, content=body, headers=headers)
            elif method == "DELETE":
                response = client.delete(url, headers=headers)
            elif method == "OPTIONS":
                response = client.options(url, headers=headers)
            elif method == "PATCH":
                response = client.patch(url, content=body, headers=headers)
            else:
                response = client.get(url, headers=headers)
        
        return response
    
    def _handle_request(self, method: str):
        """Handle HTTP request"""
        try:
            # Read body for POST/PUT/PATCH
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else b""
            
            # Call FastAPI
            response = self._run_async(self._call_fastapi(method, body))
            
            # Send response
            self.send_response(response.status_code)
            
            # Send headers
            for key, value in response.headers.items():
                if key.lower() not in ("content-encoding", "transfer-encoding"):
                    self.send_header(key, value)
            self.end_headers()
            
            # Send body
            self.wfile.write(response.content)
            
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
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

