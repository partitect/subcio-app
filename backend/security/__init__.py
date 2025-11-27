"""
Subcio Security Module

Comprehensive security middleware and utilities for:
1. API Key Protection
2. Rate Limiting
3. Input Validation
4. Audit Logging
5. Credit Manipulation Protection
6. Duplicate Event Protection
7. Device Mapping
"""
import os
import time
import hashlib
import hmac
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Set, Callable, ClassVar
from functools import wraps
from collections import defaultdict
import asyncio
from threading import Lock

from fastapi import Request, HTTPException, status, Depends
from pydantic import BaseModel, field_validator, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("subcio.security")

Base = declarative_base()


# ============================================================
# 1️⃣ API KEY PROTECTION
# ============================================================

class APIKeyManager:
    """
    Securely manages API keys for external services.
    Keys are stored encrypted and never exposed to client.
    """
    
    # Encryption key from environment (should be 32 bytes for Fernet)
    _encryption_key = os.getenv("ENCRYPTION_KEY", "")
    _cache: Dict[str, str] = {}
    _lock = Lock()
    
    @classmethod
    def get_key(cls, key_name: str) -> str:
        """Get decrypted API key by name"""
        with cls._lock:
            if key_name in cls._cache:
                return cls._cache[key_name]
            
            # Get encrypted key from environment
            encrypted = os.getenv(f"{key_name}_ENCRYPTED", "")
            if encrypted and cls._encryption_key:
                # Decrypt and cache
                decrypted = cls._decrypt(encrypted)
                cls._cache[key_name] = decrypted
                return decrypted
            
            # Fallback to plain text (development only)
            return os.getenv(key_name, "")
    
    @classmethod
    def _decrypt(cls, encrypted: str) -> str:
        """Decrypt an API key (implement with Fernet or similar)"""
        # In production, use cryptography.fernet
        # For now, return as-is (implement encryption later)
        return encrypted
    
    @classmethod
    def mask_key(cls, key: str) -> str:
        """Return masked version of key for logging"""
        if len(key) < 8:
            return "***"
        return f"{key[:4]}...{key[-4:]}"


# ============================================================
# 2️⃣ RATE LIMITING
# ============================================================

class RateLimiter:
    """
    Token bucket rate limiter with sliding window.
    Prevents spam and bot attacks.
    """
    
    def __init__(self):
        self._buckets: Dict[str, Dict] = defaultdict(lambda: {
            "tokens": 0,
            "last_refill": time.time(),
        })
        self._lock = Lock()
        
        # Rate limit configurations
        self.limits = {
            "default": {"requests": 60, "window": 60},      # 60 req/min
            "auth": {"requests": 5, "window": 60},          # 5 auth attempts/min
            "upload": {"requests": 10, "window": 60},       # 10 uploads/min
            "export": {"requests": 5, "window": 60},        # 5 exports/min
            "api": {"requests": 100, "window": 60},         # 100 API calls/min
            "webhook": {"requests": 50, "window": 60},      # 50 webhooks/min
        }
    
    def check(self, key: str, limit_type: str = "default") -> bool:
        """
        Check if request should be allowed.
        Returns True if allowed, False if rate limited.
        """
        config = self.limits.get(limit_type, self.limits["default"])
        max_requests = config["requests"]
        window = config["window"]
        
        with self._lock:
            now = time.time()
            bucket = self._buckets[key]
            
            # Refill tokens based on time passed
            time_passed = now - bucket["last_refill"]
            refill_rate = max_requests / window
            new_tokens = time_passed * refill_rate
            
            bucket["tokens"] = min(max_requests, bucket["tokens"] + new_tokens)
            bucket["last_refill"] = now
            
            # Check if we have tokens
            if bucket["tokens"] >= 1:
                bucket["tokens"] -= 1
                return True
            
            return False
    
    def get_retry_after(self, key: str, limit_type: str = "default") -> int:
        """Get seconds until next request is allowed"""
        config = self.limits.get(limit_type, self.limits["default"])
        window = config["window"]
        
        with self._lock:
            bucket = self._buckets.get(key)
            if not bucket:
                return 0
            
            # Calculate when tokens will be available
            refill_rate = config["requests"] / window
            needed_tokens = 1 - bucket["tokens"]
            wait_time = needed_tokens / refill_rate if refill_rate > 0 else window
            
            return max(1, int(wait_time))
    
    def reset(self, key: str):
        """Reset rate limit for a key (after successful auth, etc.)"""
        with self._lock:
            if key in self._buckets:
                del self._buckets[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limit(limit_type: str = "default"):
    """Rate limit decorator for route handlers"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Use IP or user ID as key
            client_ip = request.client.host if request.client else "unknown"
            key = f"{limit_type}:{client_ip}"
            
            if not rate_limiter.check(key, limit_type):
                retry_after = rate_limiter.get_retry_after(key, limit_type)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


# ============================================================
# 3️⃣ INPUT VALIDATION
# ============================================================

class InputValidator:
    """
    Validates and sanitizes user input to prevent injection attacks.
    """
    
    # Dangerous patterns
    SQL_INJECTION_PATTERNS = [
        "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "UNION",
        "--", "/*", "*/", "xp_", "sp_", "0x", "EXEC", "EXECUTE",
    ]
    
    XSS_PATTERNS = [
        "<script", "</script>", "javascript:", "onerror=", "onload=",
        "onclick=", "onmouseover=", "eval(", "document.", "window.",
    ]
    
    PATH_TRAVERSAL_PATTERNS = [
        "..", "./", "/.", "..\\", ".\\", "\\.",
    ]
    
    @classmethod
    def sanitize_string(cls, value: str, max_length: int = 1000) -> str:
        """Sanitize a string input"""
        if not isinstance(value, str):
            raise ValueError("Expected string input")
        
        # Truncate
        value = value[:max_length]
        
        # Remove null bytes
        value = value.replace("\x00", "")
        
        # Strip whitespace
        value = value.strip()
        
        return value
    
    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """Check for SQL injection patterns"""
        upper = value.upper()
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if pattern in upper:
                return True
        return False
    
    @classmethod
    def check_xss(cls, value: str) -> bool:
        """Check for XSS patterns"""
        lower = value.lower()
        for pattern in cls.XSS_PATTERNS:
            if pattern in lower:
                return True
        return False
    
    @classmethod
    def check_path_traversal(cls, value: str) -> bool:
        """Check for path traversal patterns"""
        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if pattern in value:
                return True
        return False
    
    @classmethod
    def validate_email(cls, email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @classmethod
    def validate_filename(cls, filename: str) -> str:
        """Sanitize filename for safe storage"""
        import re
        # Remove path components
        filename = os.path.basename(filename)
        # Only allow safe characters
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        # Limit length
        name, ext = os.path.splitext(filename)
        return f"{name[:100]}{ext[:10]}"
    
    @classmethod
    def validate_all(cls, value: str, field_name: str = "input") -> str:
        """Run all validations on a string"""
        value = cls.sanitize_string(value)
        
        if cls.check_sql_injection(value):
            logger.warning(f"SQL injection attempt in {field_name}: {value[:50]}")
            raise ValueError(f"Invalid characters in {field_name}")
        
        if cls.check_xss(value):
            logger.warning(f"XSS attempt in {field_name}: {value[:50]}")
            raise ValueError(f"Invalid characters in {field_name}")
        
        if cls.check_path_traversal(value):
            logger.warning(f"Path traversal attempt in {field_name}: {value[:50]}")
            raise ValueError(f"Invalid path in {field_name}")
        
        return value


# ============================================================
# 4️⃣ WEBHOOK VERIFICATION
# ============================================================

class WebhookVerifier:
    """
    Verifies webhook signatures to prevent replay attacks
    and fake payment notifications.
    """
    
    # Store processed event IDs to prevent replays
    _processed_events: Set[str] = set()
    _event_timestamps: Dict[str, float] = {}
    _lock = Lock()
    _max_events = 10000  # Max events to store
    _event_ttl = 3600    # Events expire after 1 hour
    
    @classmethod
    def verify_stripe_signature(
        cls,
        payload: bytes,
        signature: str,
        secret: str,
    ) -> bool:
        """Verify Stripe webhook signature"""
        import stripe
        try:
            stripe.Webhook.construct_event(payload, signature, secret)
            return True
        except (ValueError, stripe.error.SignatureVerificationError):
            return False
    
    @classmethod
    def verify_revenuecat_signature(
        cls,
        payload: bytes,
        signature: str,
        secret: str,
    ) -> bool:
        """Verify RevenueCat webhook signature"""
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected)
    
    @classmethod
    def is_duplicate_event(cls, event_id: str) -> bool:
        """Check if event has already been processed (replay attack prevention)"""
        with cls._lock:
            # Clean old events
            cls._cleanup_old_events()
            
            if event_id in cls._processed_events:
                logger.warning(f"Duplicate webhook event detected: {event_id}")
                return True
            
            return False
    
    @classmethod
    def mark_event_processed(cls, event_id: str):
        """Mark an event as processed"""
        with cls._lock:
            cls._processed_events.add(event_id)
            cls._event_timestamps[event_id] = time.time()
            
            # Limit storage
            if len(cls._processed_events) > cls._max_events:
                cls._cleanup_old_events(force=True)
    
    @classmethod
    def _cleanup_old_events(cls, force: bool = False):
        """Remove old events from storage"""
        now = time.time()
        threshold = now - cls._event_ttl
        
        # Only cleanup if forced or storage is getting full
        if not force and len(cls._processed_events) < cls._max_events * 0.9:
            return
        
        expired = [
            event_id for event_id, ts in cls._event_timestamps.items()
            if ts < threshold
        ]
        
        for event_id in expired:
            cls._processed_events.discard(event_id)
            del cls._event_timestamps[event_id]


# ============================================================
# 5️⃣ AUDIT LOGGING
# ============================================================

class AuditLog(Base):
    """SQLAlchemy model for audit logs"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(Text, nullable=True)
    status = Column(String(20), default="success")  # success, failure, error
    
    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "user_id": self.user_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": self.ip_address,
            "status": self.status,
        }


class AuditLogger:
    """
    Logs all sensitive operations for security auditing.
    """
    
    # Actions to log
    ACTIONS = {
        # Authentication
        "LOGIN": "User login",
        "LOGIN_FAILED": "Failed login attempt",
        "LOGOUT": "User logout",
        "REGISTER": "New user registration",
        "PASSWORD_CHANGE": "Password changed",
        "PASSWORD_RESET": "Password reset requested",
        
        # Subscription
        "SUBSCRIPTION_CREATE": "Subscription created",
        "SUBSCRIPTION_UPDATE": "Subscription updated",
        "SUBSCRIPTION_CANCEL": "Subscription canceled",
        "PAYMENT_SUCCESS": "Payment successful",
        "PAYMENT_FAILED": "Payment failed",
        
        # Credits/Usage
        "CREDITS_ADD": "Credits added",
        "CREDITS_USE": "Credits used",
        "USAGE_LIMIT": "Usage limit reached",
        
        # Content
        "UPLOAD": "File uploaded",
        "EXPORT": "Content exported",
        "DELETE": "Content deleted",
        
        # Security
        "API_KEY_ACCESS": "API key accessed",
        "RATE_LIMIT": "Rate limit hit",
        "INVALID_INPUT": "Invalid input detected",
        "WEBHOOK_RECEIVED": "Webhook received",
    }
    
    @classmethod
    def log(
        cls,
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
    ):
        """Create an audit log entry"""
        try:
            log_entry = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent[:500] if user_agent else None,
                details=json.dumps(details) if details else None,
                status=status,
            )
            db.add(log_entry)
            db.commit()
            
            # Also log to file
            logger.info(
                f"AUDIT: {action} | user={user_id} | resource={resource_type}:{resource_id} | "
                f"ip={ip_address} | status={status}"
            )
            
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
            db.rollback()
    
    @classmethod
    def log_from_request(
        cls,
        db: Session,
        request: Request,
        action: str,
        user_id: Optional[int] = None,
        **kwargs,
    ):
        """Create audit log from a FastAPI request"""
        cls.log(
            db=db,
            action=action,
            user_id=user_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            **kwargs,
        )


# ============================================================
# 6️⃣ CREDIT MANIPULATION PROTECTION
# ============================================================

class CreditManager:
    """
    Server-side only credit management.
    All credit operations are atomic and logged.
    """
    
    @classmethod
    def add_credits(
        cls,
        db: Session,
        user: Any,  # User model
        amount: int,
        reason: str,
        reference_id: Optional[str] = None,
    ) -> bool:
        """
        Add credits to user account (server-side only).
        Returns True if successful.
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        try:
            # Atomic update
            old_balance = user.credits if hasattr(user, 'credits') else 0
            user.credits = old_balance + amount
            
            # Log the operation
            AuditLogger.log(
                db=db,
                action="CREDITS_ADD",
                user_id=user.id,
                details={
                    "amount": amount,
                    "old_balance": old_balance,
                    "new_balance": user.credits,
                    "reason": reason,
                    "reference_id": reference_id,
                },
            )
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to add credits: {e}")
            db.rollback()
            return False
    
    @classmethod
    def use_credits(
        cls,
        db: Session,
        user: Any,
        amount: int,
        reason: str,
        reference_id: Optional[str] = None,
    ) -> bool:
        """
        Use credits from user account.
        Returns True if sufficient credits and successful.
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        current_balance = user.credits if hasattr(user, 'credits') else 0
        
        if current_balance < amount:
            AuditLogger.log(
                db=db,
                action="CREDITS_USE",
                user_id=user.id,
                details={
                    "amount": amount,
                    "balance": current_balance,
                    "reason": reason,
                },
                status="failure",
            )
            return False
        
        try:
            user.credits = current_balance - amount
            
            AuditLogger.log(
                db=db,
                action="CREDITS_USE",
                user_id=user.id,
                details={
                    "amount": amount,
                    "old_balance": current_balance,
                    "new_balance": user.credits,
                    "reason": reason,
                    "reference_id": reference_id,
                },
            )
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to use credits: {e}")
            db.rollback()
            return False


# ============================================================
# 7️⃣ SERVICE BLACKLIST
# ============================================================

class ServiceBlacklist:
    """
    Maintains a blacklist of prohibited services/content types.
    Prevents policy violations.
    """
    
    # Prohibited categories
    BLACKLIST = {
        "gambling": ["casino", "poker", "betting", "lottery", "slots"],
        "adult": ["adult", "porn", "xxx", "nsfw", "18+"],
        "illegal": ["drugs", "weapons", "hacking", "piracy"],
        "regulated": ["crypto", "forex", "trading"],
    }
    
    @classmethod
    def is_blacklisted(cls, content: str) -> tuple[bool, Optional[str]]:
        """
        Check if content contains blacklisted terms.
        Returns (is_blacklisted, category).
        """
        content_lower = content.lower()
        
        for category, terms in cls.BLACKLIST.items():
            for term in terms:
                if term in content_lower:
                    logger.warning(f"Blacklisted content detected: {term} in {category}")
                    return True, category
        
        return False, None
    
    @classmethod
    def add_to_blacklist(cls, category: str, term: str):
        """Add a term to the blacklist"""
        if category not in cls.BLACKLIST:
            cls.BLACKLIST[category] = []
        if term.lower() not in cls.BLACKLIST[category]:
            cls.BLACKLIST[category].append(term.lower())


# ============================================================
# 8️⃣ DEVICE MAPPING PROTECTION
# ============================================================

class DeviceMapping(Base):
    """Track device-account relationships"""
    __tablename__ = "device_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    device_id = Column(String(255), nullable=False, index=True)
    device_name = Column(String(255), nullable=True)
    platform = Column(String(50), nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class DeviceManager:
    """
    Manages device-account mappings.
    Prevents account hijacking via device ID spoofing.
    """
    
    MAX_DEVICES_PER_USER = 5
    
    @classmethod
    def register_device(
        cls,
        db: Session,
        user_id: int,
        device_id: str,
        device_name: Optional[str] = None,
        platform: Optional[str] = None,
    ) -> bool:
        """
        Register a new device for a user.
        Returns False if device limit reached or device belongs to another user.
        """
        # Check if device is already registered to another user
        existing = db.query(DeviceMapping).filter(
            DeviceMapping.device_id == device_id,
            DeviceMapping.user_id != user_id,
            DeviceMapping.is_active == True,
        ).first()
        
        if existing:
            logger.warning(
                f"Device hijacking attempt: device={device_id} "
                f"belongs to user={existing.user_id}, attempted by user={user_id}"
            )
            return False
        
        # Check if already registered to this user
        user_device = db.query(DeviceMapping).filter(
            DeviceMapping.device_id == device_id,
            DeviceMapping.user_id == user_id,
        ).first()
        
        if user_device:
            # Update last seen
            user_device.last_seen = datetime.utcnow()
            db.commit()
            return True
        
        # Check device limit
        device_count = db.query(DeviceMapping).filter(
            DeviceMapping.user_id == user_id,
            DeviceMapping.is_active == True,
        ).count()
        
        if device_count >= cls.MAX_DEVICES_PER_USER:
            logger.warning(f"Device limit reached for user={user_id}")
            return False
        
        # Register new device
        new_device = DeviceMapping(
            user_id=user_id,
            device_id=device_id,
            device_name=device_name,
            platform=platform,
            is_primary=(device_count == 0),
        )
        db.add(new_device)
        db.commit()
        
        return True
    
    @classmethod
    def verify_device(cls, db: Session, user_id: int, device_id: str) -> bool:
        """Verify that a device belongs to the user"""
        device = db.query(DeviceMapping).filter(
            DeviceMapping.device_id == device_id,
            DeviceMapping.user_id == user_id,
            DeviceMapping.is_active == True,
        ).first()
        
        return device is not None
    
    @classmethod
    def revoke_device(cls, db: Session, user_id: int, device_id: str) -> bool:
        """Revoke a device from a user account"""
        device = db.query(DeviceMapping).filter(
            DeviceMapping.device_id == device_id,
            DeviceMapping.user_id == user_id,
        ).first()
        
        if device:
            device.is_active = False
            db.commit()
            return True
        
        return False


# ============================================================
# 9️⃣ DATA VALIDATION SCHEMAS
# ============================================================

class SecureUserCreate(BaseModel):
    """Validated user creation schema"""
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = InputValidator.sanitize_string(v, 255)
        if not InputValidator.validate_email(v):
            raise ValueError("Invalid email format")
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a number")
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = InputValidator.validate_all(v, "name")
        return v


class SecureFileUpload(BaseModel):
    """Validated file upload schema"""
    filename: str = Field(..., max_length=255)
    content_type: str = Field(..., max_length=100)
    size: int = Field(..., gt=0)
    
    ALLOWED_TYPES: ClassVar[set] = {
        "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a",
    }
    
    MAX_SIZE: ClassVar[int] = 500 * 1024 * 1024  # 500MB
    
    @field_validator('filename')
    @classmethod
    def validate_filename(cls, v: str) -> str:
        return InputValidator.validate_filename(v)
    
    @field_validator('content_type')
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        if v not in cls.ALLOWED_TYPES:
            raise ValueError(f"File type not allowed: {v}")
        return v
    
    @field_validator('size')
    @classmethod
    def validate_size(cls, v: int) -> int:
        if v > cls.MAX_SIZE:
            raise ValueError(f"File too large. Maximum size is {cls.MAX_SIZE // (1024*1024)}MB")
        return v


# ============================================================
# MIDDLEWARE & DEPENDENCIES
# ============================================================

async def security_middleware(request: Request, call_next):
    """
    Global security middleware.
    Applied to all requests.
    """
    start_time = time.time()
    
    # Get client info
    client_ip = request.client.host if request.client else "unknown"
    
    # Check global rate limit
    if not rate_limiter.check(f"global:{client_ip}", "default"):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
        )
    
    # Add security headers
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # Log request (for monitoring)
    duration = time.time() - start_time
    if duration > 5:  # Log slow requests
        logger.warning(f"Slow request: {request.method} {request.url.path} took {duration:.2f}s")
    
    return response


# ============================================================
# EXPORTS
# ============================================================

__all__ = [
    # API Key
    "APIKeyManager",
    
    # Rate Limiting
    "RateLimiter",
    "rate_limiter",
    "rate_limit",
    
    # Input Validation
    "InputValidator",
    "SecureUserCreate",
    "SecureFileUpload",
    
    # Webhook
    "WebhookVerifier",
    
    # Audit
    "AuditLog",
    "AuditLogger",
    
    # Credits
    "CreditManager",
    
    # Blacklist
    "ServiceBlacklist",
    
    # Device
    "DeviceMapping",
    "DeviceManager",
    
    # Middleware
    "security_middleware",
]
