"""
Vercel Serverless Function Entry Point
This file is required for Vercel to deploy FastAPI as serverless functions
"""
import os
import sys

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mangum import Mangum
from main import app

# Create ASGI handler for Vercel
# lifespan="off" because Vercel handles serverless lifecycle differently
handler = Mangum(app, lifespan="off")

