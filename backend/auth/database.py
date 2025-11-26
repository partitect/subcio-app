"""
Database configuration and session management.
"""
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

from .models import Base

# Database path - in backend folder
DATABASE_PATH = Path(__file__).resolve().parent.parent / "pycaps.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False,  # Set to True for SQL logging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print(f"[INFO] Database initialized at {DATABASE_PATH}")


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
    
    user = User(
        email=email,
        password_hash=password_hash,
        name=name,
        plan=SubscriptionPlan.FREE.value,
        monthly_minutes_limit=limits["monthly_minutes"],
        monthly_exports_limit=limits["monthly_exports"],
        storage_limit_mb=limits["storage_mb"],
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
