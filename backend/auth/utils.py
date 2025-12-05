"""
Authentication utilities for Electron Desktop Mode.
Always returns mock admin user - no external authentication required.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db, get_user_by_id
from .models import TokenData

# Security configuration
SECRET_KEY = "desktop-mode-secret-key-not-used"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()


# Desktop mock user class
class DesktopUser:
    """Mock admin user for Electron desktop mode"""
    id = 1
    email = "desktop@subcio.local"
    name = "Desktop User"
    role = "admin"
    is_active = True
    subscription_status = "premium"
    credits = 999999


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    truncated = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt (max 72 bytes)"""
    truncated = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(truncated)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != token_type:
            return None
        
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
        
        return TokenData(user_id=int(user_id), email=email)
        
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency to get current authenticated user.
    In Electron desktop mode, always returns a mock admin user.
    """
    # Desktop mode - always return mock admin user
    return DesktopUser()


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
):
    """
    Optional authentication - always returns mock admin user in desktop mode.
    """
    # Desktop mode - always return mock admin user
    return DesktopUser()


def create_password_reset_token(email: str) -> str:
    """Create a password reset token valid for 1 hour"""
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode = {
        "email": email,
        "exp": expire,
        "type": "password_reset"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email if valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "password_reset":
            return None
        
        return payload.get("email")
        
    except JWTError:
        return None
