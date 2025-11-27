"""
Stripe Service - Handle all Stripe API interactions
"""
import stripe
from datetime import datetime
from typing import Optional, Dict, Any
from .config import (
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    FRONTEND_URL,
    STRIPE_PRICE_IDS,
    StripePlan,
    get_plan_features,
)

# Initialize Stripe
stripe.api_key = STRIPE_SECRET_KEY


class StripeService:
    """Service class for Stripe operations"""
    
    @staticmethod
    def create_customer(email: str, name: Optional[str] = None, user_id: int = None) -> stripe.Customer:
        """Create a new Stripe customer"""
        metadata = {}
        if user_id:
            metadata["user_id"] = str(user_id)
        
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata=metadata,
        )
        return customer
    
    @staticmethod
    def get_customer(customer_id: str) -> stripe.Customer:
        """Get a Stripe customer by ID"""
        return stripe.Customer.retrieve(customer_id)
    
    @staticmethod
    def create_checkout_session(
        customer_id: str,
        price_id: str,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        trial_days: int = 7,
        metadata: Optional[Dict[str, str]] = None,
    ) -> stripe.checkout.Session:
        """Create a Stripe Checkout session for subscription"""
        
        if not success_url:
            success_url = f"{FRONTEND_URL}/settings?tab=billing&success=true"
        if not cancel_url:
            cancel_url = f"{FRONTEND_URL}/pricing?canceled=true"
        
        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [
                {
                    "price": price_id,
                    "quantity": 1,
                },
            ],
            "mode": "subscription",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "allow_promotion_codes": True,
            "billing_address_collection": "auto",
        }
        
        # Add trial period for new subscriptions
        if trial_days > 0:
            session_params["subscription_data"] = {
                "trial_period_days": trial_days,
            }
        
        if metadata:
            session_params["metadata"] = metadata
        
        session = stripe.checkout.Session.create(**session_params)
        return session
    
    @staticmethod
    def create_billing_portal_session(
        customer_id: str,
        return_url: Optional[str] = None,
    ) -> stripe.billing_portal.Session:
        """Create a Stripe Billing Portal session for managing subscription"""
        
        if not return_url:
            return_url = f"{FRONTEND_URL}/settings?tab=billing"
        
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session
    
    @staticmethod
    def get_subscription(subscription_id: str) -> stripe.Subscription:
        """Get a Stripe subscription by ID"""
        return stripe.Subscription.retrieve(subscription_id)
    
    @staticmethod
    def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> stripe.Subscription:
        """Cancel a subscription (at period end by default)"""
        if at_period_end:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True,
            )
        else:
            return stripe.Subscription.delete(subscription_id)
    
    @staticmethod
    def reactivate_subscription(subscription_id: str) -> stripe.Subscription:
        """Reactivate a subscription that was set to cancel at period end"""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False,
        )
    
    @staticmethod
    def get_invoices(customer_id: str, limit: int = 10) -> list:
        """Get customer's invoices"""
        invoices = stripe.Invoice.list(
            customer=customer_id,
            limit=limit,
        )
        return invoices.data
    
    @staticmethod
    def get_upcoming_invoice(customer_id: str) -> Optional[stripe.Invoice]:
        """Get the upcoming invoice for a customer"""
        try:
            return stripe.Invoice.upcoming(customer=customer_id)
        except stripe.error.InvalidRequestError:
            return None
    
    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
        """Construct and verify a webhook event"""
        return stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    
    @staticmethod
    def get_plan_from_price_id(price_id: str) -> Optional[str]:
        """Get plan name from Stripe price ID"""
        for plan, prices in STRIPE_PRICE_IDS.items():
            if price_id in prices.values():
                return plan
        return None
    
    @staticmethod
    def format_subscription_data(subscription: stripe.Subscription) -> Dict[str, Any]:
        """Format subscription data for API response"""
        
        # Get the plan from the price ID
        price_id = subscription["items"]["data"][0]["price"]["id"] if subscription["items"]["data"] else None
        plan = StripeService.get_plan_from_price_id(price_id) if price_id else None
        
        return {
            "id": subscription["id"],
            "status": subscription["status"],
            "plan": plan,
            "current_period_start": datetime.fromtimestamp(subscription["current_period_start"]).isoformat(),
            "current_period_end": datetime.fromtimestamp(subscription["current_period_end"]).isoformat(),
            "cancel_at_period_end": subscription["cancel_at_period_end"],
            "canceled_at": datetime.fromtimestamp(subscription["canceled_at"]).isoformat() if subscription.get("canceled_at") else None,
            "trial_end": datetime.fromtimestamp(subscription["trial_end"]).isoformat() if subscription.get("trial_end") else None,
        }
    
    @staticmethod
    def format_invoice_data(invoice: stripe.Invoice) -> Dict[str, Any]:
        """Format invoice data for API response"""
        return {
            "id": invoice["id"],
            "number": invoice.get("number"),
            "status": invoice["status"],
            "amount_due": invoice["amount_due"] / 100,  # Convert from cents
            "amount_paid": invoice["amount_paid"] / 100,
            "currency": invoice["currency"].upper(),
            "created": datetime.fromtimestamp(invoice["created"]).isoformat(),
            "hosted_invoice_url": invoice.get("hosted_invoice_url"),
            "invoice_pdf": invoice.get("invoice_pdf"),
        }
