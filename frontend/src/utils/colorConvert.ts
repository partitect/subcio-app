/**
 * Color conversion utilities for ASS subtitle format
 * ASS uses BGR format with alpha: &HAABBGGRR
 */

/**
 * Convert ASS color format to HEX
 * @param ass - ASS color string (e.g., "&H00FFFFFF" or "&H0000d5ff")
 * @returns HEX color string (e.g., "#ffffff")
 */
export const assToHex = (ass?: string): string => {
  if (!ass) return "#ffffff";
  if (ass.startsWith("#")) return ass;
  
  const clean = ass.replace("&H", "").replace("&h", "").replace(/&/g, "");
  const padded = clean.padStart(8, "0");
  const b = padded.slice(2, 4);
  const g = padded.slice(4, 6);
  const r = padded.slice(6, 8);
  
  return `#${r}${g}${b}`;
};

/**
 * Convert HEX color to ASS format
 * @param hex - HEX color string (e.g., "#ffffff")
 * @returns ASS color string (e.g., "&H00FFFFFF")
 */
export const hexToAss = (hex?: string): string => {
  if (!hex) return "&H00FFFFFF";
  if (hex.startsWith("&H") || hex.startsWith("&h")) return hex;
  
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "&H00FFFFFF";
  
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  
  return `&H00${b}${g}${r}`;
};

/**
 * Convert ASS color to CSS rgba format
 * @param val - ASS color string
 * @param fallback - Fallback color if conversion fails
 * @returns CSS color string
 */
export const assToCssColor = (val?: string, fallback = "#ffffff"): string => {
  if (!val) return fallback;
  if (val.startsWith("#") && val.length === 7) return val;
  
  if (val.startsWith("&H") || val.startsWith("&h")) {
    const clean = val.replace("&H", "").replace("&h", "").replace(/&/g, "").padStart(8, "0");
    const a = parseInt(clean.slice(0, 2), 16);
    const b = parseInt(clean.slice(2, 4), 16);
    const g = parseInt(clean.slice(4, 6), 16);
    const r = parseInt(clean.slice(6, 8), 16);
    const alpha = 1 - a / 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }
  
  return fallback;
};

/**
 * Convert style colors to ASS format for backend
 * @param style - Style config with hex colors
 * @returns Style config with ASS colors
 */
export const styleToAssColors = <T extends Record<string, unknown>>(style: T): T => ({
  ...style,
  primary_color: hexToAss(style.primary_color as string),
  secondary_color: hexToAss(style.secondary_color as string),
  outline_color: hexToAss(style.outline_color as string),
  shadow_color: hexToAss(style.shadow_color as string),
  back_color: hexToAss(style.back_color as string),
});

/**
 * Convert style colors from ASS to HEX format
 * @param style - Style config with ASS colors
 * @returns Style config with HEX colors
 */
export const styleFromAssColors = <T extends Record<string, unknown>>(style: T): T => ({
  ...style,
  primary_color: assToHex(style.primary_color as string),
  secondary_color: assToHex(style.secondary_color as string),
  outline_color: assToHex(style.outline_color as string),
  shadow_color: assToHex(style.shadow_color as string),
  back_color: assToHex(style.back_color as string),
});
