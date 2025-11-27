"""
Admin API routes for managing users, projects, and system settings.
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
import os

from .database import get_db
from .models import (
    User, UserRole, SubscriptionPlan, 
    AdminUserResponse, AdminUserUpdate
)
from .utils import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============ Admin Authorization ============

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role for access"""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require super admin role for access"""
    if not current_user.is_super_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


# ============ Dashboard Stats ============

@router.get("/stats/overview")
async def get_overview_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get overview statistics for admin dashboard"""
    
    # Total users
    total_users = db.query(func.count(User.id)).scalar()
    
    # Active users (logged in within last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = db.query(func.count(User.id)).filter(
        User.last_login >= thirty_days_ago
    ).scalar()
    
    # New users this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_month = db.query(func.count(User.id)).filter(
        User.created_at >= month_start
    ).scalar()
    
    # Users by plan
    users_by_plan = {}
    for plan in SubscriptionPlan:
        count = db.query(func.count(User.id)).filter(User.plan == plan.value).scalar()
        users_by_plan[plan.value] = count
    
    # Total storage used
    total_storage = db.query(func.sum(User.storage_used_mb)).scalar() or 0
    
    # Total minutes used this month
    total_minutes = db.query(func.sum(User.monthly_minutes_used)).scalar() or 0
    
    # Projects count (from projects folder)
    projects_dir = os.path.join(os.path.dirname(__file__), "..", "projects")
    total_projects = 0
    if os.path.exists(projects_dir):
        total_projects = len([d for d in os.listdir(projects_dir) if os.path.isdir(os.path.join(projects_dir, d))])
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "new_this_month": new_users_month,
            "by_plan": users_by_plan
        },
        "usage": {
            "total_storage_mb": round(total_storage, 2),
            "total_minutes_used": round(total_minutes, 2),
            "total_projects": total_projects
        },
        "revenue": {
            "mrr": users_by_plan.get("starter", 0) * 9 + 
                   users_by_plan.get("pro", 0) * 29 + 
                   users_by_plan.get("unlimited", 0) * 79,
            "paying_customers": (
                users_by_plan.get("starter", 0) + 
                users_by_plan.get("pro", 0) + 
                users_by_plan.get("unlimited", 0)
            )
        }
    }


@router.get("/stats/growth")
async def get_growth_stats(
    days: int = Query(30, ge=7, le=365),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get user growth statistics over time"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Daily signups
    daily_signups = []
    current_date = start_date
    while current_date <= end_date:
        next_date = current_date + timedelta(days=1)
        count = db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= current_date,
                User.created_at < next_date
            )
        ).scalar()
        daily_signups.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "count": count
        })
        current_date = next_date
    
    return {
        "period_days": days,
        "daily_signups": daily_signups,
        "total_signups": sum(d["count"] for d in daily_signups)
    }


# ============ User Management ============

@router.get("/users", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    plan: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    sort_by: str = Query("created_at", regex="^(created_at|email|name|plan|last_login)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users with filtering and pagination"""
    
    query = db.query(User)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) | 
            (User.name.ilike(search_term))
        )
    
    if plan:
        query = query.filter(User.plan == plan)
    
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Get total count
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(User, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Apply pagination
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()
    
    return {
        "users": [user.to_dict() for user in users],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed user information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_dict = user.to_dict()
    user_dict.update({
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "subscription_started_at": user.subscription_started_at.isoformat() if user.subscription_started_at else None,
        "subscription_ends_at": user.subscription_ends_at.isoformat() if user.subscription_ends_at else None,
        "stripe_customer_id": user.stripe_customer_id,
        "stripe_subscription_id": user.stripe_subscription_id,
    })
    
    return user_dict


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    update_data: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent modifying super admins unless you're a super admin
    if user.is_super_admin() and not admin.is_super_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify super admin users"
        )
    
    # Prevent role escalation
    if update_data.role and update_data.role == UserRole.SUPER_ADMIN.value:
        if not admin.is_super_admin():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can create super admins"
            )
    
    # Apply updates
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(user, key, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user.to_dict()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a user (super admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevent deleting other super admins
    if user.is_super_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete super admin users"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Ban/Deactivate a user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin() and not admin.is_super_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot ban admin users"
        )
    
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "User banned successfully"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Unban/Reactivate a user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "User unbanned successfully"}


@router.post("/users/{user_id}/reset-usage")
async def reset_user_usage(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Reset user's monthly usage"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.monthly_minutes_used = 0.0
    user.monthly_exports_used = 0
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "User usage reset successfully"}


# ============ System Settings ============

@router.get("/settings")
async def get_system_settings(
    admin: User = Depends(require_super_admin)
):
    """Get system settings"""
    
    return {
        "maintenance_mode": False,
        "registration_enabled": True,
        "email_verification_required": False,
        "max_file_size_mb": 500,
        "allowed_file_types": ["mp4", "webm", "mov", "avi", "mkv"],
        "default_plan": "free",
        "plans": {
            "free": {"price": 0, "videos": 3, "max_length": 3},
            "starter": {"price": 9, "videos": 15, "max_length": 10},
            "pro": {"price": 29, "videos": 50, "max_length": 30},
            "unlimited": {"price": 79, "videos": -1, "max_length": -1}
        }
    }


@router.get("/activity-logs")
async def get_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get recent activity logs (placeholder - implement with actual logging)"""
    
    # Get recent user activities (login, registration, etc.)
    recent_logins = db.query(User).filter(
        User.last_login.isnot(None)
    ).order_by(desc(User.last_login)).limit(limit).all()
    
    activities = []
    for user in recent_logins:
        activities.append({
            "type": "login",
            "user_id": user.id,
            "user_email": user.email,
            "timestamp": user.last_login.isoformat() if user.last_login else None
        })
    
    recent_signups = db.query(User).order_by(desc(User.created_at)).limit(limit).all()
    for user in recent_signups:
        activities.append({
            "type": "signup",
            "user_id": user.id,
            "user_email": user.email,
            "timestamp": user.created_at.isoformat() if user.created_at else None
        })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    
    return {
        "activities": activities[:limit],
        "page": page,
        "limit": limit
    }


# ============ Bulk Operations ============

@router.post("/users/bulk-action")
async def bulk_user_action(
    action: str = Query(..., regex="^(activate|deactivate|delete|reset_usage)$"),
    user_ids: List[int] = [],
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Perform bulk actions on users"""
    
    if action == "delete" and not admin.is_super_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can delete users"
        )
    
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    # Filter out admins if current user is not super admin
    if not admin.is_super_admin():
        users = [u for u in users if not u.is_admin()]
    
    affected = 0
    for user in users:
        if user.id == admin.id:
            continue  # Skip self
        
        if action == "activate":
            user.is_active = True
        elif action == "deactivate":
            user.is_active = False
        elif action == "delete":
            db.delete(user)
        elif action == "reset_usage":
            user.monthly_minutes_used = 0.0
            user.monthly_exports_used = 0
        
        affected += 1
    
    db.commit()
    
    return {
        "message": f"Action '{action}' applied to {affected} users",
        "affected": affected
    }
