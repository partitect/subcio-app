/**
 * Subcio Brand Configuration
 * 
 * Central configuration for all brand-related assets and settings
 */

export const BRAND = {
  // Brand Identity
  name: "Subcio",
  tagline: "AI-Powered Styled Subtitles",
  description: "Create stunning animated subtitles for your videos with AI-powered transcription and 50+ style presets.",
  
  // URLs (update when domains are purchased)
  website: "https://subcio.io",
  app: "https://app.subcio.io",
  docs: "https://docs.subcio.io",
  blog: "https://blog.subcio.io",
  
  // Social Media
  social: {
    twitter: "@subcio_app",
    github: "subcio",
    discord: "subcio",
    youtube: "@subcio",
  },
  
  // Legal
  company: "Subcio",
  copyright: (year: number) => `© ${year} Subcio. All rights reserved.`,
  
  // Contact
  email: {
    support: "support@subcio.io",
    hello: "hello@subcio.io",
    business: "business@subcio.io",
  },
} as const;

// Brand Colors - Subcio Color Palette
export const BRAND_COLORS = {
  // Primary - Modern Indigo/Violet gradient
  primary: {
    main: "#6366F1",      // Indigo-500
    light: "#818CF8",     // Indigo-400
    dark: "#4F46E5",      // Indigo-600
    gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  },
  
  // Secondary - Soft Pink/Rose
  secondary: {
    main: "#F472B6",      // Pink-400
    light: "#F9A8D4",     // Pink-300
    dark: "#EC4899",      // Pink-500
    gradient: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)",
  },
  
  // Accent - Teal/Cyan
  accent: {
    main: "#14B8A6",      // Teal-500
    light: "#2DD4BF",     // Teal-400
    dark: "#0D9488",      // Teal-600
    gradient: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)",
  },
  
  // Background
  background: {
    dark: "#0F0F1A",      // Deep purple-black
    paper: "#1A1A2E",     // Slightly lighter
    elevated: "#252540",  // Card backgrounds
  },
  
  // Text
  text: {
    primary: "#FFFFFF",
    secondary: "#A1A1AA",
    muted: "#71717A",
  },
} as const;

// Logo Text Variants
export const LOGO_VARIANTS = {
  full: "Subcio",
  short: "S",
  withTagline: "Subcio - AI-Powered Styled Subtitles",
} as const;

// SEO Meta Tags
export const SEO = {
  title: "Subcio - AI-Powered Styled Subtitles",
  description: "Create stunning animated subtitles for your videos with AI-powered transcription and 50+ style presets. Perfect for YouTubers, TikTokers, and content creators.",
  keywords: [
    "subtitle generator",
    "AI captions",
    "animated subtitles",
    "video subtitles",
    "auto captions",
    "tiktok captions",
    "youtube subtitles",
    "styled captions",
    "pyonfx",
    "karaoke subtitles",
  ],
  ogImage: "/og-image.png",
  twitterCard: "summary_large_image",
} as const;

// App Store / Product Info
export const PRODUCT = {
  version: "0.1.0",
  releaseDate: "2025",
  category: "Video & Movies",
  pricing: "Freemium",
  platforms: ["Web", "Desktop (coming soon)"],
} as const;

export default BRAND;
