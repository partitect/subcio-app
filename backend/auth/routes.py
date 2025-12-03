"""
Authentication API routes.
"""
import os
import httpx
from datetime import datetime
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

# Rate Limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

from .database import (
    get_db, 
    get_user_by_email, 
    create_user, 
    update_user_login,
    create_or_update_oauth_user
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
    OAuthUserInfo,
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

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
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
@limiter.limit("10/minute")
async def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
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
    
    # Check if user has password (OAuth users don't)
    if not user.password_hash:
        oauth_provider = user.oauth_provider or "OAuth"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {oauth_provider} login. Please use the {oauth_provider} button to sign in."
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
    # Check if user has password (OAuth users don't have password initially)
    if not current_user.password_hash:
        # OAuth users can set a password for the first time
        current_user.password_hash = get_password_hash(password_data.new_password)
        current_user.updated_at = datetime.utcnow()
        db.commit()
        return {"message": "Password set successfully"}
    
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
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: PasswordReset, db: Session = Depends(get_db)):
    """
    Request password reset email.
    Always returns success to prevent email enumeration.
    """
    user = get_user_by_email(db, data.email)
    
    if user:
        # In production, send email with reset link
        reset_token = create_password_reset_token(data.email)
        # TODO: Implement email sending with SendGrid/SMTP
        # Email should contain: f"{FRONTEND_URL}/reset-password?token={reset_token}"
        # For development, token is logged (check APP_ENV)
        if os.getenv("APP_ENV") != "production":
            import logging
            logging.getLogger("auth").debug(f"Password reset token generated for {data.email}")
    
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


# ==================== OAuth Routes ====================

@router.get("/oauth/google")
async def google_oauth_redirect():
    """
    Redirect to Google OAuth consent screen.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{FRONTEND_URL}/auth/callback/google",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=google_auth_url)


@router.post("/oauth/google/callback")
async def google_oauth_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth callback and exchange code for tokens.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{FRONTEND_URL}/auth/callback/google"
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info from Google
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google"
                )
            
            userinfo = userinfo_response.json()
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to Google: {str(e)}"
        )
    
    # Create or update user
    user, is_new = create_or_update_oauth_user(
        db=db,
        provider="google",
        provider_id=userinfo.get("id"),
        email=userinfo.get("email"),
        name=userinfo.get("name"),
        avatar_url=userinfo.get("picture")
    )
    
    # Generate JWT tokens
    jwt_access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    jwt_refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return Token(
        access_token=jwt_access_token,
        refresh_token=jwt_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/oauth/github")
async def github_oauth_redirect():
    """
    Redirect to GitHub OAuth consent screen.
    """
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured"
        )
    
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": f"{FRONTEND_URL}/auth/callback/github",
        "scope": "user:email read:user"
    }
    
    github_auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(url=github_auth_url)


@router.post("/oauth/github/callback")
async def github_oauth_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Handle GitHub OAuth callback and exchange code for tokens.
    """
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code
                },
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            if not access_token:
                error = tokens.get("error_description", "Unknown error")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub OAuth error: {error}"
                )
            
            # Get user info from GitHub
            userinfo_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if userinfo_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from GitHub"
                )
            
            userinfo = userinfo_response.json()
            
            # GitHub might not return email in user endpoint, need to fetch separately
            email = userinfo.get("email")
            if not email:
                emails_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    # Get primary email
                    for e in emails:
                        if e.get("primary") and e.get("verified"):
                            email = e.get("email")
                            break
                    
                    # Fallback to first verified email
                    if not email:
                        for e in emails:
                            if e.get("verified"):
                                email = e.get("email")
                                break
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not retrieve email from GitHub. Please ensure your email is public or verified."
                )
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to GitHub: {str(e)}"
        )
    
    # Create or update user
    user, is_new = create_or_update_oauth_user(
        db=db,
        provider="github",
        provider_id=str(userinfo.get("id")),
        email=email,
        name=userinfo.get("name") or userinfo.get("login"),
        avatar_url=userinfo.get("avatar_url")
    )
    
    # Generate JWT tokens
    jwt_access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    jwt_refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return Token(
        access_token=jwt_access_token,
        refresh_token=jwt_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/oauth/providers")
async def get_oauth_providers():
    """
    Get available OAuth providers and their configuration status.
    """
    return {
        "providers": {
            "google": {
                "enabled": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
                "name": "Google"
            },
            "github": {
                "enabled": bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET),
                "name": "GitHub"
            }
        }
    }
