"""
Chat API Routes - Multi-Agent Conversation Interface
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from loguru import logger
from typing import List
import json
from datetime import datetime

from database import get_db, Conversation, ChatMessage as ChatMessageModel, Idea as IdeaModel, UserProfile as UserProfileModel
from agents import get_agent_system
from .schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    SocraticQuestionRequest,
)

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    """Send a message and get AI response"""
    try:
        profile_id = "default"
        conversation_id = request.conversation_id or "main-conversation"
        
        # Get or create conversation
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            conversation = Conversation(
                id=conversation_id,
                profile_id=profile_id,
                title="Main Conversation"
            )
            db.add(conversation)
            await db.commit()
        
        # Save user message
        user_message = ChatMessageModel(
            id=f"msg_{datetime.utcnow().timestamp()}",
            conversation_id=conversation_id,
            role="user",
            content=request.message,
            timestamp=datetime.utcnow(),
        )
        db.add(user_message)
        await db.commit()
        
        # Get user context (recent ideas)
        ideas_result = await db.execute(
            select(IdeaModel)
            .where(IdeaModel.profile_id == profile_id)
            .order_by(desc(IdeaModel.created_at))
            .limit(10)
        )
        recent_ideas = ideas_result.scalars().all()
        
        # Get user profile
        profile_result = await db.execute(
            select(UserProfileModel).where(UserProfileModel.id == profile_id)
        )
        user_profile = profile_result.scalar_one_or_none()
        
        user_context = {
            "recent_ideas": [{"id": idea.id, "content": idea.content} for idea in recent_ideas],
            "profile": {
                "targetUniversities": user_profile.target_universities if user_profile else "",
                "targetMajor": user_profile.target_major if user_profile else "",
                "name": user_profile.name if user_profile else "",
                "mbti": user_profile.mbti if user_profile else "",
                "skill": user_profile.skill if user_profile else "",
                "hobby": user_profile.hobby if user_profile else "",
            } if user_profile else {}
        }
        
        # Process message through Multi-Agent system
        agent_system = get_agent_system()
        response_data = await agent_system.process_user_message(
            message=request.message,
            conversation_id=conversation_id,
            user_context=user_context,
        )
        
        # Save AI response
        ai_message = ChatMessageModel(
            id=f"msg_{datetime.utcnow().timestamp()}_ai",
            conversation_id=conversation_id,
            role="assistant",
            content=response_data["content"],
            agent_type=response_data.get("agent_type"),
            timestamp=datetime.utcnow(),
        )
        db.add(ai_message)
        await db.commit()
        
        return ChatMessageResponse(
            id=ai_message.id,
            role=ai_message.role,
            content=ai_message.content,
            timestamp=ai_message.timestamp,
            agentType=ai_message.agent_type,
            relatedIdeas=None,
        )
        
    except Exception as e:
        logger.error(f"Error in send_message: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_message(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    """Stream AI response in real-time"""
    try:
        profile_id = "default"
        conversation_id = request.conversation_id or "main-conversation"
        
        # Get or create conversation
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            conversation = Conversation(
                id=conversation_id,
                profile_id=profile_id,
                title="Main Conversation"
            )
            db.add(conversation)
            await db.commit()
        
        # Save user message
        user_message = ChatMessageModel(
            id=f"msg_{datetime.utcnow().timestamp()}",
            conversation_id=conversation_id,
            role="user",
            content=request.message,
            timestamp=datetime.utcnow(),
        )
        db.add(user_message)
        await db.commit()
        
        # Get agent system
        agent_system = get_agent_system()
        
        # Stream response
        async def generate_stream():
            full_response = ""
            try:
                async for chunk in agent_system.stream_user_message(
                    message=request.message,
                    conversation_id=conversation_id,
                ):
                    full_response += chunk
                    # Send as SSE format
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                
                # Save complete response
                ai_message = ChatMessageModel(
                    id=f"msg_{datetime.utcnow().timestamp()}_ai",
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_response,
                    agent_type="guide",
                    timestamp=datetime.utcnow(),
                )
                db.add(ai_message)
                await db.commit()
                
                # Send completion signal
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                logger.error(f"Error in stream: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"Error in stream_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{conversation_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get conversation history"""
    try:
        result = await db.execute(
            select(ChatMessageModel)
            .where(ChatMessageModel.conversation_id == conversation_id)
            .order_by(ChatMessageModel.timestamp)
        )
        messages = result.scalars().all()
        
        return [
            ChatMessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp,
                agentType=msg.agent_type,
                relatedIdeas=json.loads(msg.related_ideas) if msg.related_ideas else None,
            )
            for msg in messages
        ]
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/socratic")
async def request_socratic_question(
    request: SocraticQuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request a Socratic question from the system"""
    try:
        profile_id = "default"
        
        # Get user profile
        profile_result = await db.execute(
            select(UserProfileModel).where(UserProfileModel.id == profile_id)
        )
        user_profile = profile_result.scalar_one_or_none()
        
        # Update agent system with profile
        agent_system = get_agent_system()
        if user_profile:
            agent_system.user_profile = {
                "profile": {
                    "targetUniversities": user_profile.target_universities,
                    "targetMajor": user_profile.target_major,
                    "name": user_profile.name,
                    "mbti": user_profile.mbti,
                    "skill": user_profile.skill,
                    "hobby": user_profile.hobby,
                }
            }
        
        question = await agent_system.request_socratic_question(
            recent_ideas=request.recent_ideas or [],
            conversation_history=request.conversation_history or [],
        )
        
        # Ensure we always return a valid question - use diverse fallbacks
        if not question or not question.strip():
            import random
            conversation_length = len(request.conversation_history or [])
            if conversation_length < 3:
                fallbacks = [
                    "What's a moment from the past week that stuck with you?",
                    "Tell me about something that surprised you recently.",
                    "What's been on your mind lately?",
                    "Can you share a recent experience that felt meaningful?",
                ]
                question = random.choice(fallbacks)
            elif conversation_length < 8:
                fallbacks = [
                    "That's interesting. What details stood out to you most?",
                    "I'm curious - what made that experience significant for you?",
                    "Can you describe what that moment felt like?",
                    "What thoughts came to mind during that experience?",
                ]
                question = random.choice(fallbacks)
            else:
                fallbacks = [
                    "How do you see these experiences connecting to your future?",
                    "What patterns do you notice across these moments?",
                    "How have these experiences shaped who you are?",
                    "What do these experiences tell you about your values?",
                ]
                question = random.choice(fallbacks)
        
        return {"question": question}
        
    except Exception as e:
        logger.error(f"Error generating Socratic question: {e}", exc_info=True)
        # Return diverse fallback instead of raising error
        import random
        conversation_length = len(request.conversation_history or []) if hasattr(request, 'conversation_history') else 0
        if conversation_length < 3:
            fallbacks = [
                "What's a moment from the past week that stuck with you?",
                "Tell me about something that surprised you recently.",
                "What's been on your mind lately?",
                "Can you share a recent experience that felt meaningful?",
            ]
            fallback = random.choice(fallbacks)
        elif conversation_length < 8:
            fallbacks = [
                "That's interesting. What details stood out to you most?",
                "I'm curious - what made that experience significant for you?",
                "Can you describe what that moment felt like?",
                "What thoughts came to mind during that experience?",
            ]
            fallback = random.choice(fallbacks)
        else:
            fallbacks = [
                "How do you see these experiences connecting to your future?",
                "What patterns do you notice across these moments?",
                "How have these experiences shaped who you are?",
                "What do these experiences tell you about your values?",
            ]
            fallback = random.choice(fallbacks)
        return {"question": fallback}

