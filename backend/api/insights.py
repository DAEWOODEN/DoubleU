"""
Insights API Routes - Cross-view Intelligence
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger
import json

from database import (
    get_db,
    Idea as IdeaModel,
    NarrativeEvent as NarrativeEventModel,
    Essay as EssayModel,
    ChatMessage as ChatMessageModel,
)
from .schemas import (
    InsightsResponse,
    ThemeCount,
    RelationshipMapResponse,
    RelationshipNode,
    RelationshipEdge,
)

router = APIRouter()


@router.get("", response_model=InsightsResponse)
async def get_insights(db: AsyncSession = Depends(get_db)):
    """Get cross-view insights"""
    try:
        profile_id = "default"
        
        # Get all ideas
        ideas_result = await db.execute(
            select(IdeaModel).where(IdeaModel.profile_id == profile_id)
        )
        ideas = ideas_result.scalars().all()
        
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
        
        idea_themes = [
            ThemeCount(theme=theme, count=count)
            for theme, count in sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        # Calculate essay readiness (0-100)
        ideas_count = len(ideas)
        
        # Get narrative events count
        narrative_result = await db.execute(
            select(func.count()).select_from(NarrativeEventModel).where(
                NarrativeEventModel.profile_id == profile_id
            )
        )
        narrative_count = narrative_result.scalar() or 0
        
        # Get conversation messages count
        messages_result = await db.execute(
            select(func.count()).select_from(ChatMessageModel)
        )
        messages_count = messages_result.scalar() or 0
        
        # Simple readiness calculation
        readiness = min(100, (ideas_count * 10) + (narrative_count * 5) + (messages_count * 2))
        
        # Generate growth trajectory
        if readiness < 30:
            trajectory = "Just getting started - continue exploring your experiences"
        elif readiness < 60:
            trajectory = "Building momentum - your narrative is taking shape"
        else:
            trajectory = "Well-developed - ready to craft compelling essays"
        
        # Determine next steps
        next_steps = []
        if ideas_count < 10:
            next_steps.append("Add more ideas to build a richer narrative")
        if narrative_count < 5:
            next_steps.append("Create timeline events to structure your story")
        if messages_count < 10:
            next_steps.append("Engage in more conversations to deepen insights")
        if not next_steps:
            next_steps.append("You're ready to generate your first personal statement!")
        
        return InsightsResponse(
            ideaThemes=idea_themes,
            growthTrajectory=trajectory,
            essayReadiness=readiness,
            nextSteps=next_steps,
        )
        
    except Exception as e:
        logger.error(f"Error getting insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/relationships", response_model=RelationshipMapResponse)
async def get_relationship_map(db: AsyncSession = Depends(get_db)):
    """Get relationship map between ideas, conversations, narratives, and essays"""
    try:
        profile_id = "default"
        
        nodes = []
        edges = []
        
        # Get ideas
        ideas_result = await db.execute(
            select(IdeaModel).where(IdeaModel.profile_id == profile_id)
        )
        ideas = ideas_result.scalars().all()
        
        for idea in ideas:
            nodes.append(
                RelationshipNode(
                    id=idea.id,
                    type="idea",
                    label=idea.content[:30] + "..." if len(idea.content) > 30 else idea.content,
                )
            )
            
            # Add connections between ideas
            if idea.connections:
                try:
                    connections = json.loads(idea.connections)
                    for conn_id in connections:
                        edges.append(
                            RelationshipEdge(
                                source=idea.id,
                                target=conn_id,
                                strength=5,
                            )
                        )
                except:
                    pass
        
        # Get narrative events
        narrative_result = await db.execute(
            select(NarrativeEventModel).where(NarrativeEventModel.profile_id == profile_id)
        )
        events = narrative_result.scalars().all()
        
        for event in events:
            nodes.append(
                RelationshipNode(
                    id=event.id,
                    type="narrative",
                    label=event.title,
                )
            )
            
            # Link to source ideas
            if event.source_ideas:
                try:
                    source_ids = json.loads(event.source_ideas)
                    for idea_id in source_ids:
                        edges.append(
                            RelationshipEdge(
                                source=idea_id,
                                target=event.id,
                                strength=8,
                            )
                        )
                except:
                    pass
        
        # Get essays
        essays_result = await db.execute(
            select(EssayModel).where(EssayModel.profile_id == profile_id)
        )
        essays = essays_result.scalars().all()
        
        for essay in essays:
            nodes.append(
                RelationshipNode(
                    id=essay.id,
                    type="essay",
                    label=f"{essay.university} Essay",
                )
            )
            
            # Link essays to narratives (simplified)
            for event in events:
                edges.append(
                    RelationshipEdge(
                        source=event.id,
                        target=essay.id,
                        strength=6,
                    )
                )
        
        return RelationshipMapResponse(
            nodes=nodes,
            edges=edges,
        )
        
    except Exception as e:
        logger.error(f"Error getting relationship map: {e}")
        raise HTTPException(status_code=500, detail=str(e))

