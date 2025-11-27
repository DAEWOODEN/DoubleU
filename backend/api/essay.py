"""
Essay API Routes - Personal Statement Generation
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from loguru import logger
from typing import List
import json
from datetime import datetime

from database import (
    get_db,
    Essay as EssayModel,
    Idea as IdeaModel,
    NarrativeEvent as NarrativeEventModel,
    ChatMessage as ChatMessageModel,
)
from agents import get_agent_system
from .schemas import (
    EssayGenerateRequest,
    EssayResponse,
    EssaySaveRequest,
    EssayFeedbackResponse,
)

router = APIRouter()


@router.post("/generate", response_model=EssayResponse)
async def generate_essay(
    request: EssayGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate personal statement essay"""
    try:
        profile_id = "default"
        
        # Gather context based on request
        ideas = []
        narrative = {}
        
        if request.use_ideas:
            ideas_result = await db.execute(
                select(IdeaModel).where(IdeaModel.profile_id == profile_id)
            )
            ideas_data = ideas_result.scalars().all()
            ideas = [
                {"id": idea.id, "content": idea.content, "intensity": idea.intensity}
                for idea in ideas_data
            ]
        
        if request.use_narrative:
            narrative_result = await db.execute(
                select(NarrativeEventModel).where(NarrativeEventModel.profile_id == profile_id)
            )
            events = narrative_result.scalars().all()
            narrative = {
                "events": [
                    {
                        "title": event.title,
                        "description": event.description,
                        "category": event.category,
                    }
                    for event in events
                ]
            }
        
        # Collect conversation history if requested
        conversations_context = []
        if request.use_conversations:
            from database import ChatMessage as ChatMessageModel
            conv_result = await db.execute(
                select(ChatMessageModel)
                .order_by(ChatMessageModel.timestamp.desc())
                .limit(20)
            )
            messages = conv_result.scalars().all()
            conversations_context = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
        
        # Generate essay using Multi-Agent system with full context
        agent_system = get_agent_system()
        
        # Ensure Major Agent exists for the target major
        if request.major and request.major.strip():
            # Create Major Agent if not exists (triggers during collection, but ensure it exists)
            await agent_system._create_major_agent_if_needed(
                request.major.strip(),
                user_profile=None  # Will use agent_system.user_profile
            )
        
        essay_content = await agent_system.generate_essay(
            university=request.university,
            major=request.major,
            word_limit=request.word_limit,
            narrative=narrative,
            key_ideas=ideas,
            conversations=conversations_context,
            style="storytelling",
        )
        
        # Calculate word count
        word_count = len(essay_content.split())
        
        # Save essay
        essay = EssayModel(
            id=f"essay_{datetime.utcnow().timestamp()}",
            profile_id=profile_id,
            university=request.university,
            version=1,
            content=essay_content,
            status="draft",
            word_count=word_count,
            generation_params=json.dumps({
                "word_limit": request.word_limit,
                "use_narrative": request.use_narrative,
                "use_ideas": request.use_ideas,
                "use_conversations": request.use_conversations,
            }),
        )
        
        db.add(essay)
        await db.commit()
        await db.refresh(essay)
        
        return EssayResponse(
            id=essay.id,
            university=essay.university,
            version=essay.version,
            content=essay.content,
            status=essay.status,
            wordCount=essay.word_count,
            createdAt=essay.created_at,
            updatedAt=essay.updated_at,
        )
        
    except Exception as e:
        logger.error(f"Error generating essay: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_essay(
    request: EssayGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Stream essay generation in real-time"""
    try:
        profile_id = "default"
        
        # Gather context
        ideas = []
        narrative = {}
        
        if request.use_ideas:
            ideas_result = await db.execute(
                select(IdeaModel).where(IdeaModel.profile_id == profile_id)
            )
            ideas_data = ideas_result.scalars().all()
            ideas = [
                {"id": idea.id, "content": idea.content, "intensity": idea.intensity}
                for idea in ideas_data
            ]
        
        if request.use_narrative:
            narrative_result = await db.execute(
                select(NarrativeEventModel).where(NarrativeEventModel.profile_id == profile_id)
            )
            events = narrative_result.scalars().all()
            narrative = {
                "events": [
                    {
                        "title": event.title,
                        "description": event.description,
                        "category": event.category,
                    }
                    for event in events
                ]
            }
        
        # Collect conversation history
        conversations_context = []
        if request.use_conversations:
            conv_result = await db.execute(
                select(ChatMessageModel)
                .order_by(ChatMessageModel.timestamp.desc())
                .limit(20)
            )
            messages = conv_result.scalars().all()
            conversations_context = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
        
        # Stream essay generation with full context
        agent_system = get_agent_system()
        
        # Ensure Major Agent exists for the target major
        if request.major and request.major.strip():
            # Create Major Agent if not exists
            await agent_system._create_major_agent_if_needed(
                request.major.strip(),
                user_profile=None  # Will use agent_system.user_profile
            )
        
        async def generate_stream():
            full_content = ""
            try:
                async for chunk in agent_system.stream_essay(
                    university=request.university,
                    major=request.major,
                    word_limit=request.word_limit,
                    narrative=narrative,
                    key_ideas=ideas,
                    conversations=conversations_context,
                    style="storytelling",
                ):
                    full_content += chunk
                    yield chunk
                
                # Save completed essay
                word_count = len(full_content.split())
                essay = EssayModel(
                    id=f"essay_{datetime.utcnow().timestamp()}",
                    profile_id=profile_id,
                    university=request.university,
                    version=1,
                    content=full_content,
                    status="draft",
                    word_count=word_count,
                )
                db.add(essay)
                await db.commit()
                
            except Exception as e:
                logger.error(f"Error in essay stream: {e}")
                yield f"\n\n[Error: {str(e)}]"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain"
        )
        
    except Exception as e:
        logger.error(f"Error streaming essay: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_essay(
    request: EssaySaveRequest,
    db: AsyncSession = Depends(get_db)
):
    """Save or update an essay"""
    try:
        # Check if essay exists
        result = await db.execute(
            select(EssayModel).where(EssayModel.id == request.id)
        )
        existing_essay = result.scalar_one_or_none()
        
        if existing_essay:
            # Update
            existing_essay.content = request.content
            existing_essay.word_count = request.word_count
            existing_essay.status = request.status
            existing_essay.version = request.version
            
            await db.commit()
            await db.refresh(existing_essay)
            
            return {"status": "updated", "id": existing_essay.id}
        else:
            # Create new
            new_essay = EssayModel(
                id=request.id,
                profile_id="default",
                university=request.university,
                version=request.version,
                content=request.content,
                status=request.status,
                word_count=request.word_count,
            )
            db.add(new_essay)
            await db.commit()
            
            return {"status": "created", "id": new_essay.id}
            
    except Exception as e:
        logger.error(f"Error saving essay: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{essay_id}/feedback", response_model=EssayFeedbackResponse)
async def get_essay_feedback(
    essay_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get AI feedback on an essay"""
    try:
        # Get essay
        result = await db.execute(
            select(EssayModel).where(EssayModel.id == essay_id)
        )
        essay = result.scalar_one_or_none()
        
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found")
        
        # Get feedback from Audit Agent
        agent_system = get_agent_system()
        # Get major from essay or user profile for Major Agent review
        major = None
        if essay_id:
            essay_result = await db.execute(
                select(EssayModel).where(EssayModel.id == essay_id)
            )
            essay = essay_result.scalar_one_or_none()
            if essay:
                # Try to extract major from generation params
                if essay.generation_params:
                    try:
                        params = json.loads(essay.generation_params)
                        # Major might be in params, but usually comes from request
                        pass
                    except:
                        pass
        
        # Get major from user profile as fallback
        from database import UserProfile as UserProfileModel
        profile_result = await db.execute(
            select(UserProfileModel).where(UserProfileModel.id == "default")
        )
        user_profile = profile_result.scalar_one_or_none()
        if user_profile and user_profile.target_major:
            major = user_profile.target_major
        
        feedback = await agent_system.audit_essay(
            essay_content=essay.content,
            university=essay.university,
            word_limit=essay.word_count,
            major=major,  # Pass major for Major Agent review
        )
        
        # Save feedback
        essay.feedback_score = feedback.get("overall_score", 75)
        essay.feedback_strengths = json.dumps(feedback.get("strengths", []))
        essay.feedback_improvements = json.dumps(feedback.get("improvements", []))
        essay.feedback_suggestions = feedback.get("suggestions", "")
        
        await db.commit()
        
        return EssayFeedbackResponse(
            overallScore=feedback.get("overall_score", 75),
            strengths=feedback.get("strengths", ["Well-structured", "Engaging narrative"]),
            improvements=feedback.get("improvements", ["Add more specific examples"]),
            suggestions=feedback.get("suggestions", "Consider adding more concrete details."),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=List[EssayResponse])
async def list_essays(db: AsyncSession = Depends(get_db)):
    """List all essays"""
    try:
        profile_id = "default"
        
        result = await db.execute(
            select(EssayModel).where(EssayModel.profile_id == profile_id)
        )
        essays = result.scalars().all()
        
        return [
            EssayResponse(
                id=essay.id,
                university=essay.university,
                version=essay.version,
                content=essay.content,
                status=essay.status,
                wordCount=essay.word_count,
                createdAt=essay.created_at,
                updatedAt=essay.updated_at,
            )
            for essay in essays
        ]
        
    except Exception as e:
        logger.error(f"Error listing essays: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{essay_id}")
async def delete_essay(
    essay_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an essay"""
    try:
        result = await db.execute(
            select(EssayModel).where(EssayModel.id == essay_id)
        )
        essay = result.scalar_one_or_none()
        
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found")
        
        await db.execute(
            delete(EssayModel).where(EssayModel.id == essay_id)
        )
        await db.commit()
        
        return {"status": "deleted", "id": essay_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting essay: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

