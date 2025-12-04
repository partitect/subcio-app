/**
 * FFmpeg.wasm Service
 * 
 * Client-side video processing using FFmpeg compiled to WebAssembly.
 * This eliminates server-side video processing costs and memory issues.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let isLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Progress callback type
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Initialize FFmpeg.wasm
 * Uses jsDelivr CDN which has proper CORS headers
 */
export async function initFFmpeg(onProgress?: ProgressCallback): Promise<FFmpeg> {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  if (loadingPromise) {
    await loadingPromise;
    return ffmpeg!;
  }

  loadingPromise = (async () => {
    try {
      console.log('[FFmpeg] Starting initialization...');
      ffmpeg = new FFmpeg();

      // Set up progress handler
      ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          const percent = Math.round(progress * 100);
          onProgress(percent, `Processing: ${percent}%`);
        }
      });

      // Set up log handler for debugging
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      onProgress?.(5, 'Loading FFmpeg core...');

      // Use jsDelivr CDN - has proper CORS headers
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      
      console.log('[FFmpeg] Loading core from:', baseURL);
      
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      console.log('[FFmpeg] Core JS loaded');
      
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
      console.log('[FFmpeg] WASM loaded');
      
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      console.log('[FFmpeg] Successfully initialized');
      isLoaded = true;
      onProgress?.(10, 'FFmpeg loaded');
    } catch (error) {
      console.error('[FFmpeg] Initialization failed:', error);
      loadingPromise = null;
      throw error;
    }
  })();

  await loadingPromise;
  return ffmpeg!;
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
  return isLoaded;
}

/**
 * Generate ASS subtitle content from words
 */
export function generateASSContent(
  words: Array<{ start: number; end: number; text: string }>,
  style: {
    fontFamily?: string;
    fontSize?: number;
    primaryColor?: string;
    outlineColor?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    outline?: number;
    shadow?: number;
    alignment?: number;
    marginV?: number;
    wordsPerLine?: number;
  } = {}
): string {
  const {
    fontFamily = 'Arial',
    fontSize = 48,
    primaryColor = '#FFFFFF',
    outlineColor = '#000000',
    backgroundColor = '#00000000',
    bold = true,
    italic = false,
    outline = 2,
    shadow = 1,
    alignment = 2, // Bottom center
    marginV = 50,
    wordsPerLine = 3,
  } = style;

  // Convert hex colors to ASS format (AABBGGRR)
  const toASSColor = (hex: string): string => {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      const r = clean.substring(0, 2);
      const g = clean.substring(2, 4);
      const b = clean.substring(4, 6);
      return `&H00${b}${g}${r}`;
    } else if (clean.length === 8) {
      const a = clean.substring(0, 2);
      const r = clean.substring(2, 4);
      const g = clean.substring(4, 6);
      const b = clean.substring(6, 8);
      return `&H${a}${b}${g}${r}`;
    }
    return '&H00FFFFFF';
  };

  // Format timestamp for ASS (H:MM:SS.cc)
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  // Group words into lines
  const lines: Array<{ start: number; end: number; text: string }> = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    if (chunk.length > 0) {
      lines.push({
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
        text: chunk.map(w => w.text).join(' '),
      });
    }
  }

  // Build ASS content
  const header = `[Script Info]
Title: Subcio Export
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${toASSColor(primaryColor)},${toASSColor(primaryColor)},${toASSColor(outlineColor)},${toASSColor(backgroundColor)},${bold ? 1 : 0},${italic ? 1 : 0},0,0,100,100,0,0,1,${outline},${shadow},${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = lines.map(line => {
    return `Dialogue: 0,${formatTime(line.start)},${formatTime(line.end)},Default,,0,0,0,,${line.text}`;
  }).join('\n');

  return header + events;
}

/**
 * Export video with burned subtitles
 */
export async function exportVideoWithSubtitles(
  videoUrl: string,
  words: Array<{ start: number; end: number; text: string }>,
  style: Record<string, unknown> = {},
  options: {
    resolution?: '720p' | '1080p' | 'original';
    onProgress?: ProgressCallback;
  } = {}
): Promise<Blob> {
  const { resolution = '720p', onProgress } = options;

  console.log('[Export] Starting export with URL:', videoUrl);
  console.log('[Export] Words count:', words.length);
  console.log('[Export] Resolution:', resolution);

  const ff = await initFFmpeg(onProgress);

  try {
    onProgress?.(15, 'Downloading video...');
    
    console.log('[Export] Fetching video file...');
    // Fetch video file
    const videoData = await fetchFile(videoUrl);
    console.log('[Export] Video fetched, size:', videoData.byteLength);
    
    await ff.writeFile('input.mp4', videoData);
    console.log('[Export] Video written to virtual FS');

    onProgress?.(30, 'Generating subtitles...');

    // Generate and write ASS file
    const assContent = generateASSContent(words, style as Parameters<typeof generateASSContent>[1]);
    console.log('[Export] ASS content generated, length:', assContent.length);
    
    const assEncoder = new TextEncoder();
    await ff.writeFile('subtitles.ass', assEncoder.encode(assContent));
    console.log('[Export] ASS written to virtual FS');

    onProgress?.(35, 'Burning subtitles into video...');

    // Build FFmpeg command
    const scaleFilter = resolution === '1080p' 
      ? 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2'
      : resolution === '720p'
      ? 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
      : 'scale=iw:ih';

    const ffmpegArgs = [
      '-i', 'input.mp4',
      '-vf', `ass=subtitles.ass,${scaleFilter}`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4'
    ];
    
    console.log('[Export] Running FFmpeg with args:', ffmpegArgs.join(' '));

    // Run FFmpeg - burn subtitles
    await ff.exec(ffmpegArgs);
    console.log('[Export] FFmpeg execution complete');

    onProgress?.(90, 'Finalizing...');

    // Read output file
    const data = await ff.readFile('output.mp4');
    console.log('[Export] Output file read, size:', (data as Uint8Array).byteLength);
    
    // Cleanup
    await ff.deleteFile('input.mp4');
    await ff.deleteFile('subtitles.ass');
    await ff.deleteFile('output.mp4');
    console.log('[Export] Cleanup complete');

    onProgress?.(100, 'Complete!');

    // Convert to Blob - handle Uint8Array from FFmpeg
    // Need to copy the buffer since it might be a SharedArrayBuffer
    const uint8Array = new Uint8Array(data as Uint8Array);
    return new Blob([uint8Array], { type: 'video/mp4' });

  } catch (error) {
    console.error('[Export] FFmpeg export error:', error);
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export and download video
 */
export async function exportAndDownload(
  videoUrl: string,
  words: Array<{ start: number; end: number; text: string }>,
  style: Record<string, unknown> = {},
  filename: string = 'subcio_export.mp4',
  options: {
    resolution?: '720p' | '1080p' | 'original';
    onProgress?: ProgressCallback;
  } = {}
): Promise<void> {
  const blob = await exportVideoWithSubtitles(videoUrl, words, style, options);
  downloadBlob(blob, filename);
}

/**
 * Check browser compatibility
 */
export function checkBrowserSupport(): { supported: boolean; reason?: string } {
  if (!window.WebAssembly) {
    return {
      supported: false,
      reason: 'WebAssembly is not supported in this browser.',
    };
  }

  // Single-threaded version doesn't require SharedArrayBuffer
  return { supported: true };
}
