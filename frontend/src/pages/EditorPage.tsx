/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-static-element-interactions */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Play, Pause, Image as ImageIcon, Download, Plus, Copy, Trash2, ListOrdered, SkipBack, SkipForward, Volume2, VolumeX, Film } from "lucide-react";
import {
  Box,
  Button,
  Paper,
  Grid,
  Tabs,
  Tab,
  Typography,
  Stack,
  TextField,
  Slider,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  alpha,
} from "@mui/material";
import JSOOverlay from "../components/JSOOverlay";
import AudioSubtitleOverlay from "../components/AudioSubtitleOverlay";
import LoadingOverlay from "../components/LoadingOverlay";
import { GlassCard, GradientButton } from "../components/ui";
import { designTokens } from "../theme";
import { ProjectMeta, StyleConfig, WordCue } from "../types";
import useMediaPlayer from "../hooks/useMediaPlayer";

const { colors, radii } = designTokens;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

type Preset = StyleConfig & { label?: string };
const PRESET_LABELS: Record<string, string> = {
  mademyday: "Made My Day (3'lü sabit grup)"
};
const assToHex = (ass?: string) => {
  if (!ass) return "#ffffff";
  if (ass.startsWith("#")) return ass;
  const clean = ass.replace("&H", "").replace("&h", "").replace(/&/g, "");
  const padded = clean.padStart(8, "0");
  const b = padded.slice(2, 4);
  const g = padded.slice(4, 6);
  const r = padded.slice(6, 8);
  return `#${r}${g}${b}`;
};
const assToCssColor = (val?: string, fallback = "#ffffff") => {
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
const hexToAss = (hex?: string) => {
  if (!hex) return "&H00FFFFFF";
  if (hex.startsWith("&H") || hex.startsWith("&h")) return hex;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "&H00FFFFFF";
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H00${b}${g}${r}`;
};

const defaultWords: WordCue[] = [
  { start: 0, end: 0.8, text: "Grouped" },
  { start: 0.8, end: 1.6, text: "preview" },
  { start: 1.6, end: 2.4, text: "now" },
  { start: 2.4, end: 3.2, text: "matches" },
  { start: 3.2, end: 4.0, text: "export" },
];

const defaultFireStormStyle: StyleConfig = {
  id: "fire-storm",
  font: "Asimovian",
  primary_color: assToHex("&H0000d5ff"),
  secondary_color: assToHex("&H00c431a4"),
  outline_color: assToHex("&H00000000"),
  shadow_color: assToHex("&H00ffffff"),
  back_color: assToHex("&H00000000"),
  font_size: 150,
  letter_spacing: 10,
  bold: 1,
  italic: 0,
  underline: 0,
  strikeout: 0,
  border: 1,
  shadow: 3,
  blur: 1,
  opacity: 100,
  rotation: 0,
  rotation_x: 0,
  rotation_y: -1,
  shear: 0,
  scale_x: 100,
  scale_y: 100,
  alignment: 5,
  margin_v: 40,
  margin_l: 10,
  margin_r: 10,
  shadow_blur: 0,
  effect_type: "fire_storm",
  effect_config: {
    particle_count: 12,
    min_speed: 30,
    max_speed: 120,
    colors: ["&H0000FF&", "&H00FFFF&", "&HFFFFFF&"],
  },
};

const normalizeFontName = (options: { name: string; file: string }[], value?: string) => {
  if (!options.length) return value || "";
  if (!value) return options[0].name;
  const lc = value.toLowerCase();
  const strip = (s: string) =>
    s
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\b(extra|ultra)?\s*(bold|light|thin|regular|medium|black|heavy|book|semibold)\b/g, "")
      .trim();
  const key = (s: string) => strip(s).replace(/\s+/g, "");
  const exact = options.find((o) => o.name === value);
  if (exact) return exact.name;
  const icase = options.find((o) => o.name.toLowerCase() === lc);
  if (icase) return icase.name;
  const stripped = options.find((o) => strip(o.name) === strip(value));
  if (stripped) return stripped.name;
  const compact = options.find((o) => key(o.name) === key(value));
  if (compact) return compact.name;
  return options[0].name;
};

const styleToAss = (incoming: StyleConfig) => ({
  ...incoming,
  primary_color: hexToAss(incoming.primary_color as string),
  secondary_color: hexToAss(incoming.secondary_color as string),
  outline_color: hexToAss(incoming.outline_color as string),
  shadow_color: hexToAss(incoming.shadow_color as string),
  back_color: hexToAss((incoming as any).back_color as string),
});

// Preset category type and helper
type PresetCategory = "all" | "text" | "animation" | "karaoke";
const categorizePreset = (preset: Preset): PresetCategory => {
  if (preset.effect_type?.includes("karaoke")) return "karaoke";
  if (preset.effect_type) return "animation";
  return "text";
};

// Default background video for audio mode
const DEFAULT_BG_VIDEO = "/audiobg/audio-bg-1.mp4";

// Format time as mm:ss.ms
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export default function EditorPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const overlayRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<ProjectMeta | null>((location.state as any)?.project || null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");
  const [bgVideoUrl, setBgVideoUrl] = useState<string>(DEFAULT_BG_VIDEO);
  const [words, setWords] = useState<WordCue[]>((location.state as any)?.words || defaultWords);
  const [style, setStyle] = useState<StyleConfig>(defaultFireStormStyle);
  const [assContent, setAssContent] = useState<string>("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"presets" | "style" | "transcript">("presets");
  const [presetFilter, setPresetFilter] = useState<PresetCategory>("all");
  const [resolution, setResolution] = useState("1080p");
  const [exporting, setExporting] = useState(false);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [exportName, setExportName] = useState("pycaps_export");
  const [exportQuality, setExportQuality] = useState("1080p");
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetSynced, setPresetSynced] = useState(false);
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "warning" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Media player hook - unified for video and audio
  const {
    videoRef,
    audioRef,
    bgVideoRef,
    state: mediaState,
    controls: mediaControls,
    getVideoProps,
    getAudioProps,
    getBgVideoProps,
  } = useMediaPlayer(mediaType, {
    onTimeUpdate: (time) => {
      // This is handled internally, but we can use it for external sync if needed
    },
  });

  // Expose current time and playing state from media player
  const currentTime = mediaState.currentTime;
  const isPlaying = mediaState.isPlaying;
  const mediaDuration = mediaState.duration;

  const activeIndex = useMemo(
    () => words.findIndex((w) => w && currentTime >= w.start && currentTime < w.end),
    [words, currentTime]
  );

  const alignProps = useMemo(() => {
    const align = style.alignment || 2;
    const map: Record<number, { justify: string; align: string; text: "left" | "center" | "right" }> = {
      1: { justify: "flex-end", align: "flex-start", text: "left" },
      2: { justify: "flex-end", align: "center", text: "center" },
      3: { justify: "flex-end", align: "flex-end", text: "right" },
      4: { justify: "center", align: "flex-start", text: "left" },
      5: { justify: "center", align: "center", text: "center" },
      6: { justify: "center", align: "flex-end", text: "right" },
      7: { justify: "flex-start", align: "flex-start", text: "left" },
      8: { justify: "flex-start", align: "center", text: "center" },
      9: { justify: "flex-start", align: "flex-end", text: "right" },
    };
    return map[align] || map[2];
  }, [style.alignment]);

  const previewFontSize = useMemo(() => Math.max(12, Math.round(style.font_size || 56)), [style.font_size]);

  const previewFontFamily = useMemo(() => {
    const match = fontOptions.find((f) => f.name === style.font);
    if (match?.file) {
      return match.file.replace(/\.(ttf|otf)$/i, "");
    }
    return style.font || "Inter";
  }, [fontOptions, style.font]);

  const selectedPresetLabel = useMemo(() => {
    const match = presets.find((p) => p.id === style.id);
    if (match?.label) return match.label;
    if (match?.id) return match.id.replace(/-/g, " ");
    return style.id || "custom";
  }, [presets, style.id]);

  const previewText = useMemo(
    () => selectedPresetLabel || (words.length ? words.slice(0, 3).map((w) => w.text).join(" ") : "Caption style preview"),
    [selectedPresetLabel, words]
  );

  const previewTextShadow = useMemo(() => {
    const outlineSize = Math.max(style.border || 0, 0);
    const outlineColor = assToCssColor(style.outline_color as string, "#000000");
    const shadowColor = assToCssColor(style.shadow_color as string, "rgba(0,0,0,0.4)");
    const shadowBlur = Math.max(style.shadow_blur || style.blur || 0, 0);
    const shadowOffset = Math.max(style.shadow || 0, 0);

    const outlineShadows =
      outlineSize > 0
        ? [
          `-${outlineSize}px 0 ${outlineColor}`,
          `${outlineSize}px 0 ${outlineColor}`,
          `0 -${outlineSize}px ${outlineColor}`,
          `0 ${outlineSize}px ${outlineColor}`,
        ]
        : [];

    const softShadow = shadowBlur > 0 || shadowOffset > 0 ? [`0 ${shadowOffset || 6}px ${shadowBlur}px ${shadowColor}`] : [];

    return [...outlineShadows, ...softShadow].join(", ");
  }, [style.border, style.outline_color, style.shadow_color, style.shadow_blur, style.blur, style.shadow]);

  useEffect(() => {
    if (!projectId || projectId === "demo") {
      // Demo fallback: use bundled sample
      setProject((prev) => prev || { id: "demo", name: "Demo Project" });
      setVideoUrl("/test-video/export_7ea10b8f2a224be0953d0792b13f7605.mp4");
      setMediaType("video");
      setWords((prev) => (prev && prev.length ? prev : defaultWords));
      return;
    }

    if (!project) {
      axios
        .get(`${API_BASE}/projects/${projectId}`)
        .then(({ data }) => {
          setProject(data);
          setWords(data.words || []);
          
          // Handle media type (video or audio)
          const type = data.media_type || (data.audio_url ? "audio" : "video");
          setMediaType(type);
          
          if (type === "audio") {
            setAudioUrl(data.audio_url || "");
            setVideoUrl("");
          } else {
            setVideoUrl(data.video_url || "");
            setAudioUrl("");
          }
          
          const styleFromConfig = (data.config && (data.config as any).style) || {};
          const normalizedFont = normalizeFontName(fontOptions, styleFromConfig.font || style.font);
          setStyle((prev) => ({
            ...prev,
            ...styleFromConfig,
            id: styleFromConfig.id || prev.id,
            font: normalizedFont,
            primary_color: assToHex(styleFromConfig.primary_color),
            secondary_color: assToHex(styleFromConfig.secondary_color),
            outline_color: assToHex(styleFromConfig.outline_color),
            shadow_color: assToHex(styleFromConfig.shadow_color as string),
            back_color: assToHex((styleFromConfig as any).back_color as string),
          }));
        })
        .catch((err) => {
          console.error("Project load failed", err);
          setProject({ id: projectId, name: "Not Found" });
          setWords(defaultWords);
        });
    }
  }, [projectId, project]);

  useEffect(() => {
    if (project?.video_url) {
      setVideoUrl(project.video_url);
      setMediaType("video");
    } else if (project?.audio_url) {
      setAudioUrl(project.audio_url);
      setMediaType("audio");
    }
  }, [project]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/presets`)
      .then(({ data }) =>
        setPresets(
          (data || []).map((p: Preset) => ({
            ...p,
            label: PRESET_LABELS[p.id] || p.label,
          }))
        )
      )
      .catch((err) => console.error("Failed to load presets", err));

    axios
      .get(`${API_BASE}/fonts`)
      .then(({ data }) => {
        if (Array.isArray(data?.fonts)) {
          const parsed = data.fonts.map((f: any) =>
            typeof f === "string" ? { name: f, file: `${f}.ttf` } : { name: f.name, file: f.file }
          );
          setFontOptions(parsed);
          if (parsed.length) {
            setStyle((prev) => ({ ...prev, font: normalizeFontName(parsed, prev.font) }));
          }
        }
      })
      .catch((err) => console.error("Failed to load fonts", err));
  }, []);

  useEffect(() => {
    if (!fontOptions.length) return;
    setStyle((prev) => ({ ...prev, font: normalizeFontName(fontOptions, prev.font) }));
  }, [fontOptions]);

  // Once presets are available, re-apply fire-storm to ensure full backend values (colors/effect) are loaded
  useEffect(() => {
    if (presetSynced || !presets.length || style.id !== "fire-storm") return;
    const fire = presets.find((p) => p.id === "fire-storm");
    if (fire) {
      applyPreset(fire);
      setPresetSynced(true);
    }
  }, [presets, presetSynced, style.id]);

  useEffect(() => {
    if (!words.length) return;
    const handle = setTimeout(async () => {
      // Convert hex colors back to ASS format for backend
      const styleForBackend = styleToAss(style);
      
      const form = new FormData();
      form.append("words_json", JSON.stringify(words));
      form.append("style_json", JSON.stringify(styleForBackend));
      if (projectId && projectId !== "demo") form.append("project_id", projectId);
      try {
        const res = await axios.post(`${API_BASE}/preview-ass`, form);
        setAssContent(res.data);
      } catch (err) {
        console.error("ASS preview failed", err);
      }
    }, 700); // slower debounce to avoid UI lag while editing transcript
    return () => clearTimeout(handle);
  }, [words, style, projectId]);

  const handleWordChange = (idx: number, text: string) => {
    setWords((prev) => {
      const clone = [...prev];
      if (clone[idx]) clone[idx] = { ...clone[idx], text };
      return clone;
    });
  };

  const handleWordTimeChange = (idx: number, field: "start" | "end", value: number) => {
    if (Number.isNaN(value)) return;
    setWords((prev) => {
      const clone = [...prev];
      if (!clone[idx]) return prev;
      const next = { ...clone[idx], [field]: value };
      if (next.end <= next.start) {
        if (field === "start") next.end = next.start + 0.05;
        else next.start = Math.max(0, next.end - 0.05);
      }
      clone[idx] = next;
      return clone;
    });
  };

  const addWord = () => {
    setWords((prev) => {
      const lastEnd = prev.length ? prev[prev.length - 1].end : 0;
      return [...prev, { start: lastEnd + 0.2, end: lastEnd + 1.2, text: "New subtitle" }];
    });
  };

  const deleteWord = (idx: number) => {
    setWords((prev) => prev.filter((_, i) => i !== idx));
  };

  const sortWords = () => {
    setWords((prev) => [...prev].sort((a, b) => a.start - b.start));
  };

  const duplicateWord = (idx: number) => {
    setWords((prev) => {
      const clone = [...prev];
      const item = clone[idx];
      if (!item) return prev;
      const offset = 0.2;
      clone.splice(idx + 1, 0, {
        ...item,
        start: item.end + offset,
        end: item.end + offset + (item.end - item.start),
      });
      return clone;
    });
  };

  const resolvedVideoUrl = useMemo(() => {
    if (!videoUrl) return "";
    if (videoUrl.startsWith("http")) return videoUrl;
    // Use stream endpoint for byte-range support (enables seeking)
    const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api").replace(/\/api$/, "");
    if (videoUrl.startsWith("/projects/")) {
      // Convert /projects/abc/video.mp4 to /stream/abc/video.mp4
      const streamPath = videoUrl.replace("/projects/", "/stream/");
      return `${apiBase}${streamPath}`;
    }
    return new URL(videoUrl, apiBase).toString();
  }, [videoUrl]);

  const resolvedAudioUrl = useMemo(() => {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http")) return audioUrl;
    // Use stream endpoint for byte-range support (enables seeking)
    const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api").replace(/\/api$/, "");
    if (audioUrl.startsWith("/projects/")) {
      // Convert /projects/abc/audio.mp3 to /stream/abc/audio.mp3
      const streamPath = audioUrl.replace("/projects/", "/stream/");
      return `${apiBase}${streamPath}`;
    }
    return new URL(audioUrl, apiBase).toString();
  }, [audioUrl]);

  // Direct seek function - bypasses hook for reliability
  const handleSeek = useCallback((time: number) => {
    console.log('[EditorPage] handleSeek called with:', time);
    
    // Get the active media element directly
    const media = mediaType === 'video' ? videoRef.current : audioRef.current;
    
    if (!media) {
      console.warn('[EditorPage] No media element found, mediaType:', mediaType);
      return;
    }
    
    const duration = media.duration && isFinite(media.duration) ? media.duration : Infinity;
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    // Update UI state immediately for responsiveness
    mediaControls.seek(clampedTime);
    
    // Check seekable ranges
    const seekableRanges = [];
    for (let i = 0; i < media.seekable.length; i++) {
      seekableRanges.push({ start: media.seekable.start(i), end: media.seekable.end(i) });
    }
    console.log('[EditorPage] Seekable ranges:', seekableRanges);
    
    // If no seekable range, try forcing the seek anyway
    // Some browsers will buffer and then seek
    if (media.seekable.length === 0) {
      console.log('[EditorPage] No seekable ranges, attempting seek anyway...');
    }
    
    // Use fastSeek if available (more efficient for quick seeks)
    if ('fastSeek' in media && typeof media.fastSeek === 'function') {
      try {
        console.log('[EditorPage] Using fastSeek to:', clampedTime);
        (media as any).fastSeek(clampedTime);
        return;
      } catch (e) {
        console.warn('[EditorPage] fastSeek failed, falling back to currentTime');
      }
    }
    
    // Standard seek
    console.log('[EditorPage] Setting currentTime to:', clampedTime);
    try {
      media.currentTime = clampedTime;
      
      // Log immediately after
      console.log('[EditorPage] currentTime after set:', media.currentTime);
    } catch (e) {
      console.error('[EditorPage] Seek error:', e);
    }
  }, [mediaType, videoRef, audioRef, mediaControls]);

  const handleBgVideoSelect = (url: string) => {
    setBgVideoUrl(url);
    setShowBgSelector(false);
  };

  const applyPreset = (preset: Preset) => {
    const normalizedFont = normalizeFontName(fontOptions, preset.font as string);
    setStyle((prev) => ({
      ...prev,
      ...preset,
      id: preset.id,
      font: normalizedFont,
      primary_color: assToHex(preset.primary_color as string),
      secondary_color: assToHex(preset.secondary_color as string),
      outline_color: assToHex(preset.outline_color as string),
      shadow_color: assToHex(preset.shadow_color as string),
      back_color: assToHex((preset as any).back_color as string),
      effect_type: preset.effect_type,
      effect_config: preset.effect_config,
    }));
  };

  const savePreset = async () => {
    if (!style.id) {
      setToast({ open: true, message: "Kaydedilecek preset yok.", severity: "error" });
      return;
    }

    const basePreset = presets.find((p) => p.id === style.id) || {};
    const payload: any = {
      ...basePreset,
      ...style,
      id: style.id,
    };
    Object.assign(payload, styleToAss(payload));

    if (payload.shadow == null && payload.shadow_blur != null) payload.shadow = payload.shadow_blur;
    if (payload.blur == null && payload.shadow_blur != null) payload.blur = payload.shadow_blur;

    setSavingPreset(true);
    try {
      await axios.post(`${API_BASE}/presets/update`, payload);
      const ssOk = await takeScreenshot({ silent: true });
      setToast({
        open: true,
        message: ssOk ? "Preset kaydedildi ve screenshot alındı." : "Preset kaydedildi, screenshot alınamadı.",
        severity: ssOk ? "success" : "warning",
      });
    } catch (err: any) {
      console.error("Preset save failed", err);
      const msg = err?.response?.data?.detail || "Failed to save preset";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setSavingPreset(false);
    }
  };

  const takeScreenshot = async (opts?: { silent?: boolean }) => {
    // Capture from the live preview overlay
    const overlayNode = overlayRef.current;
    if (!overlayNode) return false;

    // The JSOOverlay creates a canvas inside the overlay container
    const canvas = overlayNode.querySelector("canvas");
    if (!canvas) {
      alert("Live preview not ready yet. Play the video to ensure subtitles are rendered.");
      return;
    }

    const targetWidth = 300;
    const targetHeight = 150;

    // Create a temp 2D canvas to read pixels (since source might be WebGL)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw the source canvas to temp to access pixel data
    tempCtx.drawImage(canvas, 0, 0);
    const w = tempCanvas.width;
    const h = tempCanvas.height;
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Find bounding box of non-transparent pixels
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    // Scan for minY
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 0) {
          minY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      // Empty canvas, just capture center
      minX = 0; minY = 0; maxX = w; maxY = h;
    } else {
      // Scan for maxY
      for (let y = h - 1; y >= minY; y--) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 0) {
            maxY = y;
            break;
          }
        }
        if (maxY > 0) break;
      }

      // Scan for minX
      found = false;
      for (let x = 0; x < w; x++) {
        for (let y = minY; y <= maxY; y++) {
          if (data[(y * w + x) * 4 + 3] > 0) {
            minX = x;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      // Scan for maxX
      for (let x = w - 1; x >= minX; x--) {
        for (let y = minY; y <= maxY; y++) {
          if (data[(y * w + x) * 4 + 3] > 0) {
            maxX = x;
            break;
          }
        }
        if (maxX > 0) break;
      }
    }

    // Add padding
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w, maxX + padding);
    maxY = Math.min(h, maxY + padding);

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    // Create target canvas (transparent background)
    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return false;
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Draw cropped content centered and scaled
    const scale = Math.min((targetWidth - 20) / contentW, (targetHeight - 20) / contentH);
    const drawW = contentW * scale;
    const drawH = contentH * scale;
    const drawX = (targetWidth - drawW) / 2;
    const drawY = (targetHeight - drawH) / 2;

    ctx.drawImage(tempCanvas, minX, minY, contentW, contentH, drawX, drawY, drawW, drawH);

    const image = targetCanvas.toDataURL("image/png");
    try {
      await axios.post(`${API_BASE}/presets/screenshot`, { id: style.id || "custom", image });
      if (!opts?.silent) {
        setToast({ open: true, message: "Preset screenshot kaydedildi (/sspresets)", severity: "success" });
      }
      return true;
    } catch (err) {
      console.error(err);
      if (!opts?.silent) {
        setToast({ open: true, message: "Screenshot kaydedilemedi", severity: "error" });
      }
      return false;
    }
  };

  const handleExport = async () => {
    setShowRenderModal(false);
    setExporting(true);
    const form = new FormData();
    form.append("words_json", JSON.stringify(words));
    form.append("style_json", JSON.stringify(styleToAss(style)));
    if (projectId && projectId !== "demo") form.append("project_id", projectId);
    form.append("resolution", exportQuality || resolution);

    try {
      const res = await axios.post(`${API_BASE}/export`, form, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      navigate(`/export/${projectId || "latest"}`, { state: { videoUrl: blobUrl, filename: `${exportName}.mp4` } });
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Total duration: use media duration if available, otherwise use words end time
  const totalDuration = useMemo(() => {
    const wordsDuration = words[words.length - 1]?.end || 0;
    return Math.max(mediaDuration || wordsDuration, wordsDuration, 1);
  }, [words, mediaDuration]);

  const timelineCues = useMemo(
    () =>
      words.map((w, idx) => ({
        key: `${idx}-${w.start}`,
        left: `${(w.start / totalDuration) * 100}%`,
        width: `${((w.end - w.start) / totalDuration) * 100}%`,
        text: w.text,
        start: w.start,
        end: w.end,
        isActive: currentTime >= w.start && currentTime < w.end,
      })),
    [words, totalDuration, currentTime]
  );

  const overlayFonts = useMemo(() => {
    const encodeName = (name: string) => encodeURIComponent(name.trim());
    const currentFile =
      fontOptions.find((f) => f.name === style.font)?.file ||
      fontOptions.find((f) => f.name?.toLowerCase() === (style.font || "").toLowerCase())?.file;
    const fallbackFiles = fontOptions.slice(0, 10).map((f) => f.file);
    const ordered = [...(currentFile ? [currentFile] : []), ...fallbackFiles];
    const seen = new Set<string>();
    const urls = ordered
      .filter((f) => f)
      .filter((f) => {
        const key = f.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((fname) => `/fonts/${encodeName(fname)}`);
    return urls;
  }, [style.font, fontOptions]);

  const filteredPresets = useMemo(() => {
    if (presetFilter === "all") return presets;
    return presets.filter((p) => categorizePreset(p) === presetFilter);
  }, [presetFilter, presets]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", display: "flex", flexDirection: "column" }}>
      <LoadingOverlay isLoading={exporting} />
      <Paper
        variant="outlined"
        square
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: { xs: 1.5, md: 2 },
          borderColor: "divider",
          backdropFilter: "blur(6px)",
        }}
      >
        <Stack spacing={0.75} sx={{ width: "100%" }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="overline" color="text.secondary" letterSpacing="0.2em">
              Editor
            </Typography>
            <Chip label={projectId || "demo"} size="small" variant="outlined" />
          </Stack>
          <TextField
            variant="outlined"
            label="Project Name"
            value={project?.name || "Untitled Project"}
            onChange={(e) => setProject((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
            size="small"
            sx={{ maxWidth: { xs: "100%", sm: 320 }, width: "100%" }}
          />
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            width: { xs: "100%", md: "auto" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: { xs: "flex-start", sm: "flex-end" },
          }}
        >
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Back Home
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Download size={16} />}
            onClick={() => setShowRenderModal(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {exporting ? "Rendering..." : "Render & Export"}
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ flex: 1, px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 } }}>
                <Grid item xs={12} lg={5}>
          <Paper
            sx={{
              p: { xs: 1.5, md: 2.5 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRadius: 2,
            }}
          >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ mb: 1 }}
          >
            <Tab value="presets" label="Presets" />
            <Tab value="style" label="Style" />
            <Tab value="transcript" label="Transcript" />
          </Tabs>

          {activeTab === "presets" && (
            <Grid container spacing={1.5} sx={{ maxHeight: { xs: "unset", md: "80vh" }, overflowY: { md: "auto" }, pr: 1 }}>
              {presets.map((preset) => {
                const selected = style.id === preset.id;
                return (
                  <Grid item xs={6} key={preset.id}>
                    <Paper
                      variant="outlined"
                      onClick={() => applyPreset(preset)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: "pointer",
                        borderColor: selected ? "primary.main" : "divider",
                        bgcolor: selected ? "action.selected" : "background.paper",
                        transition: "border-color 120ms ease, transform 120ms ease",
                        "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
                      }}
                    >
                      <Typography variant="subtitle2" noWrap>
                        {preset.id
                          .replace(/-/g, " ")
                          .split(" ")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          height: 100,
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "grey.900",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={`/sspresets/${preset.id}.png`}
                          alt={preset.id}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {activeTab === "style" && (
            <Stack
              spacing={2}
              sx={{
                overflowY: { md: "auto" },
                overflowX: "hidden",
                maxHeight: { xs: "none", md: "80vh" },
                pl: { xs: 1, md: 0 },
                pr: { xs: 2.5, md: 6 },
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="contained" size="small" onClick={savePreset} disabled={savingPreset}>
                  {savingPreset ? "Saving..." : "Save preset"}
                </Button>
              </Stack>

             
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Font"
                    fullWidth
                    size="small"
                    value={style.font || ""}
                    onChange={(e) => setStyle({ ...style, font: e.target.value })}
                  >
                    {fontOptions.map((f) => (
                      <MenuItem key={f.name} value={f.name}>
                        {f.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Font Size
                    </Typography>
                    <Slider
                      min={12}
                      max={300}
                      value={style.font_size || 56}
                      onChange={(_, val) => setStyle({ ...style, font_size: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={42} textAlign="right">
                      {style.font_size || 56}px
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Font Weight"
                    fullWidth
                    size="small"
                    value={style.bold ? 1 : 0}
                    onChange={(e) => setStyle({ ...style, bold: Number(e.target.value) })}
                  >
                    <MenuItem value={0}>Regular</MenuItem>
                    <MenuItem value={1}>Bold</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    label="Letter Spacing"
                    fullWidth
                    size="small"
                    value={style.letter_spacing ?? 0}
                    onChange={(e) => setStyle({ ...style, letter_spacing: Number(e.target.value) })}
                  />
                </Grid>
              </Grid>

            


             
              <Grid container spacing={2}>
                {[
                  { key: "primary_color", label: "Primary", fallback: "#ffffff" },
                  { key: "secondary_color", label: "Secondary", fallback: "#00ffff" },
                  { key: "outline_color", label: "Outline", fallback: "#000000" },
                  { key: "shadow_color", label: "Shadow", fallback: "#000000" },
                  { key: "back_color", label: "Background", fallback: "#000000" },
                ].map((c) => (
                  <Grid item xs={6} sm={4} md={3} key={c.key}>
                    <TextField
                      label={c.label}
                      type="color"
                      fullWidth
                      size="small"
                      value={(style as any)[c.key] || c.fallback}
                      onChange={(e) => setStyle({ ...style, [c.key]: e.target.value })}
                      InputProps={{ sx: { height: 48, p: 0.5 } }}
                    />
                  </Grid>
                ))}
              </Grid>

              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Border
                    </Typography>
                    <Slider
                      min={0}
                      max={8}
                      value={style.border || 0}
                      onChange={(_, val) => setStyle({ ...style, border: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={30} textAlign="right">
                      {style.border || 0}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Shadow Blur
                    </Typography>
                    <Slider
                      min={0}
                      max={20}
                      value={style.shadow_blur || 0}
                      onChange={(_, val) => setStyle({ ...style, shadow_blur: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={30} textAlign="right">
                      {style.shadow_blur || 0}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Shadow Offset
                    </Typography>
                    <Slider
                      min={0}
                      max={40}
                      value={style.shadow ?? 0}
                      onChange={(_, val) => setStyle({ ...style, shadow: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.shadow ?? 0}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Blur
                    </Typography>
                    <Slider
                      min={0}
                      max={40}
                      value={style.blur ?? 0}
                      onChange={(_, val) => setStyle({ ...style, blur: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.blur ?? 0}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>

             

              <Grid container spacing={1}>
                {[2, 5, 8].map((align) => (
                  <Grid item xs={4} key={align}>
                    <Button
                      fullWidth
                      variant={style.alignment === align ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setStyle({ ...style, alignment: align })}
                    >
                      {align === 2 ? "Bottom" : align === 5 ? "Center" : "Top"}
                    </Button>
                  </Grid>
                ))}
              </Grid>

            </Stack>
          )}

          {activeTab === "transcript" && (
            <Stack spacing={1.5} sx={{ overflowY: { md: "auto" }, maxHeight: { xs: "none", md: "75vh" }, pr: 1.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h6" fontWeight={700}>
                    Transcript Editor
                  </Typography>
                  <Chip label={`${words.length} lines`} size="small" />
                  <Chip label={`Ends at ${(totalDuration || 0).toFixed(2)}s`} size="small" />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Sort by start time">
                    <IconButton color="default" onClick={sortWords}>
                      <ListOrdered size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add new line">
                    <IconButton color="primary" onClick={addWord}>
                      <Plus size={18} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              <Divider />
              {words.map((w, idx) => (
                <Paper
                  key={`word-${idx}`}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderColor: idx === activeIndex ? "primary.main" : "divider",
                    bgcolor: idx === activeIndex ? "action.selected" : "background.paper",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <TextField
                        label="Start"
                        type="number"
                        size="small"
                        value={w.start.toFixed(2)}
                        onChange={(e) => handleWordTimeChange(idx, "start", Number(e.target.value))}
                        inputProps={{ step: "0.01", min: 0 }}
                        sx={{ width: 120 }}
                      />
                      <TextField
                        label="End"
                        type="number"
                        size="small"
                        value={w.end.toFixed(2)}
                        onChange={(e) => handleWordTimeChange(idx, "end", Number(e.target.value))}
                        inputProps={{ step: "0.01", min: 0 }}
                        sx={{ width: 120 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Dur. {(w.end - w.start).toFixed(2)}s
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Seek to start">
                        <IconButton size="small" onClick={() => handleSeek(w.start)}>
                          <Play size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate line">
                        <IconButton size="small" onClick={() => duplicateWord(idx)}>
                          <Copy size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete line">
                        <IconButton size="small" color="error" onClick={() => deleteWord(idx)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    value={w.text}
                    onChange={(e) => handleWordChange(idx, e.target.value)}
                    InputProps={{ sx: { px: 1, py: 1 } }}
                  />
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
        </Grid>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: { xs: 1.5, md: 2 }, height: "100%", display: "flex", flexDirection: "column", gap: 2, borderRadius: 2 }}>
            {/* Audio Mode: Background video selector button */}
            {mediaType === "audio" && (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Chip 
                  icon={<Film size={14} />} 
                  label="Audio Mode" 
                  size="small" 
                  color="info" 
                  variant="outlined" 
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Film size={14} />}
                  onClick={() => setShowBgSelector(true)}
                >
                  Change Background Video
                </Button>
              </Stack>
            )}

            {/* Unified Media Player Container */}
            <Box
              ref={overlayRef}
              sx={{
                position: "relative",
                width: "100%",
                bgcolor: "black",
                borderRadius: 2,
                overflow: "hidden",
                aspectRatio: "16 / 9",
              }}
            >
              {/* Video Mode - Native HTML5 Video */}
              {mediaType === "video" && resolvedVideoUrl && (
                <video
                  ref={videoRef}
                  src={resolvedVideoUrl}
                  crossOrigin="anonymous"
                  playsInline
                  preload="auto"
                  {...getVideoProps()}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}

              {/* Audio Mode - Background Video + Hidden Audio */}
              {mediaType === "audio" && resolvedAudioUrl && (
                <>
                  {/* Background video (loops, muted) */}
                  <video
                    ref={bgVideoRef}
                    src={bgVideoUrl}
                    loop
                    muted
                    playsInline
                    preload="auto"
                    {...getBgVideoProps()}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* Hidden audio element - main audio source */}
                  <audio
                    ref={audioRef}
                    src={resolvedAudioUrl}
                    {...getAudioProps()}
                    style={{ display: "none" }}
                  />
                </>
              )}

              {/* No media loaded */}
              {!resolvedVideoUrl && !resolvedAudioUrl && (
                <Stack alignItems="center" justifyContent="center" sx={{ position: "absolute", inset: 0, color: "text.secondary" }}>
                  <Typography variant="body2">Load a project to preview</Typography>
                </Stack>
              )}

              {/* Click overlay for play/pause */}
              {(resolvedVideoUrl || resolvedAudioUrl) && (
                <Box
                  onClick={mediaControls.toggle}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "transparent",
                    transition: "background-color 0.2s ease",
                    zIndex: 5,
                    "&:hover": {
                      bgcolor: alpha("#000", 0.1),
                    },
                    "&:hover .play-indicator": {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    className="play-indicator"
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: alpha("#000", 0.6),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                      color: "#fff",
                    }}
                  >
                    {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                  </Box>
                </Box>
              )}

              {/* Subtitle overlay - JSOOverlay uses video element */}
              {/* For audio mode, we use bgVideoRef since JASSUB needs a video element */}
              {assContent && (
                <JSOOverlay 
                  videoRef={mediaType === "video" ? videoRef : bgVideoRef} 
                  assContent={assContent} 
                  fonts={overlayFonts} 
                />
              )}
            </Box>

            {/* Professional Timeline */}
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              {/* Timeline Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                mb={1.5}
              >
                {/* Left: Time Display */}
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: colors.bg.elevated,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  <Typography component="span" sx={{ color: colors.brand.primary, fontWeight: 600 }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Typography component="span" sx={{ color: "text.secondary" }}>
                    {" / "}{formatTime(totalDuration)}
                  </Typography>
                </Box>

                {/* Center: Playback Controls */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title="5s Geri (←)">
                    <IconButton size="small" onClick={() => mediaControls.skipBackward(5)}>
                      <SkipBack size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isPlaying ? "Duraklat (Space)" : "Oynat (Space)"}>
                    <IconButton 
                      size="small" 
                      onClick={mediaControls.toggle}
                      sx={{ 
                        color: colors.brand.accent,
                        bgcolor: alpha(colors.brand.accent, 0.15),
                        "&:hover": { bgcolor: alpha(colors.brand.accent, 0.25) },
                        width: 36,
                        height: 36,
                      }}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="5s İleri (→)">
                    <IconButton size="small" onClick={() => mediaControls.skipForward(5)}>
                      <SkipForward size={16} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Right: Volume Control */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={mediaState.muted ? "Sesi Aç (M)" : "Sessize Al (M)"}>
                    <IconButton size="small" onClick={mediaControls.toggleMute}>
                      {mediaState.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {/* Timeline Track - Using mouse events for seeking */}
              <Box
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const seekTime = percentage * totalDuration;
                  handleSeek(Math.max(0, Math.min(totalDuration, seekTime)));
                  
                  // Enable dragging
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const moveX = moveEvent.clientX - rect.left;
                    const movePercentage = moveX / rect.width;
                    const moveSeekTime = movePercentage * totalDuration;
                    handleSeek(Math.max(0, Math.min(totalDuration, moveSeekTime)));
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                sx={{
                  position: "relative",
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: colors.bg.elevated,
                  overflow: "hidden",
                  border: `1px solid ${colors.border.default}`,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    borderColor: colors.border.light,
                  },
                }}
              >
                {/* Progress Fill */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${(currentTime / totalDuration) * 100}%`,
                    background: `linear-gradient(90deg, ${alpha(colors.brand.primary, 0.2)} 0%, ${alpha(colors.brand.accent, 0.1)} 100%)`,
                    pointerEvents: "none",
                  }}
                />

                {/* Cue Blocks */}
                {timelineCues.map((cue) => (
                  <Tooltip 
                    key={cue.key} 
                    title={`${cue.text} (${cue.start.toFixed(2)}s - ${cue.end.toFixed(2)}s)`}
                    placement="top"
                  >
                    <Box
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleSeek(cue.start);
                      }}
                      sx={{
                        position: "absolute",
                        top: 8,
                        bottom: 8,
                        left: cue.left,
                        width: cue.width,
                        minWidth: 4,
                        borderRadius: 0.5,
                        bgcolor: cue.isActive ? colors.brand.accent : colors.brand.primary,
                        opacity: cue.isActive ? 1 : 0.6,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          opacity: 1,
                          transform: "scaleY(1.1)",
                        },
                        ...(cue.isActive && {
                          boxShadow: `0 0 10px ${alpha(colors.brand.accent, 0.5)}`,
                        }),
                      }}
                    />
                  </Tooltip>
                ))}

                {/* Playhead */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${(currentTime / totalDuration) * 100}%`,
                    width: 2,
                    bgcolor: "#fff",
                    boxShadow: `0 0 8px ${alpha("#fff", 0.5)}`,
                    zIndex: 10,
                    pointerEvents: "none",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: -3,
                      left: -4,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#fff",
                      boxShadow: `0 0 6px ${alpha(colors.brand.primary, 0.8)}`,
                    },
                  }}
                />
              </Box>
            </Paper>
          </Paper>
        </Grid>

      </Grid>



      <Dialog open={showRenderModal} onClose={() => setShowRenderModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Render Settings</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Output Name"
              fullWidth
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
            />
            <TextField
              select
              label="Quality"
              fullWidth
              value={exportQuality}
              onChange={(e) => setExportQuality(e.target.value)}
            >
              <MenuItem value="1080p">1080p</MenuItem>
              <MenuItem value="4k">4K</MenuItem>
              <MenuItem value="original">Original</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRenderModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleExport} disabled={exporting}>
            {exporting ? "Rendering..." : "Render"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Background Video Selector Dialog for Audio Mode */}
      <Dialog open={showBgSelector} onClose={() => setShowBgSelector(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Film size={20} />
            <Typography variant="h6">Select Background Video</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choose a background video for your audio subtitle preview. The video will loop and play in sync with your audio.
          </Typography>
          
          {/* Available background videos */}
          <Typography variant="subtitle2" mb={1}>Available Background Videos</Typography>
          <Grid container spacing={1.5} mb={3}>
            {[
              { name: "Default BG 1", url: "/audiobg/audio-bg-1.mp4" },
            ].map((bg, idx) => (
              <Grid item xs={6} sm={4} md={3} key={idx}>
                <Paper
                  variant="outlined"
                  onClick={() => handleBgVideoSelect(bg.url)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 1.5,
                    overflow: "hidden",
                    borderColor: bgVideoUrl === bg.url ? "primary.main" : "divider",
                    borderWidth: bgVideoUrl === bg.url ? 2 : 1,
                    "&:hover": { borderColor: "primary.main", transform: "scale(1.02)" },
                    transition: "all 150ms ease",
                  }}
                >
                  <Box
                    sx={{
                      height: 100,
                      bgcolor: "grey.900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <video
                      src={bg.url}
                      muted
                      loop
                      autoPlay
                      playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <Box sx={{ p: 1, textAlign: "center" }}>
                    <Typography variant="caption">{bg.name}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Custom URL input */}
          <Typography variant="subtitle2" mb={1}>Custom Video URL</Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="https://example.com/video.mp4"
              value={bgVideoUrl}
              onChange={(e) => setBgVideoUrl(e.target.value)}
            />
            <Button 
              variant="contained" 
              onClick={() => setShowBgSelector(false)}
            >
              Apply
            </Button>
          </Stack>

          {/* Tip */}
          <Typography variant="caption" color="text.secondary" mt={2} display="block">
            Tip: Use short looping videos for best results. Videos will loop automatically during playback.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBgSelector(false)}>Cancel</Button>
          <Button 
            variant="outlined" 
            onClick={() => handleBgVideoSelect(DEFAULT_BG_VIDEO)}
          >
            Reset to Default
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        TransitionProps={{ onExited: () => setToast((prev) => ({ ...prev, message: "" })) }}
      >
        <Alert
          severity={toast.severity as "success" | "error" | "warning" | "info"}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ boxShadow: 3, borderRadius: 1 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
