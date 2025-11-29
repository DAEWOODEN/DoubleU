"""
Vercel Serverless Function Entry Point
This file is required for Vercel to deploy FastAPI as serverless functions
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
    from mangum import Mangum
    from main import app
    
    # Create Mangum ASGI handler
    mangum_handler = Mangum(app, lifespan="off")
    
    # Vercel expects a function, not a class instance
    # Wrap Mangum handler in a function to avoid type checking issues
    def handler(event, context):
        """Vercel serverless function handler wrapper"""
        return mangum_handler(event, context)
        
except ImportError as e:
    # Better error handling for import issues
    import traceback
    error_msg = f"Import error: {str(e)}\n{traceback.format_exc()}"
    print(error_msg, file=sys.stderr)
    
    # Create a minimal error handler
    from mangum import Mangum
    from fastapi import FastAPI
    
    error_app = FastAPI()
    @error_app.get("/{path:path}")
    async def error_handler():
        return {"error": "Import failed", "detail": str(e)}
    
    error_mangum = Mangum(error_app, lifespan="off")
    
    def handler(event, context):
        """Error handler wrapper"""
        return error_mangum(event, context)
        
except Exception as e:
    import traceback
    error_msg = f"Setup error: {str(e)}\n{traceback.format_exc()}"
    print(error_msg, file=sys.stderr)
    raise

