"""
Authentication API routes.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .database import (
    get_db, 
    get_user_by_email, 
    create_user, 
    update_user_login
)
from .models import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    UserUpdate,
    PasswordChange,
    Token, 
    PasswordReset,
    PasswordResetConfirm,
    get_plan_limits
)
from .utils import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    verify_token,
    get_current_user,
    create_password_reset_token,
    verify_password_reset_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **name**: Optional display name
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    password_hash = get_password_hash(user_data.password)
    user = create_user(
        db=db,
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name
    )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT tokens.
    
    - **email**: Registered email address
    - **password**: User's password
    """
    # Find user
    user = get_user_by_email(db, user_data.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Update last login
    update_user_login(db, user)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=Token)
async def refresh_tokens(refresh_token: str, db: Session = Depends(get_db)):
    """
    Refresh access token using a valid refresh token.
    """
    token_data = verify_token(refresh_token, "refresh")
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user
    from .database import get_user_by_id
    user = get_user_by_id(db, token_data.user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new tokens
    new_access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    Requires valid access token.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    """
    # Update fields if provided
    if update_data.name is not None:
        current_user.name = update_data.name
    
    if update_data.email is not None and update_data.email != current_user.email:
        # Check if new email is already taken
        existing = get_user_by_email(db, update_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = update_data.email
        current_user.is_verified = False  # Require re-verification
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password.
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(data: PasswordReset, db: Session = Depends(get_db)):
    """
    Request password reset email.
    Always returns success to prevent email enumeration.
    """
    user = get_user_by_email(db, data.email)
    
    if user:
        # In production, send email with reset link
        reset_token = create_password_reset_token(data.email)
        # TODO: Send email with reset_token
        # For now, just print it (remove in production!)
        print(f"[DEBUG] Password reset token for {data.email}: {reset_token}")
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Reset password using reset token.
    """
    email = verify_password_reset_token(data.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = get_user_by_email(db, email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = get_password_hash(data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.get("/usage")
async def get_usage_stats(current_user = Depends(get_current_user)):
    """
    Get current user's usage statistics and limits.
    """
    limits = get_plan_limits(current_user.plan)
    
    return {
        "plan": current_user.plan,
        "usage": {
            "minutes_used": current_user.monthly_minutes_used,
            "minutes_limit": current_user.monthly_minutes_limit,
            "minutes_remaining": max(0, current_user.monthly_minutes_limit - current_user.monthly_minutes_used),
            "exports_used": current_user.monthly_exports_used,
            "exports_limit": current_user.monthly_exports_limit,
            "exports_remaining": max(0, current_user.monthly_exports_limit - current_user.monthly_exports_used),
            "storage_used_mb": current_user.storage_used_mb,
            "storage_limit_mb": current_user.storage_limit_mb,
            "storage_remaining_mb": max(0, current_user.storage_limit_mb - current_user.storage_used_mb),
        },
        "features": {
            "watermark": limits.get("watermark", True),
            "priority_processing": limits.get("priority_processing", False),
            "max_video_length_minutes": limits.get("max_video_length_minutes", 5),
        }
    }


@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """
    Logout current user.
    In a stateless JWT setup, this is mainly for client-side token removal.
    For full logout, implement token blacklisting.
    """
    # TODO: Implement token blacklisting if needed
    return {"message": "Logged out successfully"}
