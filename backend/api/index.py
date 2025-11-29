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
    
    # Create ASGI handler for Vercel
    # lifespan="off" because Vercel handles serverless lifecycle differently
    mangum_handler = Mangum(app, lifespan="off")
    
    # Wrap in a function to ensure it's callable
    def handler(event, context):
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
    
    mangum_handler = Mangum(error_app, lifespan="off")
    def handler(event, context):
        return mangum_handler(event, context)
        
except Exception as e:
    import traceback
    error_msg = f"Setup error: {str(e)}\n{traceback.format_exc()}"
    print(error_msg, file=sys.stderr)
    raise

