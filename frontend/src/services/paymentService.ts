/**
 * Payment/Subscription API service
 */

import { getAccessToken, authFetch } from './authService';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/payments`;

// Types
export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export interface BillingPortal {
  portal_url: string;
}

export interface Subscription {
  id: string;
  status: string;
  plan: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_end: string | null;
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }
  return response.json();
}

/**
 * Create headers with auth token
 */
function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  plan: 'creator' | 'pro' | 'enterprise',
  interval: 'monthly' | 'yearly' = 'monthly'
): Promise<CheckoutSession> {
  const response = await fetch(`${API_BASE}/create-checkout-session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan, interval }),
  });
  
  return handleResponse<CheckoutSession>(response);
}

/**
 * Create a billing portal session
 */
export async function createBillingPortal(): Promise<BillingPortal> {
  const response = await fetch(`${API_BASE}/create-billing-portal`, {
    method: 'POST',
    headers: authHeaders(),
  });
  
  return handleResponse<BillingPortal>(response);
}

/**
 * Get current subscription
 */
export async function getSubscription(): Promise<Subscription | null> {
  const response = await fetch(`${API_BASE}/subscription`, {
    method: 'GET',
    headers: authHeaders(),
  });
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  const text = await response.text();
  if (!text || text === 'null') {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(): Promise<{ message: string; cancel_at: string }> {
  const response = await fetch(`${API_BASE}/cancel-subscription`, {
    method: 'POST',
    headers: authHeaders(),
  });
  
  return handleResponse<{ message: string; cancel_at: string }>(response);
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(): Promise<{ message: string; subscription: Subscription }> {
  const response = await fetch(`${API_BASE}/reactivate-subscription`, {
    method: 'POST',
    headers: authHeaders(),
  });
  
  return handleResponse<{ message: string; subscription: Subscription }>(response);
}

/**
 * Get invoice history
 */
export async function getInvoices(limit: number = 10): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE}/invoices?limit=${limit}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  
  return handleResponse<Invoice[]>(response);
}

/**
 * Get upcoming invoice
 */
export async function getUpcomingInvoice(): Promise<Invoice | null> {
  const response = await fetch(`${API_BASE}/upcoming-invoice`, {
    method: 'GET',
    headers: authHeaders(),
  });
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  const text = await response.text();
  if (!text || text === 'null') {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Redirect to checkout page
 */
export async function redirectToCheckout(
  plan: 'creator' | 'pro' | 'enterprise',
  interval: 'monthly' | 'yearly' = 'monthly'
): Promise<void> {
  const session = await createCheckoutSession(plan, interval);
  window.location.href = session.checkout_url;
}

/**
 * Redirect to billing portal
 */
export async function redirectToBillingPortal(): Promise<void> {
  const portal = await createBillingPortal();
  window.location.href = portal.portal_url;
}
