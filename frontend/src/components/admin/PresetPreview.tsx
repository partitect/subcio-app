/**
 * PresetPreview Component
 * Renders a real ASS preview using JASSUB for admin preset management
 */

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { Box, CircularProgress, Button } from '@mui/material';
import JASSUB from 'jassub';
import axios from 'axios';
import { StyleConfig } from '../../types';
import { styleToAssColors } from '../../utils/colorConvert';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// Demo words (loaded from a fixed public file) and demo video
const SAMPLE_TRANSCRIPT_PATH = '/sample_transcript.json';
const DEMO_VIDEO = '/test-video/export_7ea10b8f2a224be0953d0792b13f7605.mp4';

interface PresetPreviewProps {
  preset: StyleConfig;
  width?: number;
  height?: number;
}

function PresetPreviewComponent({ preset, height = 180 }: PresetPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jassubRef = useRef<JASSUB | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const createdFontBlobUrls = useRef<string[]>([]);
  const layoutRef = useRef<{ displayWidth: number; displayHeight: number }>({
    displayWidth: 0,
    displayHeight: 0,
  });
  const [assContent, setAssContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [jassubReady, setJassubReady] = useState(false);
  const [fontMap, setFontMap] = useState<Record<string, string>>({});
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>([]);
  const [showAss, setShowAss] = useState(false);
  const [sampleWords, setSampleWords] = useState<Array<{ start: number; end: number; text: string }>>([]);

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

  // Load backend font list once and create a normalized token -> filename map
  useEffect(() => {
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
          setFontMap(map);
          // also set fontOptions similar to EditorPage
          const parsed = list.map((f: any) => (typeof f === 'string' ? { name: f, file: `${f}.ttf` } : { name: f.name, file: f.file }));
          setFontOptions(parsed);
        }
      } catch (e) {
        console.warn('Failed to load font list from backend', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      .map((fname) => `/fonts/${encodeName(fname)}`);
  }, [fontOptions, preset.font]);

  // Fetch ASS content for this preset with debounce
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(false);
        // Use fixed sample transcript
        const wordsForPreview = (sampleWords && sampleWords.length) ? sampleWords : [];
        const form = new FormData();
        form.append('words_json', JSON.stringify(wordsForPreview));
        form.append('style_json', styleJson);

        const response = await axios.post(`${API_BASE}/preview-ass`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (!cancelled && response.data) {
          console.log('ASS Content received:', response.data.substring(0, 200));
          setAssContent(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch ASS preview:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [styleJson, sampleWords]);

  // Load the fixed sample transcript from public folder
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await axios.get(SAMPLE_TRANSCRIPT_PATH);
        if (!cancelled && Array.isArray(resp.data)) {
          setSampleWords(resp.data);
        }
      } catch (e) {
        console.warn('Failed to load sample transcript, using empty words', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    console.log('Video loaded');
    setVideoReady(true);
    syncLayout();
  }, [syncLayout]);

  // Initialize JASSUB when video and ASS content are ready
  useEffect(() => {
    if (!videoRef.current || !assContent || !videoReady || !canvasRef.current || !containerRef.current) {
      console.log('Not ready:', { video: !!videoRef.current, assContent: !!assContent, videoReady, canvas: !!canvasRef.current });
      return;
    }

    console.log('Initializing JASSUB...');

    // Destroy previous instance
    if (jassubRef.current) {
      jassubRef.current.destroy();
      jassubRef.current = null;
    }

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const containerElement = containerRef.current;

    // Get font for this preset
    // Use backend-provided font list when possible to map display name -> filename
    const defaultFonts = overlayFonts.length ? overlayFonts : [
      '/fonts/Bungee-Regular.ttf',
      '/fonts/RubikSprayPaint-Regular.ttf',
      '/fonts/LuckiestGuy-Regular.ttf',
      '/fonts/Grandstander-ExtraBold.ttf',
      '/fonts/Nunito-ExtraBold.ttf',
    ];

    const resolveFonts = async () => {
      try {
        // If we have a backend-supplied map from display name -> filename, prefer it
        const candidates: string[] = [];
        if (preset.font) {
          const normalize = (s: string) => (s || '').toString().replace(/[\s_-]+/g, '').toLowerCase();
          const token = normalize(preset.font);
          if (fontMap && fontMap[token]) {
            candidates.push(`/fonts/${fontMap[token]}`);
          } else {
            // Fallback heuristics when backend mapping not available
            const raw = preset.font;
            const cleaned = raw.replace(/\s+/g, '');
            const encoded = encodeURIComponent(raw);

            candidates.push(`/fonts/${cleaned}-Regular.ttf`);
            candidates.push(`/fonts/${cleaned}-ExtraBold.ttf`);
            candidates.push(`/fonts/${cleaned}-Bold.ttf`);
            candidates.push(`/fonts/${cleaned}.ttf`);
            candidates.push(`/fonts/${encoded}.ttf`);
            candidates.push(`/fonts/${raw}.ttf`);
            candidates.push(`/fonts/${cleaned}-Regular.otf`);
          }
        }

        // Verify first candidate is fetchable/binary
        const found: string[] = [];
        for (const url of candidates) {
          try {
            const r = await fetch(url);
            if (r.ok) {
              const buf = await r.arrayBuffer();
              console.log('Probed font', url, 'bytes=', buf ? buf.byteLength : 0);
              if (buf && buf.byteLength > 100) {
                // Create a blob URL for the font so the worker can fetch it reliably
                try {
                  const ext = url.split('.').pop() || 'ttf';
                  const mime = ext.toLowerCase().includes('otf') ? 'font/otf' : 'font/ttf';
                  const blob = new Blob([buf], { type: mime });
                  const blobUrl = URL.createObjectURL(blob);
                  createdFontBlobUrls.current.push(blobUrl);
                  found.push(blobUrl);
                  break;
                } catch (be) {
                  console.warn('Failed to create blob URL for font', url, be);
                  found.push(url);
                  break;
                }
              }
            } else {
              console.log('Font probe failed status', r.status, url);
            }
          } catch (e) {
            console.log('Font probe error for', url, e);
          }
        }

        // If nothing found, try overlayFonts (they are paths returned from backend)
        if (!found.length && overlayFonts && overlayFonts.length) {
          for (const url of overlayFonts) {
            try {
              const r = await fetch(url);
              if (r.ok) {
                const buf = await r.arrayBuffer();
                console.log('Probed overlay font', url, 'bytes=', buf ? buf.byteLength : 0);
                if (buf && buf.byteLength > 100) {
                  try {
                    const ext = url.split('.').pop() || 'ttf';
                    const mime = ext.toLowerCase().includes('otf') ? 'font/otf' : 'font/ttf';
                    const blob = new Blob([buf], { type: mime });
                    const blobUrl = URL.createObjectURL(blob);
                    createdFontBlobUrls.current.push(blobUrl);
                    found.push(blobUrl);
                    break;
                  } catch (be) {
                    found.push(url);
                    break;
                  }
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }

        const fonts = (found.length ? found : []).concat(defaultFonts);
        console.log('Using fonts for JASSUB:', fonts);
        return fonts;
      } catch (err) {
        console.warn('Failed resolving fonts, falling back to defaults', err);
        return defaultFonts;
      }
    };

    const initJassub = async () => {
      try {
        const fonts = await resolveFonts();
        jassubRef.current = new JASSUB({
          video: videoElement,
          canvas: canvasElement,
          subContent: assContent,
          fonts,
          workerUrl: '/jassub/jassub-worker.js',
          wasmUrl: '/jassub/jassub-worker.wasm',
          legacyWasmUrl: '/jassub/jassub-worker.wasm.js',
        });

        console.log('JASSUB instance created');
        setJassubReady(true);

        // Force initial canvas sizing for the overlay
        try {
          const dpr = window.devicePixelRatio || 1;
          const { displayWidth, displayHeight } = layoutRef.current;
          const targetW = displayWidth || containerElement.clientWidth;
          const targetH = displayHeight || containerElement.clientHeight;
          canvasElement.width = targetW * dpr;
          canvasElement.height = targetH * dpr;
          canvasElement.style.width = `${targetW}px`;
          canvasElement.style.height = `${targetH}px`;
          canvasElement.style.left = '0';
          canvasElement.style.right = '0';
          canvasElement.style.top = '0';
          canvasElement.style.bottom = '0';
          canvasElement.style.margin = 'auto';
          canvasElement.style.transform = 'none';
          videoElement.style.width = `${targetW}px`;
          videoElement.style.height = `${targetH}px`;
          videoElement.style.left = '0';
          videoElement.style.right = '0';
          videoElement.style.top = '0';
          videoElement.style.bottom = '0';
          videoElement.style.margin = 'auto';
          videoElement.style.transform = 'none';
          if (typeof (jassubRef.current as any).resize === 'function' && targetW && targetH) {
            (jassubRef.current as any).resize(targetW * dpr, targetH * dpr);
          }
        } catch (e) {
          console.warn('Initial canvas size sync failed', e);
        }

        // Try to highlight the libass canvas if present for debugging
        setTimeout(() => {
          try {
            const container = containerRef.current;
            if (container) {
              const canvas = container.querySelector('canvas');
              if (canvas) {
                (canvas as HTMLCanvasElement).style.outline = '2px solid rgba(255,0,0,0.6)';
                console.log('Highlighted JASSUB canvas');
              } else {
                console.log('No JASSUB canvas found in container');
              }
            }
          } catch (e) {
            console.warn('Canvas highlight error', e);
          }
        }, 200);
        // Try to force rendering: play briefly, pause, and seek so libass draws
        try {
          const playRes = await videoElement.play();
          console.log('Video play() succeeded after JASSUB init', playRes);
        } catch (playErr) {
          console.log('Video play() rejected (likely autoplay policy):', playErr);
        }

          // Ensure the video will continue (loop) so subtitles remain visible
          try {
            if (videoElement) {
              videoElement.loop = true;
              // Seek to a point where subtitle is visible
              videoElement.currentTime = 0.5;
              console.log('Set loop=true and seeked to 0.5s');
            }
          } catch (e) {
            console.warn('Seek/loop error', e);
          }
      } catch (e) {
        console.error('JASSUB Init Error:', e);
        setError(true);
      }
    };

    initJassub();

    return () => {
      if (jassubRef.current) {
        jassubRef.current.destroy();
        jassubRef.current = null;
      }
      // Revoke any created blob URLs
      try {
        for (const u of createdFontBlobUrls.current) {
          try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ }
        }
        createdFontBlobUrls.current = [];
      } catch (e) {
        console.warn('Error revoking font blob URLs', e);
      }
    };
  }, [assContent, preset.font, videoReady]);

  return (
    <>
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
      {/* Toggle to show raw ASS for debugging */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 20 }}>
        <Button size="small" variant="outlined" onClick={() => setShowAss((s) => !s)}>{showAss ? 'Hide ASS' : 'Show ASS'}</Button>
      </Box>
      {loading && (
        <Box sx={{ position: 'absolute', zIndex: 10 }}>
          <CircularProgress size={24} sx={{ color: 'grey.500' }} />
        </Box>
      )}
      
      {error && !loading && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 10,
            color: 'grey.500',
            fontSize: 12,
            textAlign: 'center',
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

      {/* Canvas overlay for subtitles (kept on top of the video) */}
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
    {showAss && (
      <Box sx={{ mt: 1, bgcolor: 'grey.800', color: 'grey.100', p: 1, borderRadius: 1, fontSize: 12, overflow: 'auto', maxHeight: 240 }}>
        <Box component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>{assContent || 'ASS not loaded'}</Box>
      </Box>
    )}
    </>
  );
}

export const PresetPreview = memo(PresetPreviewComponent);
export default PresetPreview;
