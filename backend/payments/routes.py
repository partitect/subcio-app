"""
Payment Routes - Stripe API endpoints with security features
"""
import logging
import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import stripe

# Handle imports for both package and direct execution
try:
    from auth.database import get_db
    from auth.models import User
    from auth.utils import get_current_user
except ImportError:
    from ..auth.database import get_db
    from ..auth.models import User
    from ..auth.utils import get_current_user

from .config import (
    STRIPE_PRICE_IDS,
    StripePlan,
    get_plan_features,
    get_price_id,
    STRIPE_SECRET_KEY,
)
from .stripe_service import StripeService

# Import security module
try:
    from security import (
        rate_limiter, WebhookVerifier, AuditLogger, CreditManager
    )
    SECURITY_ENABLED = True
except ImportError:
    try:
        from ..security import (
            rate_limiter, WebhookVerifier, AuditLogger, CreditManager
        )
        SECURITY_ENABLED = True
    except ImportError:
        SECURITY_ENABLED = False

# Configure logging
logger = logging.getLogger("subcio.payments")

router = APIRouter(prefix="/api/payments", tags=["Payments"])


# Request/Response Schemas
class CreateCheckoutRequest(BaseModel):
    plan: str  # 'creator', 'pro', 'enterprise'
    interval: str = "monthly"  # 'monthly' or 'yearly'


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class BillingPortalResponse(BaseModel):
    portal_url: str


class SubscriptionResponse(BaseModel):
    id: str
    status: str
    plan: Optional[str]
    current_period_start: str
    current_period_end: str
    cancel_at_period_end: bool
    canceled_at: Optional[str]
    trial_end: Optional[str]


class InvoiceResponse(BaseModel):
    id: str
    number: Optional[str]
    status: str
    amount_due: float
    amount_paid: float
    currency: str
    created: str
    hosted_invoice_url: Optional[str]
    invoice_pdf: Optional[str]


# Helper to ensure user has Stripe customer ID
async def ensure_stripe_customer(user: User, db: Session) -> str:
    """Ensure user has a Stripe customer ID, create if not exists"""
    if user.stripe_customer_id:
        return user.stripe_customer_id
    
    # Create Stripe customer
    customer = StripeService.create_customer(
        email=user.email,
        name=user.name,
        user_id=user.id,
    )
    
    # Save customer ID to user
    user.stripe_customer_id = customer.id
    db.commit()
    
    return customer.id


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for subscription"""
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured",
        )
    
    # Validate plan
    if request.plan not in [StripePlan.CREATOR, StripePlan.PRO, StripePlan.ENTERPRISE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan selected",
        )
    
    # Validate interval
    if request.interval not in ["monthly", "yearly"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid billing interval",
        )
    
    # Get price ID
    price_id = get_price_id(request.plan, request.interval)
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price not found for selected plan",
        )
    
    # Ensure user has Stripe customer
    customer_id = await ensure_stripe_customer(current_user, db)
    
    try:
        # Create checkout session
        session = StripeService.create_checkout_session(
            customer_id=customer_id,
            price_id=price_id,
            trial_days=7 if not current_user.stripe_subscription_id else 0,
            metadata={
                "user_id": str(current_user.id),
                "plan": request.plan,
            },
        )
        
        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
        )
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.user_message) if hasattr(e, 'user_message') else "Payment error occurred",
        )


@router.post("/create-billing-portal", response_model=BillingPortalResponse)
async def create_billing_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Billing Portal session for managing subscription"""
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured",
        )
    
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing information found",
        )
    
    try:
        session = StripeService.create_billing_portal_session(
            customer_id=current_user.stripe_customer_id,
        )
        
        return BillingPortalResponse(portal_url=session.url)
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.user_message) if hasattr(e, 'user_message') else "Billing portal error",
        )


@router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_subscription(
    current_user: User = Depends(get_current_user),
):
    """Get current user's subscription details"""
    
    if not current_user.stripe_subscription_id:
        return None
    
    try:
        subscription = StripeService.get_subscription(current_user.stripe_subscription_id)
        return SubscriptionResponse(**StripeService.format_subscription_data(subscription))
    
    except stripe.error.StripeError:
        return None


@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
):
    """Cancel current subscription at period end"""
    
    if not current_user.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription found",
        )
    
    try:
        subscription = StripeService.cancel_subscription(
            current_user.stripe_subscription_id,
            at_period_end=True,
        )
        
        return {
            "message": "Subscription will be canceled at the end of the billing period",
            "cancel_at": datetime.fromtimestamp(subscription.current_period_end).isoformat(),
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.user_message) if hasattr(e, 'user_message') else "Cancel error",
        )


@router.post("/reactivate-subscription")
async def reactivate_subscription(
    current_user: User = Depends(get_current_user),
):
    """Reactivate a subscription that was set to cancel"""
    
    if not current_user.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No subscription found",
        )
    
    try:
        subscription = StripeService.reactivate_subscription(current_user.stripe_subscription_id)
        
        return {
            "message": "Subscription reactivated successfully",
            "subscription": StripeService.format_subscription_data(subscription),
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.user_message) if hasattr(e, 'user_message') else "Reactivation error",
        )


@router.get("/invoices", response_model=list[InvoiceResponse])
async def get_invoices(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
):
    """Get user's invoice history"""
    
    if not current_user.stripe_customer_id:
        return []
    
    try:
        invoices = StripeService.get_invoices(current_user.stripe_customer_id, limit)
        return [InvoiceResponse(**StripeService.format_invoice_data(inv)) for inv in invoices]
    
    except stripe.error.StripeError:
        return []


@router.get("/upcoming-invoice")
async def get_upcoming_invoice(
    current_user: User = Depends(get_current_user),
):
    """Get the upcoming invoice for the current subscription"""
    
    if not current_user.stripe_customer_id:
        return None
    
    try:
        invoice = StripeService.get_upcoming_invoice(current_user.stripe_customer_id)
        if invoice:
            return StripeService.format_invoice_data(invoice)
        return None
    
    except stripe.error.StripeError:
        return None


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle Stripe webhook events with security verification"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        logger.warning("Webhook received without signature header")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing signature header",
        )
    
    try:
        event = StripeService.construct_webhook_event(payload, sig_header)
    except ValueError:
        logger.warning("Webhook received with invalid payload")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        logger.warning("Webhook signature verification failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )
    
    # Get event ID for duplicate protection
    event_id = event.get("id", "")
    
    # Check for duplicate event (replay attack prevention)
    if SECURITY_ENABLED and WebhookVerifier.is_duplicate_event(event_id):
        logger.info(f"Duplicate webhook event skipped: {event_id}")
        return {"status": "already_processed", "event_id": event_id}
    
    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]
    
    # Log webhook received
    if SECURITY_ENABLED:
        AuditLogger.log(
            db=db,
            action="WEBHOOK_RECEIVED",
            resource_type="stripe",
            resource_id=event_id,
            details={"event_type": event_type}
        )
    
    logger.info(f"Processing webhook: {event_type} ({event_id})")
    
    if event_type == "checkout.session.completed":
        # Payment successful, activate subscription
        await handle_checkout_completed(data, db)
    
    elif event_type == "customer.subscription.updated":
        # Subscription updated (upgrade, downgrade, cancel)
        await handle_subscription_updated(data, db)
    
    elif event_type == "customer.subscription.deleted":
        # Subscription canceled/expired
        await handle_subscription_deleted(data, db)
    
    elif event_type == "invoice.payment_succeeded":
        # Recurring payment successful
        await handle_payment_succeeded(data, db)
    
    elif event_type == "invoice.payment_failed":
        # Payment failed
        await handle_payment_failed(data, db)
    
    # Mark event as processed (prevent replay)
    if SECURITY_ENABLED:
        WebhookVerifier.mark_event_processed(event_id)
    
    return {"status": "success", "event_id": event_id}


# Webhook handlers
async def handle_checkout_completed(session: dict, db: Session):
    """Handle successful checkout with audit logging"""
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    
    if not customer_id or not subscription_id:
        return
    
    # Find user by Stripe customer ID
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"No user found for customer_id: {customer_id}")
        return
    
    # Get subscription details
    subscription = StripeService.get_subscription(subscription_id)
    price_id = subscription["items"]["data"][0]["price"]["id"] if subscription["items"]["data"] else None
    plan = StripeService.get_plan_from_price_id(price_id) if price_id else None
    
    old_plan = user.plan
    
    # Update user
    user.stripe_subscription_id = subscription_id
    if plan:
        user.plan = plan
        features = get_plan_features(plan)
        user.monthly_minutes_limit = features.get("videos_per_month", 3) * 5  # Approximate
        user.monthly_exports_limit = features.get("videos_per_month", 3)
        user.storage_limit_mb = features.get("storage_gb", 1) * 1024
    
    user.subscription_started_at = datetime.utcnow()
    user.subscription_ends_at = datetime.fromtimestamp(subscription["current_period_end"])
    
    db.commit()
    
    # Audit log
    if SECURITY_ENABLED:
        AuditLogger.log(
            db=db,
            action="SUBSCRIPTION_CREATE",
            user_id=user.id,
            resource_type="subscription",
            resource_id=subscription_id,
            details={
                "old_plan": old_plan,
                "new_plan": plan,
                "price_id": price_id,
            }
        )
    
    logger.info(f"Subscription created for user {user.id}: {old_plan} -> {plan}")


async def handle_subscription_updated(subscription: dict, db: Session):
    """Handle subscription update with audit logging"""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    
    if not customer_id:
        return
    
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"No user found for customer_id: {customer_id}")
        return
    
    old_plan = user.plan
    
    # Get new plan
    price_id = subscription["items"]["data"][0]["price"]["id"] if subscription["items"]["data"] else None
    plan = StripeService.get_plan_from_price_id(price_id) if price_id else None
    
    if plan:
        user.plan = plan
        features = get_plan_features(plan)
        user.monthly_minutes_limit = features.get("videos_per_month", 3) * 5
        user.monthly_exports_limit = features.get("videos_per_month", 3)
        user.storage_limit_mb = features.get("storage_gb", 1) * 1024
    
    user.subscription_ends_at = datetime.fromtimestamp(subscription["current_period_end"])
    user.stripe_subscription_id = subscription_id
    
    db.commit()
    
    # Audit log
    if SECURITY_ENABLED:
        AuditLogger.log(
            db=db,
            action="SUBSCRIPTION_UPDATE",
            user_id=user.id,
            resource_type="subscription",
            resource_id=subscription_id,
            details={
                "old_plan": old_plan,
                "new_plan": plan,
                "price_id": price_id,
            }
        )
    
    logger.info(f"Subscription updated for user {user.id}: {old_plan} -> {plan}")


async def handle_subscription_deleted(subscription: dict, db: Session):
    """Handle subscription cancellation/deletion with audit logging"""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    
    if not customer_id:
        return
    
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"No user found for customer_id: {customer_id}")
        return
    
    old_plan = user.plan
    
    # Downgrade to free plan
    user.plan = StripePlan.FREE
    user.stripe_subscription_id = None
    user.subscription_ends_at = None
    
    # Reset to free plan limits
    features = get_plan_features(StripePlan.FREE)
    user.monthly_minutes_limit = features.get("videos_per_month", 3) * 5
    user.monthly_exports_limit = features.get("videos_per_month", 3)
    user.storage_limit_mb = features.get("storage_gb", 1) * 1024
    
    db.commit()
    
    # Audit log
    if SECURITY_ENABLED:
        AuditLogger.log(
            db=db,
            action="SUBSCRIPTION_CANCEL",
            user_id=user.id,
            resource_type="subscription",
            resource_id=subscription_id,
            details={
                "old_plan": old_plan,
                "new_plan": StripePlan.FREE,
            }
        )
    
    logger.info(f"Subscription cancelled for user {user.id}: {old_plan} -> free")


async def handle_payment_succeeded(invoice: dict, db: Session):
    """Handle successful payment (for recurring billing) with audit logging"""
    customer_id = invoice.get("customer")
    invoice_id = invoice.get("id")
    amount_paid = invoice.get("amount_paid", 0) / 100  # Convert from cents
    
    if not customer_id:
        return
    
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"No user found for customer_id: {customer_id}")
        return
    
    # Reset monthly usage on new billing cycle
    user.monthly_minutes_used = 0.0
    user.monthly_exports_used = 0
    
    db.commit()
    
    # Audit log
    if SECURITY_ENABLED:
        AuditLogger.log(
            db=db,
            action="PAYMENT_SUCCESS",
            user_id=user.id,
            resource_type="invoice",
            resource_id=invoice_id,
            details={
                "amount": amount_paid,
                "plan": user.plan,
            }
        )
    
    logger.info(f"Payment succeeded for user {user.id}: ${amount_paid}")


async def handle_payment_failed(invoice: dict, db: Session):
    """Handle failed payment with audit logging"""
    customer_id = invoice.get("customer")
    invoice_id = invoice.get("id")
    amount_due = invoice.get("amount_due", 0) / 100  # Convert from cents
    
    if not customer_id:
        return
    
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"No user found for customer_id: {customer_id}")
        return
    
    # Audit log
    if SECURITY_ENABLED:
        AuditLogger.log(
            db=db,
            action="PAYMENT_FAILED",
            user_id=user.id,
            resource_type="invoice",
            resource_id=invoice_id,
            status="failure",
            details={
                "amount": amount_due,
                "plan": user.plan,
            }
        )
    
    logger.warning(f"Payment failed for user {user.id}: ${amount_due}")
    
    # In production, you might want to:
    # - Send an email to the user
    # - Add a grace period
    # - Downgrade after multiple failures
