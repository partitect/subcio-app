/**
 * Font Service
 * Fetches available fonts from backend API and provides URLs for JASSUB
 */

import { getAssetPath } from './assetPath';

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Font entry from backend
export interface FontEntry {
    name: string;  // Display name (e.g., "Road Rage")
    file: string;  // Filename (e.g., "RoadRage-Regular.ttf")
}

// Cached fonts list
let cachedFonts: FontEntry[] | null = null;

/**
 * Fetch available fonts from backend API
 */
export async function fetchFonts(): Promise<FontEntry[]> {
    if (cachedFonts) {
        return cachedFonts;
    }

    try {
        const response = await fetch(`${API_BASE}/api/fonts`);
        if (!response.ok) {
            console.warn('[FontService] Failed to fetch fonts from API');
            return [];
        }
        const data = await response.json();
        cachedFonts = data.fonts || [];
        console.log(`[FontService] Loaded ${cachedFonts.length} fonts from API`);
        return cachedFonts;
    } catch (error) {
        console.error('[FontService] Error fetching fonts:', error);
        return [];
    }
}

/**
 * Get font URLs for JASSUB
 * These are served from the frontend public/fonts folder
 */
export function getFontUrls(fonts: FontEntry[]): string[] {
    return fonts.map(font => getAssetPath(`fonts/${font.file}`));
}

/**
 * Get all available font URLs for JASSUB
 */
export async function getAllFontUrls(): Promise<string[]> {
    const fonts = await fetchFonts();
    return getFontUrls(fonts);
}

/**
 * Get font name to URL mapping for JASSUB availableFonts parameter
 * This maps the font family name (as used in ASS) to the font file URL
 */
export async function getFontMapping(): Promise<Record<string, string>> {
    const fonts = await fetchFonts();
    const mapping: Record<string, string> = {};

    for (const font of fonts) {
        const url = getAssetPath(`fonts/${font.file}`);
        // Map font name (e.g., "Road Rage") to URL
        mapping[font.name] = url;
        // Also add lowercase version for case-insensitive matching
        mapping[font.name.toLowerCase()] = url;
        // Add version without spaces
        mapping[font.name.replace(/\s+/g, '')] = url;
    }

    console.log(`[FontService] Created font mapping with ${Object.keys(mapping).length} entries`);
    return mapping;
}

/**
 * Find font entry by name (case-insensitive)
 */
export function findFontByName(fonts: FontEntry[], name: string): FontEntry | undefined {
    const normalizedName = name.toLowerCase().replace(/[\s_-]+/g, '');
    return fonts.find(f =>
        f.name.toLowerCase().replace(/[\s_-]+/g, '') === normalizedName
    );
}

/**
 * Get font URL by name
 */
export async function getFontUrlByName(name: string): Promise<string | null> {
    const fonts = await fetchFonts();
    const font = findFontByName(fonts, name);
    if (font) {
        return getAssetPath(`fonts/${font.file}`);
    }
    return null;
}

/**
 * Default fonts to use if API fails
 */
export function getDefaultFontUrls(): string[] {
    return [
        getAssetPath("fonts/Bungee-Regular.ttf"),
        getAssetPath("fonts/RubikSprayPaint-Regular.ttf"),
        getAssetPath("fonts/LuckiestGuy-Regular.ttf"),
        getAssetPath("fonts/Grandstander-ExtraBold.ttf"),
        getAssetPath("fonts/Nunito-ExtraBold.ttf"),
        getAssetPath("fonts/RoadRage-Regular.ttf"),
        getAssetPath("fonts/Bangers-Regular.ttf"),
        getAssetPath("fonts/CherryBombOne-Regular.ttf"),
        getAssetPath("fonts/Coiny-Regular.ttf"),
        getAssetPath("fonts/PatrickHand-Regular.ttf"),
    ];
}

/**
 * Get default font mapping for fallback
 */
export function getDefaultFontMapping(): Record<string, string> {
    return {
        'Bungee': getAssetPath("fonts/Bungee-Regular.ttf"),
        'Rubik Spray Paint': getAssetPath("fonts/RubikSprayPaint-Regular.ttf"),
        'Luckiest Guy': getAssetPath("fonts/LuckiestGuy-Regular.ttf"),
        'Grandstander': getAssetPath("fonts/Grandstander-ExtraBold.ttf"),
        'Nunito': getAssetPath("fonts/Nunito-ExtraBold.ttf"),
        'Road Rage': getAssetPath("fonts/RoadRage-Regular.ttf"),
        'Bangers': getAssetPath("fonts/Bangers-Regular.ttf"),
        'Cherry Bomb One': getAssetPath("fonts/CherryBombOne-Regular.ttf"),
        'Coiny': getAssetPath("fonts/Coiny-Regular.ttf"),
        'Patrick Hand': getAssetPath("fonts/PatrickHand-Regular.ttf"),
    };
}

export { cachedFonts };
