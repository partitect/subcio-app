"""
Subcio Logging Configuration

Comprehensive logging setup with:
- Console output (colored)
- File rotation
- JSON format for production
- Request/Response logging
- Error tracking
"""

import os
import sys
import json
import logging
import logging.handlers
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from functools import wraps
import traceback
import time

# ============================================================
# CONFIGURATION
# ============================================================

LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Environment
ENV = os.getenv("ENV", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Log levels per environment
LOG_LEVELS = {
    "development": logging.DEBUG,
    "staging": logging.INFO,
    "production": logging.WARNING,
}

# ============================================================
# CUSTOM FORMATTERS
# ============================================================

class ColoredFormatter(logging.Formatter):
    """Colored console output formatter."""
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    def format(self, record):
        # Add color to level name
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{self.BOLD}{levelname}{self.RESET}"
        
        # Format timestamp
        record.timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S.%f')[:-3]
        
        return super().format(record)


class JSONFormatter(logging.Formatter):
    """JSON format for production logs."""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info) if record.exc_info[0] else None,
            }
        
        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data["extra"] = record.extra_data
        
        return json.dumps(log_data, ensure_ascii=False, default=str)


# ============================================================
# CUSTOM HANDLERS
# ============================================================

class RequestContextFilter(logging.Filter):
    """Adds request context to log records."""
    
    def __init__(self):
        super().__init__()
        self.request_id = None
        self.user_id = None
        self.ip_address = None
    
    def filter(self, record):
        record.request_id = getattr(self, 'request_id', '-')
        record.user_id = getattr(self, 'user_id', '-')
        record.ip_address = getattr(self, 'ip_address', '-')
        return True


# Global filter instance
request_context = RequestContextFilter()


# ============================================================
# LOGGER SETUP
# ============================================================

def setup_logging(
    app_name: str = "subcio",
    level: Optional[int] = None,
    log_to_file: bool = True,
    json_format: bool = False
) -> logging.Logger:
    """
    Setup logging configuration.
    
    Args:
        app_name: Application name for logger
        level: Log level (default based on ENV)
        log_to_file: Enable file logging
        json_format: Use JSON format (for production)
    
    Returns:
        Configured logger instance
    """
    
    # Determine log level
    if level is None:
        level = LOG_LEVELS.get(ENV, logging.DEBUG)
    
    # Create logger
    logger = logging.getLogger(app_name)
    logger.setLevel(level)
    logger.handlers.clear()
    
    # Add request context filter
    logger.addFilter(request_context)
    
    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    if json_format or ENV == "production":
        console_handler.setFormatter(JSONFormatter())
    else:
        console_format = "%(timestamp)s | %(levelname)-17s | %(name)s | %(message)s"
        console_handler.setFormatter(ColoredFormatter(console_format))
    
    logger.addHandler(console_handler)
    
    # File Handler (Rotating)
    if log_to_file:
        # Main log file
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / f"{app_name}.log",
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(level)
        file_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(module)s:%(lineno)d | %(message)s"
        file_handler.setFormatter(logging.Formatter(file_format))
        logger.addHandler(file_handler)
        
        # Error log file (errors and above)
        error_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / f"{app_name}_errors.log",
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=10,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(logging.Formatter(file_format))
        logger.addHandler(error_handler)
        
        # JSON log file (for analysis)
        json_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / f"{app_name}_json.log",
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding='utf-8'
        )
        json_handler.setLevel(level)
        json_handler.setFormatter(JSONFormatter())
        logger.addHandler(json_handler)
    
    return logger


# ============================================================
# SPECIALIZED LOGGERS
# ============================================================

def get_logger(name: str) -> logging.Logger:
    """Get a child logger with the given name."""
    return logging.getLogger(f"subcio.{name}")


# Pre-configured loggers
api_logger = get_logger("api")
auth_logger = get_logger("auth")
db_logger = get_logger("database")
payment_logger = get_logger("payment")
security_logger = get_logger("security")
transcription_logger = get_logger("transcription")
export_logger = get_logger("export")


# ============================================================
# DECORATORS
# ============================================================

def log_execution(logger: logging.Logger = None, level: int = logging.DEBUG):
    """Decorator to log function execution time and results."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            _logger = logger or get_logger(func.__module__)
            func_name = f"{func.__module__}.{func.__name__}"
            
            start_time = time.time()
            _logger.log(level, f"[CALL] {func_name}")
            
            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                _logger.log(level, f"[OK] {func_name} completed in {duration:.2f}ms")
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                _logger.error(f"[FAIL] {func_name} failed after {duration:.2f}ms: {e}")
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            _logger = logger or get_logger(func.__module__)
            func_name = f"{func.__module__}.{func.__name__}"
            
            start_time = time.time()
            _logger.log(level, f"[CALL] {func_name}")
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                _logger.log(level, f"[OK] {func_name} completed in {duration:.2f}ms")
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                _logger.error(f"[FAIL] {func_name} failed after {duration:.2f}ms: {e}")
                raise
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# ============================================================
# REQUEST LOGGING MIDDLEWARE
# ============================================================

class RequestLoggingMiddleware:
    """FastAPI middleware for request/response logging."""
    
    def __init__(self, app, logger: logging.Logger = None):
        self.app = app
        self.logger = logger or api_logger
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        import uuid
        from starlette.requests import Request
        
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        request_context.request_id = request_id
        
        # Get request info
        request = Request(scope, receive)
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        request_context.ip_address = client_ip
        
        # Skip health check and static files
        if path in ["/health", "/favicon.ico"] or path.startswith("/static"):
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        
        # Log request
        self.logger.info(f"[REQ] {request_id} | {method} {path} | IP: {client_ip}")
        
        # Capture response status
        status_code = 500
        
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            self.logger.error(f"[ERR] {request_id} | {method} {path} | Error: {e}")
            raise
        finally:
            duration = (time.time() - start_time) * 1000
            
            # Status indicator
            if status_code < 300:
                status_indicator = "OK"
            elif status_code < 400:
                status_indicator = "REDIRECT"
            elif status_code < 500:
                status_indicator = "WARN"
            else:
                status_indicator = "ERROR"
            
            self.logger.info(f"[RES] {request_id} | {method} {path} | {status_indicator} {status_code} | {duration:.2f}ms")


# ============================================================
# LOG ANALYSIS HELPERS
# ============================================================

def parse_json_logs(log_file: Path) -> list:
    """Parse JSON log file for analysis."""
    logs = []
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                logs.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return logs


def get_error_summary(log_file: Path = None) -> Dict[str, Any]:
    """Get summary of errors from log file."""
    if log_file is None:
        log_file = LOG_DIR / "subcio_errors.log"
    
    if not log_file.exists():
        return {"total_errors": 0, "error_types": {}}
    
    error_types = {}
    total_errors = 0
    
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            total_errors += 1
            # Extract error type from log line
            if "ERROR" in line:
                parts = line.split("|")
                if len(parts) >= 4:
                    error_msg = parts[-1].strip()[:100]
                    error_types[error_msg] = error_types.get(error_msg, 0) + 1
    
    return {
        "total_errors": total_errors,
        "error_types": dict(sorted(error_types.items(), key=lambda x: x[1], reverse=True)[:10])
    }


# ============================================================
# INITIALIZE ON IMPORT
# ============================================================

# Setup main logger
main_logger = setup_logging()
main_logger.info("[LOG] Logging system initialized")
main_logger.info(f"[DIR] Log directory: {LOG_DIR}")
main_logger.info(f"[ENV] Environment: {ENV}")
