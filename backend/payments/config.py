"""
Stripe Configuration and Price IDs
"""
import os
from enum import Enum
from typing import Dict, Any

# Stripe API Keys (set in environment variables)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Frontend URL for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class StripePlan(str, Enum):
    """Stripe plan identifiers matching frontend pricing.ts"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    UNLIMITED = "unlimited"


# Stripe Price IDs - Replace with your actual Stripe price IDs
# You create these in Stripe Dashboard > Products > Add Product
STRIPE_PRICE_IDS: Dict[str, Dict[str, str]] = {
    StripePlan.STARTER: {
        "monthly": os.getenv("STRIPE_PRICE_STARTER_MONTHLY", "price_starter_monthly"),
        "yearly": os.getenv("STRIPE_PRICE_STARTER_YEARLY", "price_starter_yearly"),
    },
    StripePlan.PRO: {
        "monthly": os.getenv("STRIPE_PRICE_PRO_MONTHLY", "price_pro_monthly"),
        "yearly": os.getenv("STRIPE_PRICE_PRO_YEARLY", "price_pro_yearly"),
    },
    StripePlan.UNLIMITED: {
        "monthly": os.getenv("STRIPE_PRICE_UNLIMITED_MONTHLY", "price_unlimited_monthly"),
        "yearly": os.getenv("STRIPE_PRICE_UNLIMITED_YEARLY", "price_unlimited_yearly"),
    },
}

# Plan features and limits - Simplified video-count based model
PLAN_FEATURES: Dict[str, Dict[str, Any]] = {
    StripePlan.FREE: {
        "name": "Free",
        "price_monthly": 0,
        "price_yearly": 0,
        "videos_per_month": 3,
        "max_video_length_minutes": 3,
        "max_resolution": "720p",
        "storage_gb": 1,
        "presets": "basic",
        "watermark": True,
        "priority_support": False,
        "api_access": False,
        "team_members": 1,
    },
    StripePlan.STARTER: {
        "name": "Starter",
        "price_monthly": 9,
        "price_yearly": 86,
        "videos_per_month": 15,
        "max_video_length_minutes": 10,
        "max_resolution": "1080p",
        "storage_gb": 10,
        "presets": "all",
        "watermark": False,
        "priority_support": False,
        "api_access": False,
        "team_members": 1,
    },
    StripePlan.PRO: {
        "name": "Pro",
        "price_monthly": 29,
        "price_yearly": 278,
        "videos_per_month": 50,
        "max_video_length_minutes": 30,
        "max_resolution": "4K",
        "storage_gb": 50,
        "presets": "all+custom",
        "watermark": False,
        "priority_support": True,
        "api_access": True,
        "team_members": 3,
    },
    StripePlan.UNLIMITED: {
        "name": "Unlimited",
        "price_monthly": 79,
        "price_yearly": 758,
        "videos_per_month": -1,  # Unlimited
        "max_video_length_minutes": -1,  # Unlimited
        "max_resolution": "4K",
        "storage_gb": 200,
        "presets": "all+custom",
        "watermark": False,
        "priority_support": True,
        "api_access": True,
        "team_members": -1,  # Unlimited
    },
}


def get_plan_features(plan: str) -> Dict[str, Any]:
    """Get features for a specific plan"""
    try:
        plan_enum = StripePlan(plan)
        return PLAN_FEATURES.get(plan_enum, PLAN_FEATURES[StripePlan.FREE])
    except ValueError:
        return PLAN_FEATURES[StripePlan.FREE]


def get_price_id(plan: str, interval: str = "monthly") -> str | None:
    """Get Stripe price ID for a plan and billing interval"""
    if plan == StripePlan.FREE:
        return None
    
    try:
        plan_enum = StripePlan(plan)
        return STRIPE_PRICE_IDS.get(plan_enum, {}).get(interval)
    except ValueError:
        return None
