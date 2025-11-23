import { useEffect, useRef } from 'react';
import JASSUB from 'jassub';

export default function JSOOverlay({
  videoRef, // Reference to the video element (from ReactPlayer)
  assContent, // The raw ASS content string
  fonts, // Optional: Array of font URLs
}) {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!videoRef?.current || !assContent) return;

    // Destroy previous instance if exists
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    const videoElement = videoRef.current.getInternalPlayer();
    if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
      console.warn("JSOOverlay: Valid video element not found");
      return;
    }

    const defaultFonts = [
      "/fonts/PressStart2P.ttf",
      "/fonts/komika.ttf",
      "/fonts/Brown Beige.ttf",
      "/fonts/Brume-Regular.ttf",
      "/fonts/OverHeat-Regular.ttf",
      "/fonts/Monigue.ttf",
      "/fonts/Oslla.ttf",
      "/fonts/Tallica-Regular.ttf",
      "/fonts/Sink.ttf",
    ];

    // Initialize JASSUB
    try {
      instanceRef.current = new JASSUB({
        video: videoElement,
        subContent: assContent,
        fonts: fonts || defaultFonts,
        workerUrl: '/jassub/jassub-worker.js',
        wasmUrl: '/jassub/jassub-worker.wasm',
        legacyWasmUrl: '/jassub/jassub-worker.wasm.js',
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
  }, [videoRef, assContent, fonts]);

  // Update content when it changes without destroying instance if possible
  useEffect(() => {
    if (instanceRef.current && assContent) {
      instanceRef.current.setTrack(assContent);
    }
  }, [assContent]);

  return null;
}
