"""
Subcio Security Middleware (Desktop Mode)
Simplified middleware for Electron desktop application.
Rate limiting and IP blocking disabled in desktop mode.
"""

import os
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
    """
    
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",  # Changed for Electron
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        for header, value in self.SECURITY_HEADERS.items():
            response.headers[header] = value
        
        return response


# ============================================================
# RATE LIMITING MIDDLEWARE (DISABLED FOR DESKTOP)
# ============================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware - disabled for desktop mode.
    """
    
    def __init__(self, app, limiter: Optional[RateLimiter] = None):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Desktop mode - no rate limiting
        return await call_next(request)


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
    """
    
    # Paths that should be logged
    AUDIT_PATHS = [
        "/api/projects/",
        "/api/export/",
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
        
        # Process request
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Log the request
            self.audit_logger.log(
                action=AuditAction.API_ACCESS,
                user_id=1,  # Desktop user
                resource_type="request",
                status="success" if response.status_code < 400 else "failure",
                ip_address="127.0.0.1",
                details={
                    "method": request.method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                }
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            self.audit_logger.log(
                action=AuditAction.ERROR,
                user_id=1,
                resource_type="request",
                status="error",
                ip_address="127.0.0.1",
                details={
                    "method": request.method,
                    "path": path,
                    "error": str(e)[:500],
                    "duration_ms": round(duration * 1000, 2),
                }
            )
            raise


# ============================================================
# IP BLOCKING MIDDLEWARE (DISABLED FOR DESKTOP)
# ============================================================

class IPBlockingMiddleware(BaseHTTPMiddleware):
    """
    IP blocking middleware - disabled for desktop mode.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Desktop mode - no IP blocking
        return await call_next(request)
    
    @classmethod
    def add_violation(cls, ip: str) -> bool:
        return False
    
    @classmethod
    def block_ip(cls, ip: str, permanent: bool = False, minutes: int = 60):
        pass
    
    @classmethod
    def unblock_ip(cls, ip: str):
        pass


# ============================================================
# REQUEST TIMING MIDDLEWARE
# ============================================================

class RequestTimingMiddleware(BaseHTTPMiddleware):
    """
    Adds timing information to responses.
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
    Desktop mode - minimal security overhead.
    """
    app.add_middleware(RequestTimingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)


def rate_limit(limit_type: str = "default"):
    """
    Rate limit decorator - disabled for desktop mode.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator
