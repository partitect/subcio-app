import { useEffect, useRef, useState } from 'react';
import JASSUB from 'jassub';
import { getAssetPath } from '../utils/assetPath';
import { getFontMapping, getDefaultFontMapping, getAllFontUrls, getDefaultFontUrls } from '../utils/fontService';

export default function JSOOverlay({
  videoRef, // Reference to the video element (from ReactPlayer)
  assContent, // The raw ASS content string
}) {
  const instanceRef = useRef(null);
  const [fontData, setFontData] = useState(null);

  // Load fonts from backend API on mount
  useEffect(() => {
    let mounted = true;

    async function loadFonts() {
      try {
        // Get both font URLs and font name mapping
        const [fontUrls, fontMapping] = await Promise.all([
          getAllFontUrls(),
          getFontMapping()
        ]);

        if (mounted) {
          if (fontUrls.length > 0) {
            console.log(`[JSOOverlay] Loaded ${fontUrls.length} fonts from API`);
            console.log(`[JSOOverlay] Font mapping has ${Object.keys(fontMapping).length} entries`);
            // DEBUG: Show sample font URLs and mapping
            console.log('[JSOOverlay] Sample font URL:', fontUrls[0]);
            const firstMappingKey = Object.keys(fontMapping)[0];
            console.log('[JSOOverlay] Sample mapping:', firstMappingKey, '->', fontMapping[firstMappingKey]);
            setFontData({ urls: fontUrls, mapping: fontMapping });
          } else {
            console.log('[JSOOverlay] Using default fonts');
            setFontData({
              urls: getDefaultFontUrls(),
              mapping: getDefaultFontMapping()
            });
          }
        }
      } catch (error) {
        console.error('[JSOOverlay] Font loading error:', error);
        if (mounted) {
          setFontData({
            urls: getDefaultFontUrls(),
            mapping: getDefaultFontMapping()
          });
        }
      }
    }

    loadFonts();
    return () => { mounted = false; };
  }, []);

  // Initialize JASSUB when video, ASS content, and fonts are ready
  useEffect(() => {
    if (!videoRef?.current || !assContent || !fontData) return;

    // Destroy previous instance if exists
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    let videoElement = videoRef.current;
    if (videoElement && typeof videoElement.getInternalPlayer === 'function') {
      videoElement = videoElement.getInternalPlayer();
    }

    if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
      console.warn("[JSOOverlay] Valid video element not found");
      return;
    }

    // Initialize JASSUB with both fonts and availableFonts mapping
    try {
      console.log(`[JSOOverlay] Initializing JASSUB with ${fontData.urls.length} fonts`);
      // DEBUG: Log first 500 chars of ASS content to verify style
      console.log('[JSOOverlay] ASS Content (first 500 chars):', assContent.substring(0, 500));

      const fallbackFontUrl = fontData.urls[0] || getAssetPath('fonts/Bungee-Regular.ttf');

      instanceRef.current = new JASSUB({
        video: videoElement,
        subContent: assContent,
        availableFonts: fontData.mapping,
        fallbackFont: fallbackFontUrl,
        workerUrl: getAssetPath('jassub/jassub-worker.js?v=2'),
        wasmUrl: getAssetPath('jassub/jassub-worker.wasm?v=2'),
        legacyWasmUrl: getAssetPath('jassub/jassub-worker.wasm.js?v=2'),
        modernWasmUrl: getAssetPath('jassub/jassub-worker.wasm?v=2'),
        debug: true,
      });
    } catch (e) {
      console.error("JASSUB Init Error:", e);
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [videoRef, assContent, fontData]);

  // Update content when it changes without destroying instance if possible
  useEffect(() => {
    if (instanceRef.current && assContent) {
      instanceRef.current.setTrack(assContent);
    }
  }, [assContent]);

  return null;
}
