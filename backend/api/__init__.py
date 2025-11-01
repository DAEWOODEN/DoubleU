"""
API Routes Package
All FastAPI routes for ComChatX
"""

from fastapi import APIRouter
from .profile import router as profile_router
from .ideas import router as ideas_router
from .chat import router as chat_router
from .narrative import router as narrative_router
from .essay import router as essay_router
from .insights import router as insights_router

# Main API router
router = APIRouter()

# Include all sub-routers
router.include_router(profile_router, prefix="/profile", tags=["profile"])
router.include_router(ideas_router, prefix="/ideas", tags=["ideas"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(narrative_router, prefix="/narrative", tags=["narrative"])
router.include_router(essay_router, prefix="/essay", tags=["essay"])
router.include_router(insights_router, prefix="/insights", tags=["insights"])

__all__ = ["router"]

