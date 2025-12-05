/**
 * PresetPreview Component - Optimized Version
 * Uses setTrack() for fast updates instead of recreating JASSUB
 */

import { useEffect, useRef, useState, memo, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { Zap } from 'lucide-react';
import JASSUB from 'jassub';
import axios from 'axios';
import { StyleConfig } from '../../types';
import { styleToAssColors } from '../../utils/colorConvert';
import { getAssetPath, getFontUrl } from '../../utils/assetPath';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Demo video
const DEMO_VIDEO = getAssetPath('test-video/export_7ea10b8f2a224be0953d0792b13f7605.mp4');

// Global caches - persist across component mounts
let cachedSampleWords: Array<{ start: number; end: number; text: string }> | null = null;
let cachedFonts: { name: string; file: string }[] | null = null;
let cachedFontMap: Record<string, string> | null = null;
const assCache = new Map<string, string>();

interface PresetPreviewProps {
  preset: StyleConfig;
  width?: number;
  height?: number;
}

// Expose methods to parent component
export interface PresetPreviewRef {
  captureSubtitleOnly: () => Promise<string | null>;
}

const PresetPreviewComponent = forwardRef<PresetPreviewRef, PresetPreviewProps>(({ preset, height = 180 }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jassubRef = useRef<JASSUB | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const jassubInitialized = useRef(false);
  const layoutRef = useRef<{ displayWidth: number; displayHeight: number }>({
    displayWidth: 0,
    displayHeight: 0,
  });
  const [assContent, setAssContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>(cachedFonts || []);
  const [sampleWords, setSampleWords] = useState<Array<{ start: number; end: number; text: string }>>(cachedSampleWords || []);

  // Expose captureSubtitleOnly method to parent
  useImperativeHandle(ref, () => ({
    captureSubtitleOnly: async (): Promise<string | null> => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      try {
        // Create a new canvas with transparent background for subtitle only
        const outputCanvas = document.createElement('canvas');
        const { displayWidth, displayHeight } = layoutRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        // Use layout dimensions or fallback
        const w = displayWidth || canvas.width / dpr;
        const h = displayHeight || canvas.height / dpr;
        
        outputCanvas.width = w * 2; // High resolution
        outputCanvas.height = h * 2;
        
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) return null;
        
        // Draw transparent background (for preset thumbnails)
        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Optional: Add a subtle dark gradient background for better visibility
        const gradient = ctx.createLinearGradient(0, 0, 0, outputCanvas.height);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Draw the JASSUB canvas (subtitle only) scaled up
        ctx.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);
        
        return outputCanvas.toDataURL('image/png');
      } catch (e) {
        console.error('Failed to capture subtitle:', e);
        return null;
      }
    }
  }), []);

  // Memoize style JSON to prevent unnecessary API calls
  const styleJson = useMemo(() => {
    return JSON.stringify(styleToAssColors(preset));
  }, [
    preset.font, preset.font_size, preset.bold, preset.italic,
    preset.primary_color, preset.secondary_color, preset.outline_color, preset.shadow_color,
    preset.border, preset.shadow, preset.shadow_blur, preset.blur,
    preset.margin_v, preset.margin_l, preset.margin_r, preset.alignment,
    preset.effect_type, preset.effect_name
  ]);

  // Load backend font list once (use global cache)
  useEffect(() => {
    if (cachedFonts && cachedFontMap) {
      setFontOptions(cachedFonts);
      return;
    }
    
    let cancelled = false;
    (async () => {
      try {
        const resp = await axios.get(`${API_BASE}/fonts`);
        const list = resp.data?.fonts || [];
        const map: Record<string, string> = {};
        const normalize = (s: string) => (s || '').toString().replace(/[\s_-]+/g, '').toLowerCase();
        for (const entry of list) {
          if (entry && entry.name && entry.file) {
            map[normalize(entry.name)] = entry.file;
          }
        }
        if (!cancelled) {
          const parsed = list.map((f: any) => (typeof f === 'string' ? { name: f, file: `${f}.ttf` } : { name: f.name, file: f.file }));
          cachedFonts = parsed;
          cachedFontMap = map;
          setFontOptions(parsed);
        }
      } catch (e) {
        console.warn('Failed to load font list from backend', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load sample transcript once (use global cache)
  useEffect(() => {
    if (cachedSampleWords) {
      setSampleWords(cachedSampleWords);
      return;
    }
    
    let cancelled = false;
    (async () => {
      try {
        const resp = await axios.get('/sample_transcript.json');
        if (!cancelled && Array.isArray(resp.data)) {
          cachedSampleWords = resp.data;
          setSampleWords(resp.data);
        }
      } catch (e) {
        console.warn('Failed to load sample transcript', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Compute overlay fonts
  const overlayFonts = useMemo(() => {
    const encodeName = (name: string) => encodeURIComponent(name.trim());
    const currentFile =
      fontOptions.find((f) => f.name === preset.font)?.file ||
      fontOptions.find((f) => f.name?.toLowerCase() === (preset.font || '').toLowerCase())?.file;
    const fallbackFiles = fontOptions.slice(0, 10).map((f) => f.file);
    const ordered = [...(currentFile ? [currentFile] : []), ...fallbackFiles];
    const seen = new Set<string>();
    return ordered
      .filter((f) => f)
      .filter((f) => {
        const key = f.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((fname) => getFontUrl(fname));
  }, [fontOptions, preset.font]);

  // Fetch ASS content with cache and reduced debounce (150ms instead of 300ms)
  useEffect(() => {
    if (!sampleWords.length) return;
    
    // Create cache key from style
    const cacheKey = styleJson;
    
    // Check cache first
    if (assCache.has(cacheKey)) {
      setAssContent(assCache.get(cacheKey)!);
      setCacheHit(true);
      setLoading(false);
      return;
    }
    
    setCacheHit(false);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(false);
        
        const form = new FormData();
        form.append('words_json', JSON.stringify(sampleWords));
        form.append('style_json', styleJson);

        const response = await axios.post(`${API_BASE}/preview-ass`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (!cancelled && response.data) {
          // Store in cache
          assCache.set(cacheKey, response.data);
          // Limit cache size
          if (assCache.size > 100) {
            const firstKey = assCache.keys().next().value;
            if (firstKey) assCache.delete(firstKey);
          }
          setAssContent(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch ASS preview:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150); // Reduced from 300ms to 150ms

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [styleJson, sampleWords]);

  // Handle video ready
  const syncLayout = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!container || !canvas || !video) return;

    const cw = container.clientWidth || 0;
    const ch = container.clientHeight || 0;
    if (!cw || !ch) return;

    const vw = video.videoWidth || cw;
    const vh = video.videoHeight || ch;
    const scale = Math.min(cw / vw, ch / vh);
    const displayWidth = vw * scale;
    const displayHeight = vh * scale;
    layoutRef.current = { displayWidth, displayHeight };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.left = '0';
    canvas.style.right = '0';
    canvas.style.top = '0';
    canvas.style.bottom = '0';
    canvas.style.margin = 'auto';
    canvas.style.transform = 'none';

    video.style.width = `${displayWidth}px`;
    video.style.height = `${displayHeight}px`;
    video.style.left = '0';
    video.style.right = '0';
    video.style.top = '0';
    video.style.bottom = '0';
    video.style.margin = 'auto';
    video.style.transform = 'none';

    if (jassubRef.current && typeof (jassubRef.current as any).resize === 'function') {
      try {
        (jassubRef.current as any).resize(displayWidth * dpr, displayHeight * dpr);
      } catch (e) {
        console.warn('JASSUB resize failed', e);
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => syncLayout());
    observer.observe(container);
    syncLayout();
    return () => observer.disconnect();
  }, [syncLayout]);

  const handleVideoLoaded = useCallback(() => {
    setVideoReady(true);
    syncLayout();
  }, [syncLayout]);

  // Initialize JASSUB once when video is ready
  useEffect(() => {
    if (!videoRef.current || !videoReady || !canvasRef.current || jassubInitialized.current) {
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    // Default fonts
    const defaultFonts = overlayFonts.length ? overlayFonts : [
      getFontUrl('Bungee-Regular.ttf'),
      getFontUrl('RubikSprayPaint-Regular.ttf'),
      getFontUrl('LuckiestGuy-Regular.ttf'),
      getFontUrl('Grandstander-ExtraBold.ttf'),
      getFontUrl('Nunito-ExtraBold.ttf'),
    ];

    // Minimal valid ASS content to initialize JASSUB (empty string causes errors)
    const minimalAss = `[Script Info]
Title: Init
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    try {
      jassubRef.current = new JASSUB({
        video: videoElement,
        canvas: canvasElement,
        subContent: minimalAss, // Use minimal valid ASS instead of empty string
        fonts: defaultFonts,
        workerUrl: getAssetPath('jassub/jassub-worker.js'),
        wasmUrl: getAssetPath('jassub/jassub-worker.wasm'),
        legacyWasmUrl: getAssetPath('jassub/jassub-worker.wasm.js'),
      });
      
      jassubInitialized.current = true;
      
      // Set loop and play
      videoElement.loop = true;
      videoElement.currentTime = 0.5;
      videoElement.play().catch(() => {});
      
    } catch (e) {
      console.error('JASSUB Init Error:', e);
      setError(true);
    }

    return () => {
      if (jassubRef.current) {
        jassubRef.current.destroy();
        jassubRef.current = null;
        jassubInitialized.current = false;
      }
    };
  }, [videoReady, overlayFonts]);

  // Use setTrack() to update content without recreating JASSUB
  useEffect(() => {
    if (jassubRef.current && assContent) {
      try {
        jassubRef.current.setTrack(assContent);
      } catch (e) {
        console.warn('setTrack failed:', e);
      }
    }
  }, [assContent]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: height,
        bgcolor: 'grey.900',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <Box sx={{ position: 'absolute', zIndex: 10, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <CircularProgress size={24} sx={{ color: 'grey.500' }} />
        </Box>
      )}
      
      {cacheHit && !loading && (
        <Tooltip title="Cache hit - instant load">
          <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}>
            <Zap size={14} color="#4ade80" />
          </Box>
        </Tooltip>
      )}
      
      {error && !loading && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 10,
            color: 'grey.500',
            fontSize: 12,
            textAlign: 'center',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          Preview unavailable
        </Box>
      )}

      {/* Video element for JASSUB */}
      <Box
        component="video"
        ref={videoRef}
        src={DEMO_VIDEO}
        muted
        playsInline
        autoPlay
        onLoadedData={handleVideoLoaded}
        onLoadedMetadata={handleVideoLoaded}
        onCanPlay={handleVideoLoaded}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          objectFit: 'contain',
          opacity: (loading || error) ? 0.3 : 1,
          transition: 'opacity 0.2s',
          zIndex: 1,
        }}
      />

      {/* Canvas overlay for subtitles */}
      <Box
        component="canvas"
        ref={canvasRef}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </Box>
  );
});

export const PresetPreview = memo(PresetPreviewComponent);
export default PresetPreview;
