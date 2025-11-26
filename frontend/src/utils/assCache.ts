/**
 * ASS Preview Caching System
 * 
 * Caches ASS content based on words + style hash to avoid redundant API calls.
 * Uses LRU-style eviction when cache size exceeds limit.
 */

import { StyleConfig, WordCue } from "../types";

interface CacheEntry {
  assContent: string;
  timestamp: number;
}

interface AssCache {
  cache: Map<string, CacheEntry>;
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

// Create a deterministic hash from words and style
export function createCacheKey(words: WordCue[], style: StyleConfig): string {
  // Create a simplified representation for hashing
  const wordsKey = words.map(w => `${w.start}:${w.end}:${w.text}`).join("|");
  
  // Only include style properties that affect ASS output
  const styleKey = JSON.stringify({
    id: style.id,
    font: style.font,
    font_size: style.font_size,
    primary_color: style.primary_color,
    secondary_color: style.secondary_color,
    outline_color: style.outline_color,
    shadow_color: style.shadow_color,
    back_color: style.back_color,
    bold: style.bold,
    italic: style.italic,
    underline: style.underline,
    strikeout: style.strikeout,
    border: style.border,
    shadow: style.shadow,
    blur: style.blur,
    shadow_blur: style.shadow_blur,
    alignment: style.alignment,
    margin_v: style.margin_v,
    margin_l: style.margin_l,
    margin_r: style.margin_r,
    letter_spacing: style.letter_spacing,
    effect_type: style.effect_type,
    effect_config: style.effect_config,
  });

  // Simple hash function
  const combined = wordsKey + "||" + styleKey;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Global cache instance
const assCache: AssCache = {
  cache: new Map(),
  maxSize: 50, // Store up to 50 different ASS contents
  ttl: 5 * 60 * 1000, // 5 minutes TTL
};

/**
 * Get cached ASS content if available and not expired
 */
export function getCachedAss(words: WordCue[], style: StyleConfig): string | null {
  const key = createCacheKey(words, style);
  const entry = assCache.cache.get(key);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > assCache.ttl) {
    assCache.cache.delete(key);
    return null;
  }
  
  return entry.assContent;
}

/**
 * Store ASS content in cache
 */
export function setCachedAss(words: WordCue[], style: StyleConfig, assContent: string): void {
  const key = createCacheKey(words, style);
  
  // Evict oldest entries if cache is full
  if (assCache.cache.size >= assCache.maxSize) {
    const oldestKey = assCache.cache.keys().next().value;
    if (oldestKey) {
      assCache.cache.delete(oldestKey);
    }
  }
  
  assCache.cache.set(key, {
    assContent,
    timestamp: Date.now(),
  });
}

/**
 * Clear all cached entries
 */
export function clearAssCache(): void {
  assCache.cache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getAssCacheStats(): { size: number; maxSize: number; keys: string[] } {
  return {
    size: assCache.cache.size,
    maxSize: assCache.maxSize,
    keys: Array.from(assCache.cache.keys()),
  };
}

/**
 * Check if words have changed (for diff-based updates)
 */
export function hasWordsChanged(prevWords: WordCue[], nextWords: WordCue[]): boolean {
  if (prevWords.length !== nextWords.length) return true;
  
  for (let i = 0; i < prevWords.length; i++) {
    const prev = prevWords[i];
    const next = nextWords[i];
    if (prev.start !== next.start || prev.end !== next.end || prev.text !== next.text) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if style has changed (only properties that affect ASS output)
 */
export function hasStyleChanged(prevStyle: StyleConfig, nextStyle: StyleConfig): boolean {
  const relevantKeys: (keyof StyleConfig)[] = [
    'id', 'font', 'font_size', 'primary_color', 'secondary_color',
    'outline_color', 'shadow_color', 'back_color', 'bold', 'italic',
    'underline', 'strikeout', 'border', 'shadow', 'blur', 'shadow_blur',
    'alignment', 'margin_v', 'margin_l', 'margin_r', 'letter_spacing',
    'effect_type',
  ];

  for (const key of relevantKeys) {
    if (prevStyle[key] !== nextStyle[key]) return true;
  }

  // Deep compare effect_config
  const prevConfig = JSON.stringify(prevStyle.effect_config || {});
  const nextConfig = JSON.stringify(nextStyle.effect_config || {});
  if (prevConfig !== nextConfig) return true;

  return false;
}
