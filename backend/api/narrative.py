"""
Narrative API Routes - Timeline and Story Generation
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from loguru import logger
from typing import List
import json
from datetime import datetime

from database import get_db, NarrativeEvent as NarrativeEventModel, Idea as IdeaModel
from agents import get_agent_system
from llm_clients import get_deepseek_client
from .schemas import (
    NarrativeGenerateRequest,
    NarrativeEventResponse,
    NarrativeSuggestionsResponse,
    RoadmapRequest,
    RoadmapResponse,
    RoadmapStep,
)

router = APIRouter()


@router.post("/generate", response_model=List[NarrativeEventResponse])
async def generate_narrative(
    request: NarrativeGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate narrative timeline from ideas"""
    try:
        profile_id = "default"
        
        # Get ideas if requested
        ideas = []
        if request.use_ideas:
            result = await db.execute(
                select(IdeaModel).where(IdeaModel.profile_id == profile_id)
            )
            ideas_data = result.scalars().all()
            ideas = [
                {"id": idea.id, "content": idea.content, "intensity": idea.intensity}
                for idea in ideas_data
            ]
        
        # Get existing timeline events
        timeline_result = await db.execute(
            select(NarrativeEventModel).where(NarrativeEventModel.profile_id == profile_id)
        )
        existing_events = timeline_result.scalars().all()
        timeline_events = [
            {
                "id": event.id,
                "date": event.date,
                "title": event.title,
                "description": event.description,
                "category": event.category,
            }
            for event in existing_events
        ]
        
        # Generate narrative using AI
        agent_system = get_agent_system()
        narrative = await agent_system.generate_narrative(
            ideas=ideas,
            timeline_events=timeline_events,
        )
        
        # Create sample narrative events based on ideas
        # In production, this would be more sophisticated
        generated_events = []
        for i, idea in enumerate(ideas[:5]):  # Take top 5 ideas
            event = NarrativeEventModel(
                id=f"narrative_{datetime.utcnow().timestamp()}_{i}",
                profile_id=profile_id,
                date=datetime.utcnow().strftime("%Y-%m"),
                title=f"Key Moment: {idea['content'][:30]}...",
                description=idea['content'],
                category="experience",
                impact=idea.get('intensity', 5),
                source_ideas=json.dumps([idea['id']]),
                ai_generated=True,
            )
            db.add(event)
            generated_events.append(event)
        
        await db.commit()
        
        # Return all events
        all_events_result = await db.execute(
            select(NarrativeEventModel)
            .where(NarrativeEventModel.profile_id == profile_id)
            .order_by(NarrativeEventModel.date)
        )
        all_events = all_events_result.scalars().all()
        
        return [
            NarrativeEventResponse(
                id=event.id,
                date=event.date,
                title=event.title,
                description=event.description,
                category=event.category,
                impact=event.impact,
                expanded=False,
                sourceIdeas=json.loads(event.source_ideas) if event.source_ideas else None,
                aiGenerated=event.ai_generated,
            )
            for event in all_events
        ]
        
    except Exception as e:
        logger.error(f"Error generating narrative: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_narrative(
    events: List[dict],
    db: AsyncSession = Depends(get_db)
):
    """Save narrative events"""
    try:
        profile_id = "default"
        
        for event_data in events:
            event_id = event_data.get("id")
            
            # Check if exists
            result = await db.execute(
                select(NarrativeEventModel).where(NarrativeEventModel.id == event_id)
            )
            existing_event = result.scalar_one_or_none()
            
            if existing_event:
                # Update
                existing_event.date = event_data.get("date")
                existing_event.title = event_data.get("title")
                existing_event.description = event_data.get("description")
                existing_event.category = event_data.get("category")
                existing_event.impact = event_data.get("impact", 5)
            else:
                # Create
                new_event = NarrativeEventModel(
                    id=event_id,
                    profile_id=profile_id,
                    date=event_data.get("date"),
                    title=event_data.get("title"),
                    description=event_data.get("description"),
                    category=event_data.get("category"),
                    impact=event_data.get("impact", 5),
                )
                db.add(new_event)
        
        await db.commit()
        
        return {"status": "success", "saved_count": len(events)}
        
    except Exception as e:
        logger.error(f"Error saving narrative: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions", response_model=NarrativeSuggestionsResponse)
async def get_narrative_suggestions(db: AsyncSession = Depends(get_db)):
    """Get AI suggestions for narrative events"""
    try:
        profile_id = "default"
        
        # Get ideas
        ideas_result = await db.execute(
            select(IdeaModel).where(IdeaModel.profile_id == profile_id)
        )
        ideas = ideas_result.scalars().all()
        
        # Suggest events based on ideas
        suggested_events = []
        
        # Mock suggestions - in production, use AI
        missing_aspects = [
            "Academic challenges overcome",
            "Leadership experiences",
            "Community impact",
            "Personal growth moments",
        ]
        
        return NarrativeSuggestionsResponse(
            suggestedEvents=suggested_events,
            missingAspects=missing_aspects,
        )
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roadmap", response_model=RoadmapResponse)
async def generate_roadmap(request: RoadmapRequest):
    """Generate application roadmap based on university and major"""
    try:
        client = get_deepseek_client()
        
        prompt = f"""Generate a specific, high-quality 5-8 step application roadmap for a student applying to {request.university} for {request.major}.
        
        Focus on the specific requirements and competitive advantages for this specific program.
        Include a mix of:
        - Academic requirements (GPA, specific courses)
        - Standardized tests (SAT/ACT/GRE etc if applicable)
        - Extracurricular activities & Leadership
        - Application components (Essays, Recommendations)
        
        Return STRICT JSON format with this structure:
        {{
            "steps": [
                {{
                    "title": "Step Title",
                    "description": "Detailed description of what to do",
                    "category": "Academic" | "Test" | "Extracurricular" | "Application"
                }}
            ]
        }}
        """
        
        messages = [
            {"role": "system", "content": "You are an expert college admissions consultant. Output JSON only."},
            {"role": "user", "content": prompt}
        ]
        
        response = await client.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )
        
        content = response["choices"][0]["message"]["content"]
        
        # Clean up JSON if needed
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        data = json.loads(content)
        return RoadmapResponse(steps=data.get("steps", []))
        
    except Exception as e:
        logger.error(f"Error generating roadmap: {e}")
        # Fallback if LLM fails
        return RoadmapResponse(steps=[
            RoadmapStep(title="Academic Excellence", description="Maintain a high GPA particularly in major-related courses.", category="Academic"),
            RoadmapStep(title="Standardized Tests", description="Prepare for and take required standardized tests.", category="Test"),
            RoadmapStep(title="Extracurricular Depth", description="Demonstrate leadership and impact in activities.", category="Extracurricular"),
            RoadmapStep(title="Personal Statement", description="Draft a compelling narrative about your journey.", category="Application"),
        ])

