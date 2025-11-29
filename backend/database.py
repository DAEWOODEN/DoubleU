"""
Database configuration and models for ComChatX
Using SQLAlchemy with async support
"""

from datetime import datetime
from typing import AsyncGenerator
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    future=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


# Database Models

class UserProfile(Base):
    """User profile information"""
    __tablename__ = "user_profiles"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    target_universities = Column(String, nullable=False)
    target_major = Column(String, nullable=False)
    mbti = Column(String)
    skill = Column(String)
    hobby = Column(String)
    idol = Column(String)  # New field
    current_status = Column(String)  # New field
    budget = Column(String)  # New field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ideas = relationship("Idea", back_populates="profile", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="profile", cascade="all, delete-orphan")
    essays = relationship("Essay", back_populates="profile", cascade="all, delete-orphan")
    narrative_events = relationship("NarrativeEvent", back_populates="profile", cascade="all, delete-orphan")


class Idea(Base):
    """User ideas/thoughts"""
    __tablename__ = "ideas"
    
    id = Column(String, primary_key=True)
    profile_id = Column(String, ForeignKey("user_profiles.id"), default="default")
    content = Column(Text, nullable=False)
    intensity = Column(Integer, default=5)
    position_x = Column(Float)
    position_y = Column(Float)
    size = Column(Float)
    in_storage = Column(Boolean, default=False)
    
    # AI Analysis
    category = Column(String)
    themes = Column(JSON)  # List of themes
    connections = Column(JSON)  # List of related idea IDs
    ai_suggestions = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="ideas")


class Conversation(Base):
    """Conversation sessions"""
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True)
    profile_id = Column(String, ForeignKey("user_profiles.id"), default="default")
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Individual chat messages"""
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    agent_type = Column(String)  # 'guide', 'collector', 'analyzer', 'query', etc.
    related_ideas = Column(JSON)  # List of related idea IDs
    extra_data = Column(JSON)  # Additional metadata (renamed from metadata to avoid SQLAlchemy conflict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class NarrativeEvent(Base):
    """Timeline narrative events"""
    __tablename__ = "narrative_events"
    
    id = Column(String, primary_key=True)
    profile_id = Column(String, ForeignKey("user_profiles.id"), default="default")
    date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String)  # 'experience', 'insight', 'achievement', 'reflection'
    impact = Column(Integer, default=5)
    source_ideas = Column(JSON)  # List of idea IDs that contributed
    ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="narrative_events")


class Essay(Base):
    """Generated essays/personal statements"""
    __tablename__ = "essays"
    
    id = Column(String, primary_key=True)
    profile_id = Column(String, ForeignKey("user_profiles.id"), default="default")
    university = Column(String, nullable=False)
    version = Column(Integer, default=1)
    content = Column(Text, nullable=False)
    status = Column(String, default="draft")  # 'draft', 'reviewing', 'completed'
    word_count = Column(Integer, default=0)
    
    # Generation parameters
    generation_params = Column(JSON)  # Store generation settings
    
    # AI Feedback
    feedback_score = Column(Integer)
    feedback_strengths = Column(JSON)
    feedback_improvements = Column(JSON)
    feedback_suggestions = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="essays")


# Database session management

# Track initialization state per process
_db_initialized = False

async def ensure_db_initialized():
    """Ensure database tables exist - critical for Serverless environment"""
    global _db_initialized
    if _db_initialized:
        return

    try:
        # Check if tables exist by trying to query one
        async with engine.begin() as conn:
            # Using user_profiles as sentinel table
            # This will throw if table doesn't exist
            await conn.run_sync(Base.metadata.create_all)
            _db_initialized = True
            import logging
            logging.info("Database initialized in get_db dependency")
    except Exception as e:
        import logging
        logging.error(f"Database initialization check failed: {e}")
        # Try to force create again just in case
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except:
            pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session"""
    # Ensure DB is initialized before every session creation
    # This overhead is negligible after first run, but saves us in Serverless
    await ensure_db_initialized()
    
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database - create all tables"""
    global _db_initialized
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        _db_initialized = True
    except Exception as e:
        # Log error but don't fail - database might already exist
        import logging
        logging.warning(f"Database init warning: {e}")
        # Try to create tables anyway
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except:
            pass  # Ignore if tables already exist


async def close_db():
    """Close database connections"""
    await engine.dispose()

