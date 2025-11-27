"""
Database configuration and session management.
Supports both SQLite (development) and PostgreSQL (production).
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

from .models import Base

# Get database URL from environment or use SQLite default
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: PostgreSQL
    # Railway/Render use postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # Check connection health
        echo=False,
    )
    print(f"[INFO] Using PostgreSQL database")
else:
    # Development: SQLite
    DATABASE_PATH = Path(__file__).resolve().parent.parent / "subcio.db"
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
    
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        echo=False,
    )
    print(f"[INFO] Using SQLite database at {DATABASE_PATH}")

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables including security tables"""
    # Import security models to register them with Base.metadata
    try:
        from ..security import AuditLog, DeviceMapping
        from ..security import Base as SecurityBase
        
        # Create security tables
        SecurityBase.metadata.create_all(bind=engine)
    except ImportError:
        # In case security module is not available yet
        pass
    
    # Create auth tables
    Base.metadata.create_all(bind=engine)
    print(f"[INFO] Database initialized at {DATABASE_PATH}")
    print(f"[INFO] Security tables created (audit_logs, device_mappings)")


def get_db():
    """
    Dependency to get database session.
    Use with FastAPI's Depends().
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database session.
    Use in non-FastAPI contexts.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    from .models import User
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    """Get user by ID"""
    from .models import User
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, email: str, password_hash: str, name: str = None):
    """Create a new user"""
    from .models import User, SubscriptionPlan, get_plan_limits
    
    limits = get_plan_limits(SubscriptionPlan.FREE.value)
    
    # videos_per_month * max_video_length ile yaklaşık dakika hesaplama
    videos = limits.get("videos_per_month", 3)
    video_length = limits.get("max_video_length_minutes", 3)
    monthly_minutes = videos * video_length if videos != float('inf') else 9999
    
    user = User(
        email=email,
        password_hash=password_hash,
        name=name,
        plan=SubscriptionPlan.FREE.value,
        monthly_minutes_limit=monthly_minutes,
        monthly_exports_limit=limits.get("videos_per_month", 3) if limits.get("videos_per_month", 3) != float('inf') else 9999,
        storage_limit_mb=limits.get("storage_mb", 1000),
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_login(db: Session, user):
    """Update user's last login timestamp"""
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def get_user_by_oauth(db: Session, provider: str, provider_id: str):
    """Get user by OAuth provider and provider ID"""
    from .models import User
    return db.query(User).filter(
        User.oauth_provider == provider,
        User.oauth_id == provider_id
    ).first()


def create_or_update_oauth_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: str,
    name: str = None,
    avatar_url: str = None
):
    """
    Create a new OAuth user or update existing one.
    If email already exists, link the OAuth provider.
    """
    from datetime import datetime
    from .models import User, SubscriptionPlan, get_plan_limits
    
    # First check if user exists by OAuth
    user = get_user_by_oauth(db, provider, provider_id)
    
    if user:
        # Update existing OAuth user
        user.last_login = datetime.utcnow()
        if name and not user.name:
            user.name = name
        if avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user, False  # False = existing user
    
    # Check if email already exists (maybe registered with password)
    existing_user = get_user_by_email(db, email)
    
    if existing_user:
        # Link OAuth to existing account
        existing_user.oauth_provider = provider
        existing_user.oauth_id = provider_id
        if avatar_url:
            existing_user.avatar_url = avatar_url
        existing_user.last_login = datetime.utcnow()
        existing_user.is_verified = True  # OAuth emails are verified
        db.commit()
        db.refresh(existing_user)
        return existing_user, False
    
    # Create new user
    limits = get_plan_limits(SubscriptionPlan.FREE.value)
    
    # videos_per_month * max_video_length ile yaklaşık dakika hesaplama
    videos = limits.get("videos_per_month", 3)
    video_length = limits.get("max_video_length_minutes", 3)
    monthly_minutes = videos * video_length if videos != float('inf') else 9999
    
    user = User(
        email=email,
        password_hash=None,  # OAuth users don't have password
        name=name,
        oauth_provider=provider,
        oauth_id=provider_id,
        avatar_url=avatar_url,
        plan=SubscriptionPlan.FREE.value,
        monthly_minutes_limit=monthly_minutes,
        monthly_exports_limit=limits.get("videos_per_month", 3) if limits.get("videos_per_month", 3) != float('inf') else 9999,
        storage_limit_mb=limits.get("storage_mb", 1000),
        is_verified=True,  # OAuth emails are verified
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True  # True = new user
