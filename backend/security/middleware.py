"""
Subcio Security Middleware
FastAPI middleware for comprehensive security enforcement
"""

import time
import hashlib
import json
from typing import Optional, Callable, Dict, Any
from functools import wraps
from datetime import datetime, timedelta

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from . import (
    SecurityConfig,
    RateLimiter,
    AuditLogger,
    AuditAction,
    InputValidator,
)


# ============================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all responses.
    Protects against common web vulnerabilities.
    """
    
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
    }
    
    # Content Security Policy
    CSP_DIRECTIVES = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.stripe.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        for header, value in self.SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # Add CSP
        response.headers["Content-Security-Policy"] = "; ".join(self.CSP_DIRECTIVES)
        
        return response


# ============================================================
# RATE LIMITING MIDDLEWARE
# ============================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global rate limiting middleware.
    Uses token bucket algorithm for fair limiting.
    """
    
    def __init__(self, app, limiter: Optional[RateLimiter] = None):
        super().__init__(app)
        self.limiter = limiter or RateLimiter(
            requests_per_minute=SecurityConfig.DEFAULT_RATE_LIMIT
        )
        self.audit_logger = AuditLogger()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client identifier
        client_id = self._get_client_identifier(request)
        
        # Determine limit type based on path
        limit_type = self._get_limit_type(request.url.path)
        requests_per_minute = SecurityConfig.RATE_LIMITS.get(
            limit_type, 
            SecurityConfig.DEFAULT_RATE_LIMIT
        )
        
        # Check rate limit
        is_allowed, retry_after = self.limiter.is_allowed(client_id)
        
        if not is_allowed:
            # Log rate limit violation
            self.audit_logger.log(
                action=AuditAction.RATE_LIMIT,
                user_id=None,
                resource_type="request",
                status="blocked",
                ip_address=client_id.split(":")[0],
                details={
                    "path": request.url.path,
                    "limit_type": limit_type,
                    "retry_after": retry_after
                }
            )
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    "retry_after": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )
        
        response = await call_next(request)
        return response
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique client identifier for rate limiting."""
        # Use IP address as base
        client_ip = request.client.host if request.client else "unknown"
        
        # Include Authorization header hash if present
        auth_header = request.headers.get("Authorization", "")
        if auth_header:
            auth_hash = hashlib.md5(auth_header.encode()).hexdigest()[:8]
            return f"{client_ip}:{auth_hash}"
        
        return f"{client_ip}:anon"
    
    def _get_limit_type(self, path: str) -> str:
        """Determine rate limit type based on path."""
        if "/auth/" in path or "/login" in path or "/register" in path:
            return "auth"
        elif "/upload" in path:
            return "upload"
        elif "/export" in path:
            return "export"
        elif "/api/" in path:
            return "api"
        else:
            return "default"


# ============================================================
# INPUT VALIDATION MIDDLEWARE
# ============================================================

class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Validates all incoming request data.
    Blocks potentially malicious input.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check query parameters
        for key, value in request.query_params.items():
            is_valid, error = InputValidator.validate_string(value, key)
            if not is_valid:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": f"Invalid input in query parameter '{key}': {error}"}
                )
        
        # Check path parameters (basic sanitization)
        for param in request.path_params.values():
            if isinstance(param, str):
                is_valid, error = InputValidator.validate_string(param, "path_param")
                if not is_valid:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"detail": f"Invalid path parameter: {error}"}
                    )
        
        # For POST/PUT/PATCH, validate body
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            
            if "application/json" in content_type:
                try:
                    body = await request.body()
                    if body:
                        data = json.loads(body)
                        if isinstance(data, dict):
                            for key, value in data.items():
                                if isinstance(value, str):
                                    is_valid, error = InputValidator.validate_string(value, key)
                                    if not is_valid:
                                        return JSONResponse(
                                            status_code=status.HTTP_400_BAD_REQUEST,
                                            content={"detail": f"Invalid input in field '{key}': {error}"}
                                        )
                except json.JSONDecodeError:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"detail": "Invalid JSON body"}
                    )
        
        response = await call_next(request)
        return response


# ============================================================
# AUDIT LOGGING MIDDLEWARE
# ============================================================

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs all requests for audit purposes.
    Captures critical information for security analysis.
    """
    
    # Paths that should be logged
    AUDIT_PATHS = [
        "/auth/",
        "/api/payments/",
        "/api/stripe/",
        "/api/projects/",
        "/api/export/",
        "/api/credits/",
        "/admin/",
    ]
    
    # Paths to exclude from logging
    EXCLUDE_PATHS = [
        "/health",
        "/docs",
        "/openapi.json",
        "/favicon.ico",
    ]
    
    def __init__(self, app):
        super().__init__(app)
        self.audit_logger = AuditLogger()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        
        # Skip excluded paths
        if any(path.startswith(exc) for exc in self.EXCLUDE_PATHS):
            return await call_next(request)
        
        # Check if this path should be logged
        should_log = any(audit_path in path for audit_path in self.AUDIT_PATHS)
        
        if not should_log:
            return await call_next(request)
        
        # Capture request details
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        
        # Get user ID from token if available
        user_id = self._extract_user_id(request)
        
        # Process request
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Determine action type
            action = self._determine_action(request.method, path)
            
            # Log the request
            self.audit_logger.log(
                action=action,
                user_id=user_id,
                resource_type=self._extract_resource_type(path),
                status="success" if response.status_code < 400 else "failure",
                ip_address=client_ip,
                details={
                    "method": request.method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "user_agent": request.headers.get("user-agent", "unknown")[:200],
                }
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            self.audit_logger.log(
                action=AuditAction.ERROR,
                user_id=user_id,
                resource_type="request",
                status="error",
                ip_address=client_ip,
                details={
                    "method": request.method,
                    "path": path,
                    "error": str(e)[:500],
                    "duration_ms": round(duration * 1000, 2),
                }
            )
            raise
    
    def _extract_user_id(self, request: Request) -> Optional[int]:
        """Extract user ID from Authorization header if available."""
        # This is a placeholder - actual implementation would decode JWT
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # In production, decode JWT here
            return None
        return None
    
    def _determine_action(self, method: str, path: str) -> AuditAction:
        """Determine audit action based on request."""
        if "/login" in path:
            return AuditAction.LOGIN
        elif "/register" in path:
            return AuditAction.REGISTER
        elif "/logout" in path:
            return AuditAction.LOGOUT
        elif "/subscription" in path:
            return AuditAction.SUBSCRIPTION_CREATE
        elif "/webhook" in path:
            return AuditAction.WEBHOOK_RECEIVED
        elif "/export" in path:
            return AuditAction.EXPORT
        elif "/upload" in path:
            return AuditAction.UPLOAD
        elif "credit" in path:
            return AuditAction.CREDITS_USE
        elif method == "DELETE":
            return AuditAction.DELETE
        else:
            return AuditAction.API_ACCESS
    
    def _extract_resource_type(self, path: str) -> str:
        """Extract resource type from path."""
        parts = path.strip("/").split("/")
        if len(parts) >= 2:
            return parts[1]  # e.g., "projects", "auth", "payments"
        return "unknown"


# ============================================================
# IP BLOCKING MIDDLEWARE
# ============================================================

class IPBlockingMiddleware(BaseHTTPMiddleware):
    """
    Blocks requests from blacklisted IP addresses.
    Maintains a dynamic blocklist based on violations.
    """
    
    # Permanent blocklist (known bad IPs)
    PERMANENT_BLOCKLIST: set = set()
    
    # Temporary blocks (IP -> unblock_time)
    _temporary_blocks: Dict[str, datetime] = {}
    
    # Violation counters (IP -> count)
    _violations: Dict[str, int] = {}
    
    # Block threshold
    VIOLATION_THRESHOLD = 10
    BLOCK_DURATION_MINUTES = 60
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        
        # Check permanent blocklist
        if client_ip in self.PERMANENT_BLOCKLIST:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access denied"}
            )
        
        # Check temporary blocks
        if client_ip in self._temporary_blocks:
            unblock_time = self._temporary_blocks[client_ip]
            if datetime.utcnow() < unblock_time:
                remaining = (unblock_time - datetime.utcnow()).seconds
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "detail": f"Access temporarily blocked. Try again in {remaining} seconds."
                    }
                )
            else:
                # Block expired
                del self._temporary_blocks[client_ip]
                if client_ip in self._violations:
                    del self._violations[client_ip]
        
        response = await call_next(request)
        return response
    
    @classmethod
    def add_violation(cls, ip: str) -> bool:
        """
        Record a violation for an IP.
        Returns True if the IP is now blocked.
        """
        cls._violations[ip] = cls._violations.get(ip, 0) + 1
        
        if cls._violations[ip] >= cls.VIOLATION_THRESHOLD:
            cls._temporary_blocks[ip] = datetime.utcnow() + timedelta(
                minutes=cls.BLOCK_DURATION_MINUTES
            )
            return True
        
        return False
    
    @classmethod
    def block_ip(cls, ip: str, permanent: bool = False, minutes: int = 60):
        """Manually block an IP."""
        if permanent:
            cls.PERMANENT_BLOCKLIST.add(ip)
        else:
            cls._temporary_blocks[ip] = datetime.utcnow() + timedelta(minutes=minutes)
    
    @classmethod
    def unblock_ip(cls, ip: str):
        """Unblock an IP."""
        cls.PERMANENT_BLOCKLIST.discard(ip)
        cls._temporary_blocks.pop(ip, None)
        cls._violations.pop(ip, None)


# ============================================================
# REQUEST TIMING MIDDLEWARE
# ============================================================

class RequestTimingMiddleware(BaseHTTPMiddleware):
    """
    Adds timing information to responses.
    Helps with performance monitoring.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Add timing header
        response.headers["X-Response-Time"] = f"{duration:.4f}s"
        
        return response


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def setup_security_middleware(app):
    """
    Setup all security middleware for a FastAPI app.
    Call this in your main.py file.
    """
    # Order matters - add in reverse order of execution
    app.add_middleware(RequestTimingMiddleware)
    app.add_middleware(AuditLoggingMiddleware)
    app.add_middleware(InputValidationMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(IPBlockingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)


def rate_limit(limit_type: str = "default"):
    """
    Decorator for rate limiting specific endpoints.
    Usage:
        @router.post("/upload")
        @rate_limit("upload")
        async def upload_file(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, request: Request = None, **kwargs):
            # Get rate limiter instance
            limiter = RateLimiter(
                requests_per_minute=SecurityConfig.RATE_LIMITS.get(
                    limit_type,
                    SecurityConfig.DEFAULT_RATE_LIMIT
                )
            )
            
            # Get client identifier
            client_ip = request.client.host if request and request.client else "unknown"
            client_id = f"{client_ip}:{limit_type}"
            
            # Check limit
            is_allowed, retry_after = limiter.is_allowed(client_id)
            
            if not is_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
            
            return await func(*args, request=request, **kwargs)
        return wrapper
    return decorator
