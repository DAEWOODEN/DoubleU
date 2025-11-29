"""
Vercel Serverless Function Entry Point
This file is required for Vercel to deploy FastAPI as serverless functions
Vercel automatically handles ASGI applications, so we can directly export the FastAPI app
"""
import os
import sys
from pathlib import Path

# Get the backend directory (parent of api directory)
backend_dir = Path(__file__).parent.parent.absolute()

# Add backend directory to Python path
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Change working directory to backend for relative imports
os.chdir(str(backend_dir))

# Now import main app
try:
    from main import app
    
    # Vercel automatically handles ASGI applications (FastAPI is ASGI-compatible)
    # No need for Mangum wrapper - Vercel will handle it directly
    # Export the app directly
    handler = app
        
except ImportError as e:
    # Better error handling for import issues
    import traceback
    error_msg = f"Import error: {str(e)}\n{traceback.format_exc()}"
    print(error_msg, file=sys.stderr)
    
    # Create a minimal error handler
    from fastapi import FastAPI
    
    error_app = FastAPI()
    @error_app.get("/{path:path}")
    async def error_handler():
        return {"error": "Import failed", "detail": str(e)}
    
    handler = error_app
        
except Exception as e:
    import traceback
    error_msg = f"Setup error: {str(e)}\n{traceback.format_exc()}"
    print(error_msg, file=sys.stderr)
    raise

