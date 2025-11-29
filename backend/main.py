"""
ComChatX Backend Main Application
FastAPI application with Multi-Agent system integration
"""

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
import uvicorn
from loguru import logger

from config import settings
from database import init_db, close_db
from api import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting ComChatX Backend Server...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    
    # Initialize database
    # In Vercel Serverless, /tmp is ephemeral, so we MUST recreate tables on every startup
    try:
        await init_db()
        logger.info("✅ Database initialized (tables created)")
    except Exception as e:
        logger.warning(f"Database init warning: {e}")
    
    # Initialize Multi-Agent system (lazy loading)
    logger.info("✅ Multi-Agent system ready for initialization")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down ComChatX Backend Server...")
    try:
        await close_db()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.warning(f"Database close warning: {e}")


# Create FastAPI application
app = FastAPI(
    title="ComChatX API",
    description="Multi-Agent System for Personal Statement Generation",
    version="1.0.0",
    lifespan=lifespan,
    # Disable default docs URLs to manually handle them
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


# Custom Docs Routes
@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI route to ensure it works behind Vercel rewrites"""
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=app.title + " - Swagger UI",
    )


@app.get("/api/redoc", include_in_schema=False)
async def redoc_html():
    """Custom ReDoc route"""
    from fastapi.openapi.docs import get_redoc_html
    return get_redoc_html(
        openapi_url="/api/openapi.json",
        title=app.title + " - ReDoc",
    )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "status": "healthy",
        "service": "ComChatX Backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "multi_agent": "ready",
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "An error occurred"
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )

