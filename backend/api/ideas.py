"""
Ideas API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from typing import List
import json

from database import get_db, Idea as IdeaModel
from agents import get_agent_system
from .schemas import (
    IdeasSyncRequest,
    IdeaAnalyzeRequest,
    IdeasSummaryResponse,
    IdeaResponse,
    IdeaPosition,
    IdeaVelocity,
    IdeaAnalysis,
)

router = APIRouter()


@router.post("/sync")
async def sync_ideas(
    request: IdeasSyncRequest,
    db: AsyncSession = Depends(get_db)
):
    """Sync ideas from frontend to backend"""
    try:
        profile_id = "default"
        
        for idea_data in request.ideas:
            idea_id = idea_data.get("id")
            
            # Check if idea exists
            result = await db.execute(
                select(IdeaModel).where(IdeaModel.id == idea_id)
            )
            existing_idea = result.scalar_one_or_none()
            
            position = idea_data.get("position", {})
            
            if existing_idea:
                # Update existing idea
                existing_idea.content = idea_data.get("content", "")
                existing_idea.intensity = idea_data.get("intensity", 5)
                existing_idea.position_x = position.get("x", 0)
                existing_idea.position_y = position.get("y", 0)
                existing_idea.size = idea_data.get("size", 120)
                existing_idea.in_storage = idea_data.get("inStorage", False)
            else:
                # Create new idea
                new_idea = IdeaModel(
                    id=idea_id,
                    profile_id=profile_id,
                    content=idea_data.get("content", ""),
                    intensity=idea_data.get("intensity", 5),
                    position_x=position.get("x", 0),
                    position_y=position.get("y", 0),
                    size=idea_data.get("size", 120),
                    in_storage=idea_data.get("inStorage", False),
                )
                db.add(new_idea)
        
        await db.commit()
        
        return {"status": "success", "synced_count": len(request.ideas)}
        
    except Exception as e:
        logger.error(f"Error syncing ideas: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_idea(
    request: IdeaAnalyzeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Analyze an idea using AI"""
    try:
        # Get agent system
        agent_system = get_agent_system()
        
        # Simple analysis (in production, use more sophisticated agent)
        analysis = {
            "category": "general",
            "themes": ["personal growth", "experience"],
            "connections": [],
            "suggestions": "Great start! Consider adding more specific details.",
        }
        
        # Update idea in database
        result = await db.execute(
            select(IdeaModel).where(IdeaModel.id == request.idea_id)
        )
        idea = result.scalar_one_or_none()
        
        if idea:
            idea.category = analysis["category"]
            idea.themes = json.dumps(analysis["themes"])
            idea.ai_suggestions = analysis["suggestions"]
            await db.commit()
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing idea: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{idea_id}/connections")
async def get_idea_connections(
    idea_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get connections for a specific idea"""
    try:
        result = await db.execute(
            select(IdeaModel).where(IdeaModel.id == idea_id)
        )
        idea = result.scalar_one_or_none()
        
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Parse connections from JSON
        connections = []
        if idea.connections:
            try:
                connections = json.loads(idea.connections)
            except:
                connections = []
        
        return connections
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=IdeasSummaryResponse)
async def get_ideas_summary(db: AsyncSession = Depends(get_db)):
    """Get summary of all ideas"""
    try:
        profile_id = "default"
        
        # Get all ideas
        result = await db.execute(
            select(IdeaModel).where(IdeaModel.profile_id == profile_id)
        )
        ideas = result.scalars().all()
        
        # Analyze themes
        all_themes = []
        for idea in ideas:
            if idea.themes:
                try:
                    themes = json.loads(idea.themes)
                    all_themes.extend(themes)
                except:
                    pass
        
        # Count themes
        theme_counts = {}
        for theme in all_themes:
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        main_themes = sorted(theme_counts.keys(), key=lambda x: theme_counts[x], reverse=True)[:5]
        
        return IdeasSummaryResponse(
            totalIdeas=len(ideas),
            mainThemes=main_themes,
            suggestedNarratives=[],
        )
        
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

