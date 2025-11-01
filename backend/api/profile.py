"""
User Profile API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from database import get_db, UserProfile as UserProfileModel
from .schemas import UserProfileCreate, UserProfileResponse

router = APIRouter()


@router.post("", response_model=UserProfileResponse)
async def create_or_update_profile(
    profile: UserProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create or update user profile"""
    try:
        # Use 'default' as the profile ID for now (single user)
        profile_id = "default"
        
        # Check if profile exists
        result = await db.execute(
            select(UserProfileModel).where(UserProfileModel.id == profile_id)
        )
        existing_profile = result.scalar_one_or_none()
        
        if existing_profile:
            # Update existing profile
            existing_profile.name = profile.name
            existing_profile.target_universities = profile.target_universities
            existing_profile.target_major = profile.target_major
            existing_profile.mbti = profile.mbti
            existing_profile.skill = profile.skill
            existing_profile.hobby = profile.hobby
            
            await db.commit()
            await db.refresh(existing_profile)
            
            return UserProfileResponse(
                id=existing_profile.id,
                targetUniversities=existing_profile.target_universities,
                targetMajor=existing_profile.target_major,
                name=existing_profile.name,
                mbti=existing_profile.mbti,
                skill=existing_profile.skill,
                hobby=existing_profile.hobby,
                createdAt=existing_profile.created_at,
                updatedAt=existing_profile.updated_at,
            )
        else:
            # Create new profile
            new_profile = UserProfileModel(
                id=profile_id,
                name=profile.name,
                target_universities=profile.target_universities,
                target_major=profile.target_major,
                mbti=profile.mbti,
                skill=profile.skill,
                hobby=profile.hobby,
            )
            
            db.add(new_profile)
            await db.commit()
            await db.refresh(new_profile)
            
            return UserProfileResponse(
                id=new_profile.id,
                targetUniversities=new_profile.target_universities,
                targetMajor=new_profile.target_major,
                name=new_profile.name,
                mbti=new_profile.mbti,
                skill=new_profile.skill,
                hobby=new_profile.hobby,
                createdAt=new_profile.created_at,
                updatedAt=new_profile.updated_at,
            )
            
    except Exception as e:
        logger.error(f"Error creating/updating profile: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=UserProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_db)):
    """Get user profile"""
    try:
        profile_id = "default"
        
        result = await db.execute(
            select(UserProfileModel).where(UserProfileModel.id == profile_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return UserProfileResponse(
            id=profile.id,
            targetUniversities=profile.target_universities,
            targetMajor=profile.target_major,
            name=profile.name,
            mbti=profile.mbti,
            skill=profile.skill,
            hobby=profile.hobby,
            createdAt=profile.created_at,
            updatedAt=profile.updated_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

