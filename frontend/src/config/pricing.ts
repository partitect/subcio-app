/**
 * Subscription Plans Configuration
 * 
 * Subcio - AI-Powered Styled Subtitle Generator
 * 
 * Pricing Strategy: Simple video count + duration limits
 * Target: Content creators, YouTubers, TikTokers, Podcasters
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
    name: "Free",
    description: "Try Subcio with basic features",
    price: {
      monthly: 0,
      yearly: 0,
    },
    currency: "USD",
    features: [
      "3 videos per month",
      "Up to 3 min per video",
      "720p export quality",
      "10 basic presets",
      "500MB storage",
      "Subcio watermark",
      "Community support",
    ],
    limitations: {
      videosPerMonth: 3,
      maxVideoLength: 3,
      maxResolution: "720p",
      storageGB: 0.5,
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
    id: "starter",
    name: "Starter",
    description: "Perfect for TikTok & Reels creators",
    price: {
      monthly: 9,
      yearly: 81, // 25% off (3 months free)
    },
    currency: "USD",
    features: [
      "15 videos per month",
      "Up to 10 min per video",
      "1080p export quality",
      "All 50+ presets",
      "5GB storage",
      "No watermark",
      "Email support",
    ],
    limitations: {
      videosPerMonth: 15,
      maxVideoLength: 10,
      maxResolution: "1080p",
      storageGB: 5,
      presets: "all",
      watermark: false,
      prioritySupport: false,
      apiAccess: false,
      teamMembers: 1,
    },
    cta: "Start 7-Day Free Trial",
    ctaVariant: "contained",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For YouTubers & serious creators",
    price: {
      monthly: 29,
      yearly: 261, // 25% off (3 months free)
    },
    currency: "USD",
    features: [
      "50 videos per month",
      "Up to 30 min per video",
      "4K export quality",
      "All presets + custom fonts",
      "25GB storage",
      "No watermark",
      "Priority rendering",
      "Priority support",
    ],
    limitations: {
      videosPerMonth: 50,
      maxVideoLength: 30,
      maxResolution: "4K",
      storageGB: 25,
      presets: "all",
      watermark: false,
      prioritySupport: true,
      apiAccess: false,
      teamMembers: 1,
    },
    popular: true,
    badge: "Most Popular",
    cta: "Start 7-Day Free Trial",
    ctaVariant: "contained",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    description: "For agencies & power users",
    price: {
      monthly: 79,
      yearly: 711, // 25% off (3 months free)
    },
    currency: "USD",
    features: [
      "Unlimited videos",
      "Unlimited video length",
      "4K export quality",
      "All presets + custom creation",
      "100GB storage",
      "No watermark",
      "Priority rendering",
      "API access",
      "Dedicated support",
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
    cta: "Start 7-Day Free Trial",
    ctaVariant: "contained",
  },
];

export const FEATURES_COMPARISON = [
  { name: "Videos per month", free: "3", starter: "15", pro: "50", unlimited: "Unlimited" },
  { name: "Max video length", free: "3 min", starter: "10 min", pro: "30 min", unlimited: "Unlimited" },
  { name: "Export quality", free: "720p", starter: "1080p", pro: "4K", unlimited: "4K" },
  { name: "Storage", free: "500MB", starter: "5GB", pro: "25GB", unlimited: "100GB" },
  { name: "Presets", free: "10 basic", starter: "50+", pro: "50+ & fonts", unlimited: "50+ & custom" },
  { name: "Watermark", free: "Yes", starter: "No", pro: "No", unlimited: "No" },
  { name: "Custom fonts", free: "No", starter: "No", pro: "Yes", unlimited: "Yes" },
  { name: "Priority rendering", free: "No", starter: "No", pro: "Yes", unlimited: "Yes" },
  { name: "API access", free: "No", starter: "No", pro: "No", unlimited: "Yes" },
  { name: "Support", free: "Community", starter: "Email", pro: "Priority", unlimited: "Dedicated" },
];

export const FAQ_ITEMS = [
  {
    question: "What is Subcio?",
    answer: "Subcio is an AI-powered subtitle generator that creates beautifully styled captions for your videos. Using advanced PyonFX effects, you can create professional-looking subtitles with animations, colors, and custom fonts.",
  },
  {
    question: "How does the free trial work?",
    answer: "All paid plans come with a 7-day free trial. No credit card required to start. You can cancel anytime during the trial period without being charged.",
  },
  {
    question: "What happens when I reach my video limit?",
    answer: "When you reach your monthly video limit, you can either wait for next month's reset or upgrade to a higher plan. Your existing projects remain accessible.",
  },
  {
    question: "Can I change my plan later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, changes apply from your next billing cycle.",
  },
  {
    question: "What video formats are supported?",
    answer: "Subcio supports all major video formats including MP4, MOV, AVI, MKV, and WebM. Audio files (MP3, WAV, M4A) are also supported for audio-only projects.",
  },
  {
    question: "How accurate is the AI transcription?",
    answer: "Our AI transcription powered by Whisper achieves 95%+ accuracy for clear audio in over 50 languages. You can always edit the transcription manually for perfect results.",
  },
  {
    question: "Can I use my own fonts?",
    answer: "Pro plan and above allows you to upload custom fonts (TTF, OTF). Your fonts are stored securely and can be used across all your projects.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund.",
  },
  {
    question: "Is there a yearly discount?",
    answer: "Yes! Pay yearly and get 25% off - that's 3 months free. The discount is automatically applied when you select annual billing.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "YouTuber • 2.5M subscribers",
    avatar: "https://i.pravatar.cc/150?img=1",
    content: "Subcio saved me hours every week. The animated subtitles look incredible and my viewers love them!",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Video Editor, Creative Agency",
    avatar: "https://i.pravatar.cc/150?img=3",
    content: "The preset library is amazing. We use Subcio for all our client projects now. The quality is unmatched.",
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

// ==================== Launch Configuration ====================

// Early Bird Pricing (for launch)
export const EARLY_BIRD_CONFIG = {
  enabled: true,           // Toggle for launch
  discount: 0.5,           // 50% off
  totalSlots: 100,         // First 100 users
  remainingSlots: 100,     // Update as users sign up
  endDate: "2026-01-31",   // Early bird end date
};

// Lifetime Deal (optional - for AppSumo, etc.)
export const LIFETIME_DEAL_CONFIG = {
  enabled: false,
  price: 149,              // One-time payment
  equivalentPlan: "pro",   // Which plan features they get
  totalCodes: 500,
};
