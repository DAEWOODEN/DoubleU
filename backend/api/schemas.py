"""
Pydantic Schemas for API Request/Response models
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Profile Schemas

class UserProfileCreate(BaseModel):
    target_universities: str = Field(..., alias="targetUniversities")
    target_major: str = Field(..., alias="targetMajor")
    name: str
    mbti: Optional[str] = None
    skill: Optional[str] = None
    hobby: Optional[str] = None
    
    class Config:
        populate_by_name = True


class UserProfileResponse(BaseModel):
    id: str
    target_universities: str = Field(..., alias="targetUniversities")
    target_major: str = Field(..., alias="targetMajor")
    name: str
    mbti: Optional[str] = None
    skill: Optional[str] = None
    hobby: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True


# Idea Schemas

class IdeaPosition(BaseModel):
    x: float
    y: float


class IdeaVelocity(BaseModel):
    x: float
    y: float


class IdeaAnalysis(BaseModel):
    category: str
    themes: List[str]
    connections: List[str]
    suggestions: str


class IdeaCreate(BaseModel):
    content: str
    intensity: int = 5
    position: IdeaPosition
    size: float = 120
    in_storage: bool = Field(False, alias="inStorage")
    
    class Config:
        populate_by_name = True


class IdeaResponse(BaseModel):
    id: str
    content: str
    intensity: int
    position: IdeaPosition
    size: float
    velocity: IdeaVelocity
    in_storage: bool = Field(..., alias="inStorage")
    ai_analysis: Optional[IdeaAnalysis] = Field(None, alias="aiAnalysis")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True


class IdeasSyncRequest(BaseModel):
    ideas: List[Dict[str, Any]]


class IdeaAnalyzeRequest(BaseModel):
    idea_id: str = Field(..., alias="ideaId")
    content: str
    
    class Config:
        populate_by_name = True


class IdeasSummaryResponse(BaseModel):
    total_ideas: int = Field(..., alias="totalIdeas")
    main_themes: List[str] = Field(..., alias="mainThemes")
    suggested_narratives: List[Any] = Field(..., alias="suggestedNarratives")
    
    class Config:
        populate_by_name = True


# Chat Schemas

class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    
    class Config:
        populate_by_name = True


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime
    agent_type: Optional[str] = Field(None, alias="agentType")
    related_ideas: Optional[List[str]] = Field(None, alias="relatedIdeas")
    
    class Config:
        populate_by_name = True


class SocraticQuestionRequest(BaseModel):
    recent_ideas: List[str] = Field(..., alias="recentIdeas")
    conversation_history: List[Dict[str, Any]] = Field(..., alias="conversationHistory")
    
    class Config:
        populate_by_name = True


# Narrative Schemas

class NarrativeGenerateRequest(BaseModel):
    use_ideas: bool = Field(True, alias="useIdeas")
    use_conversations: bool = Field(True, alias="useConversations")
    target_length: Optional[int] = Field(None, alias="targetLength")
    
    class Config:
        populate_by_name = True


class NarrativeEventResponse(BaseModel):
    id: str
    date: str
    title: str
    description: str
    category: str
    impact: int
    expanded: bool = False
    source_ideas: Optional[List[str]] = Field(None, alias="sourceIdeas")
    ai_generated: bool = Field(False, alias="aiGenerated")
    
    class Config:
        populate_by_name = True


class NarrativeSuggestionsResponse(BaseModel):
    suggested_events: List[NarrativeEventResponse] = Field(..., alias="suggestedEvents")
    missing_aspects: List[str] = Field(..., alias="missingAspects")
    
    class Config:
        populate_by_name = True


# Essay Schemas

class EssayGenerateRequest(BaseModel):
    university: str
    major: str = ""
    word_limit: int = Field(..., alias="wordLimit")
    use_narrative: bool = Field(True, alias="useNarrative")
    use_ideas: bool = Field(True, alias="useIdeas")
    use_conversations: bool = Field(True, alias="useConversations")
    
    class Config:
        populate_by_name = True


class EssayResponse(BaseModel):
    id: str
    university: str
    version: int
    content: str
    status: str
    word_count: int = Field(..., alias="wordCount")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    feedback: Optional[str] = None
    
    class Config:
        populate_by_name = True


class EssaySaveRequest(BaseModel):
    id: str
    university: str
    version: int
    content: str
    status: str
    word_count: int = Field(..., alias="wordCount")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
    
    class Config:
        populate_by_name = True


class EssayFeedbackResponse(BaseModel):
    overall_score: int = Field(..., alias="overallScore")
    strengths: List[str]
    improvements: List[str]
    suggestions: str
    
    class Config:
        populate_by_name = True


# Insights Schemas

class ThemeCount(BaseModel):
    theme: str
    count: int


class InsightsResponse(BaseModel):
    idea_themes: List[ThemeCount] = Field(..., alias="ideaThemes")
    growth_trajectory: str = Field(..., alias="growthTrajectory")
    essay_readiness: int = Field(..., alias="essayReadiness")
    next_steps: List[str] = Field(..., alias="nextSteps")
    
    class Config:
        populate_by_name = True


class RelationshipNode(BaseModel):
    id: str
    type: str
    label: str


class RelationshipEdge(BaseModel):
    source: str
    target: str
    strength: int


class RelationshipMapResponse(BaseModel):
    nodes: List[RelationshipNode]
    edges: List[RelationshipEdge]

