"""
User models and Pydantic schemas for authentication.
"""
from datetime import datetime
from typing import Optional
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class SubscriptionPlan(str, Enum):
    """Available subscription plans"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    UNLIMITED = "unlimited"


class User(Base):
    """SQLAlchemy User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth users
    name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)  # Profile picture from OAuth
    
    # OAuth provider info
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'github', or None
    oauth_id = Column(String(255), nullable=True)  # Provider's user ID
    
    # Subscription & Usage
    plan = Column(String(20), default=SubscriptionPlan.FREE.value)
    monthly_minutes_used = Column(Float, default=0.0)
    monthly_exports_used = Column(Integer, default=0)
    storage_used_mb = Column(Float, default=0.0)
    
    # Limits based on plan (stored for quick access)
    monthly_minutes_limit = Column(Float, default=30.0)  # Free plan default
    monthly_exports_limit = Column(Integer, default=5)    # Free plan default
    storage_limit_mb = Column(Float, default=500.0)       # Free plan default
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Subscription dates
    subscription_started_at = Column(DateTime, nullable=True)
    subscription_ends_at = Column(DateTime, nullable=True)
    
    # Stripe/Payment
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "oauth_provider": self.oauth_provider,
            "plan": self.plan,
            "monthly_minutes_used": self.monthly_minutes_used,
            "monthly_exports_used": self.monthly_exports_used,
            "storage_used_mb": self.storage_used_mb,
            "monthly_minutes_limit": self.monthly_minutes_limit,
            "monthly_exports_limit": self.monthly_exports_limit,
            "storage_limit_mb": self.storage_limit_mb,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


# Pydantic Schemas
class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)"""
    id: int
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    oauth_provider: Optional[str]
    plan: str
    monthly_minutes_used: float
    monthly_exports_used: int
    storage_used_mb: float
    monthly_minutes_limit: float
    monthly_exports_limit: int
    storage_limit_mb: float
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class OAuthUserInfo(BaseModel):
    """OAuth user info from provider"""
    provider: str  # 'google' or 'github'
    provider_id: str
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenData(BaseModel):
    """Data extracted from JWT"""
    user_id: Optional[int] = None
    email: Optional[str] = None


class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


# Plan limits configuration - Simplified video-count based model
PLAN_LIMITS = {
    SubscriptionPlan.FREE: {
        "videos_per_month": 3,
        "max_video_length_minutes": 3,
        "storage_mb": 1000,  # 1 GB
        "resolution": "720p",
        "watermark": True,
        "priority_processing": False,
        "custom_presets": False,
        "api_access": False,
    },
    SubscriptionPlan.STARTER: {
        "videos_per_month": 15,
        "max_video_length_minutes": 10,
        "storage_mb": 10000,  # 10 GB
        "resolution": "1080p",
        "watermark": False,
        "priority_processing": False,
        "custom_presets": False,
        "api_access": False,
    },
    SubscriptionPlan.PRO: {
        "videos_per_month": 50,
        "max_video_length_minutes": 30,
        "storage_mb": 50000,  # 50 GB
        "resolution": "4K",
        "watermark": False,
        "priority_processing": True,
        "custom_presets": True,
        "api_access": True,
    },
    SubscriptionPlan.UNLIMITED: {
        "videos_per_month": float('inf'),  # Unlimited
        "max_video_length_minutes": float('inf'),  # Unlimited
        "storage_mb": 200000,  # 200 GB
        "resolution": "4K",
        "watermark": False,
        "priority_processing": True,
        "custom_presets": True,
        "api_access": True,
    },
}


def get_plan_limits(plan: str) -> dict:
    """Get limits for a specific plan"""
    try:
        plan_enum = SubscriptionPlan(plan)
        return PLAN_LIMITS.get(plan_enum, PLAN_LIMITS[SubscriptionPlan.FREE])
    except ValueError:
        return PLAN_LIMITS[SubscriptionPlan.FREE]
