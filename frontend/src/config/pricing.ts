/**
 * Subscription Plans Configuration
 * 
 * PyCaps - AI-Powered Styled Subtitle Generator
 */

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  features: string[];
  limitations: {
    videosPerMonth: number | "unlimited";
    maxVideoLength: number; // in minutes
    maxResolution: string;
    storageGB: number;
    presets: "basic" | "all" | "all+custom";
    watermark: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    teamMembers: number;
  };
  popular?: boolean;
  badge?: string;
  cta: string;
  ctaVariant: "outlined" | "contained";
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    description: "Perfect for trying out PyCaps",
    price: {
      monthly: 0,
      yearly: 0,
    },
    currency: "USD",
    features: [
      "3 videos per month",
      "Up to 5 min video length",
      "720p export quality",
      "10 basic presets",
      "1GB storage",
      "PyCaps watermark",
    ],
    limitations: {
      videosPerMonth: 3,
      maxVideoLength: 5,
      maxResolution: "720p",
      storageGB: 1,
      presets: "basic",
      watermark: true,
      prioritySupport: false,
      apiAccess: false,
      teamMembers: 1,
    },
    cta: "Get Started Free",
    ctaVariant: "outlined",
  },
  {
    id: "creator",
    name: "Creator",
    description: "For content creators & YouTubers",
    price: {
      monthly: 19,
      yearly: 190, // ~17% discount
    },
    currency: "USD",
    features: [
      "30 videos per month",
      "Up to 30 min video length",
      "1080p export quality",
      "All 50+ presets",
      "25GB storage",
      "No watermark",
      "Custom fonts upload",
      "Email support",
    ],
    limitations: {
      videosPerMonth: 30,
      maxVideoLength: 30,
      maxResolution: "1080p",
      storageGB: 25,
      presets: "all",
      watermark: false,
      prioritySupport: false,
      apiAccess: false,
      teamMembers: 1,
    },
    popular: true,
    badge: "Most Popular",
    cta: "Start Free Trial",
    ctaVariant: "contained",
  },
  {
    id: "pro",
    name: "Professional",
    description: "For agencies & power users",
    price: {
      monthly: 49,
      yearly: 470, // ~20% discount
    },
    currency: "USD",
    features: [
      "Unlimited videos",
      "Unlimited video length",
      "4K export quality",
      "All presets + custom creation",
      "100GB storage",
      "No watermark",
      "Priority rendering queue",
      "API access",
      "Priority support",
    ],
    limitations: {
      videosPerMonth: "unlimited",
      maxVideoLength: 999,
      maxResolution: "4K",
      storageGB: 100,
      presets: "all+custom",
      watermark: false,
      prioritySupport: true,
      apiAccess: true,
      teamMembers: 3,
    },
    badge: "Best Value",
    cta: "Start Free Trial",
    ctaVariant: "contained",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For teams & organizations",
    price: {
      monthly: 149,
      yearly: 1428, // ~20% discount
    },
    currency: "USD",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "500GB storage",
      "White-label exports",
      "Custom branding",
      "Dedicated account manager",
      "SLA guarantee",
      "SSO integration",
      "Custom API limits",
    ],
    limitations: {
      videosPerMonth: "unlimited",
      maxVideoLength: 999,
      maxResolution: "4K",
      storageGB: 500,
      presets: "all+custom",
      watermark: false,
      prioritySupport: true,
      apiAccess: true,
      teamMembers: 999,
    },
    cta: "Contact Sales",
    ctaVariant: "outlined",
  },
];

export const FEATURES_COMPARISON = [
  { name: "Videos per month", free: "3", creator: "30", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Max video length", free: "5 min", creator: "30 min", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Export quality", free: "720p", creator: "1080p", pro: "4K", enterprise: "4K" },
  { name: "Storage", free: "1GB", creator: "25GB", pro: "100GB", enterprise: "500GB" },
  { name: "Presets", free: "10 basic", creator: "50+", pro: "50+ & custom", enterprise: "50+ & custom" },
  { name: "Watermark", free: "Yes", creator: "No", pro: "No", enterprise: "No" },
  { name: "Custom fonts", free: "No", creator: "Yes", pro: "Yes", enterprise: "Yes" },
  { name: "API access", free: "No", creator: "No", pro: "Yes", enterprise: "Yes" },
  { name: "Team members", free: "1", creator: "1", pro: "3", enterprise: "Unlimited" },
  { name: "Support", free: "Community", creator: "Email", pro: "Priority", enterprise: "Dedicated" },
];

export const FAQ_ITEMS = [
  {
    question: "What is PyCaps?",
    answer: "PyCaps is an AI-powered subtitle generator that creates beautifully styled captions for your videos. Using advanced PyonFX effects, you can create professional-looking subtitles with animations, colors, and custom fonts.",
  },
  {
    question: "How does the free trial work?",
    answer: "All paid plans come with a 7-day free trial. No credit card required to start. You can cancel anytime during the trial period without being charged.",
  },
  {
    question: "Can I change my plan later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies from your next billing cycle.",
  },
  {
    question: "What video formats are supported?",
    answer: "PyCaps supports all major video formats including MP4, MOV, AVI, MKV, and WebM. Audio files (MP3, WAV, M4A) are also supported for audio-only projects.",
  },
  {
    question: "How accurate is the AI transcription?",
    answer: "Our AI transcription powered by Whisper achieves 95%+ accuracy for clear audio in over 50 languages. You can always edit the transcription manually for perfect results.",
  },
  {
    question: "Can I use my own fonts?",
    answer: "Creator plan and above allows you to upload custom fonts (TTF, OTF). Your fonts are stored securely and can be used across all your projects.",
  },
  {
    question: "What's included in the API access?",
    answer: "Professional and Enterprise plans include REST API access for automated workflows. You can programmatically upload videos, generate subtitles, apply styles, and export - perfect for batch processing.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "YouTuber • 2.5M subscribers",
    avatar: "https://i.pravatar.cc/150?img=1",
    content: "PyCaps saved me hours every week. The animated subtitles look incredible and my viewers love them!",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Video Editor, Creative Agency",
    avatar: "https://i.pravatar.cc/150?img=3",
    content: "The preset library is amazing. We use PyCaps for all our client projects now. The quality is unmatched.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "TikTok Creator • 500K followers",
    avatar: "https://i.pravatar.cc/150?img=5",
    content: "Finally, a subtitle tool that doesn't make my videos look amateur. The styles are fire! 🔥",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Podcast Host",
    avatar: "https://i.pravatar.cc/150?img=7",
    content: "Converting my podcast clips to video with styled captions has never been easier. Highly recommend!",
    rating: 5,
  },
];

export const STATS = [
  { value: "50K+", label: "Videos Created" },
  { value: "10K+", label: "Happy Users" },
  { value: "50+", label: "Style Presets" },
  { value: "99.9%", label: "Uptime" },
];
