/**
 * Asset Path Helper
 * Resolves static asset paths correctly for both web and Electron modes
 */

// Check if running in Electron
const isElectron = !!(window as any).electron?.isElectron;

// Check if we're in development mode (loading from localhost)
const isDevMode = window.location.protocol === 'http:' && window.location.hostname === 'localhost';

/**
 * Get the correct path for static assets
 * In Electron production mode (file://), use relative paths
 * In development mode (http://localhost), use full absolute URLs with origin
 * This is required for JASSUB worker which runs in a different context
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // In development mode (even in Electron), use full absolute URL for Vite server
  // JASSUB worker needs full URLs to fetch fonts
  if (isDevMode) {
    return `${window.location.origin}/${cleanPath}`;
  }

  // In Electron production mode (file://), use relative path
  // In Electron production mode (file://), use absolute file URL
  // This is critical for Workers (JASSUB) to resolve WASM/scripts correctly relative to the page
  if (isElectron) {
    return new URL(cleanPath, window.location.href).href;
  }

  // In web production, use absolute path
  return `/${cleanPath}`;
}


/**
 * Get font URL for loading
 */
export function getFontUrl(fontFile: string): string {
  const path = `fonts/${fontFile}`;
  return getAssetPath(path);
}

/**
 * Get lottie animation URL
 */
export function getLottieUrl(animationFile: string): string {
  const path = `lottie/${animationFile}`;
  return getAssetPath(path);
}

/**
 * Get image URL
 */
export function getImageUrl(imagePath: string): string {
  return getAssetPath(imagePath);
}

export { isElectron, isDevMode };
