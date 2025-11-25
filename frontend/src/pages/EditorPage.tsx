/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-static-element-interactions */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import axios from "axios";
import { Play, Image as ImageIcon, Download, Plus, Copy, Trash2, ListOrdered } from "lucide-react";
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
} from "@mui/material";
import JSOOverlay from "../components/JSOOverlay";
import LoadingOverlay from "../components/LoadingOverlay";
import { ProjectMeta, StyleConfig, WordCue } from "../types";

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

export default function EditorPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const playerRef = useRef<any>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<ProjectMeta | null>((location.state as any)?.project || null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [words, setWords] = useState<WordCue[]>((location.state as any)?.words || defaultWords);
  const [style, setStyle] = useState<StyleConfig>({
    id: "neon-glow",
    font: "",
    primary_color: "#ffffff",
    secondary_color: "#00ffff",
    outline_color: "#000000",
    shadow_color: "#000000",
    back_color: "#000000",
    shadow_blur: 6,
    font_size: 56,
    alignment: 2,
    border: 2,
    letter_spacing: 0,
    bold: 1,
    italic: 0,
    underline: 0,
    strikeout: 0,
    opacity: 100,
    rotation: 0,
    rotation_x: 0,
    rotation_y: 0,
    shear: 0,
    scale_x: 100,
    scale_y: 100,
    margin_v: 40,
    margin_l: 10,
    margin_r: 10,
    blur: 0,
    shadow: 0,
  });
  const [assContent, setAssContent] = useState<string>("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"presets" | "style" | "transcript">("presets");
  const [resolution, setResolution] = useState("1080p");
  const [exporting, setExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [exportName, setExportName] = useState("pycaps_export");
  const [exportQuality, setExportQuality] = useState("1080p");
  const [savingPreset, setSavingPreset] = useState(false);

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
      setWords((prev) => (prev && prev.length ? prev : defaultWords));
      return;
    }

    if (!project) {
      axios
        .get(`${API_BASE}/projects/${projectId}`)
        .then(({ data }) => {
          setProject(data);
          setWords(data.words || []);
          setVideoUrl(data.video_url || "");
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
    }, 250);
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
    // If backend returned a relative /projects/... path, prepend API host (without /api)
    const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api").replace(/\/api$/, "");
    if (videoUrl.startsWith("/projects")) {
      return `${apiBase}${videoUrl}`;
    }
    return new URL(videoUrl, apiBase).toString();
  }, [videoUrl]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    try {
      playerRef.current?.seekTo(time, "seconds");
    } catch {
      /* noop */
    }
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
      alert("No preset selected to save.");
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
      alert("Preset saved to backend.");
    } catch (err: any) {
      console.error("Preset save failed", err);
      const msg = err?.response?.data?.detail || "Failed to save preset";
      alert(msg);
    } finally {
      setSavingPreset(false);
    }
  };

  const takeScreenshot = async () => {
    // Capture from the live preview overlay
    const overlayNode = overlayRef.current;
    if (!overlayNode) return;

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

    // Create target canvas
    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

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
      alert("Preset screenshot saved to /sspresets");
    } catch (err) {
      console.error(err);
      alert("Failed to save screenshot");
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

  const totalDuration = useMemo(() => Math.max(words[words.length - 1]?.end || 0, 1), [words]);

  const timelineCues = useMemo(
    () =>
      words.map((w, idx) => ({
        key: `${idx}-${w.start}`,
        left: `${(w.start / totalDuration) * 100}%`,
        text: w.text,
      })),
    [words, totalDuration]
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", display: "flex", flexDirection: "column" }}>
      <LoadingOverlay isLoading={exporting} />
      <Paper
        variant="outlined"
        square
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderColor: "divider",
          backdropFilter: "blur(6px)",
        }}
      >
        <Stack spacing={0.75}>
          <Stack direction="row" alignItems="center" spacing={1}>
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
            sx={{ maxWidth: 320 }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" color="inherit" onClick={() => navigate("/")}>
            Back Home
          </Button>
          <Button variant="contained" size="small" startIcon={<Download size={16} />} onClick={() => setShowRenderModal(true)}>
            {exporting ? "Rendering..." : "Render & Export"}
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ flex: 1, px: 3, py: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2, borderRadius: 2 }}>
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
              {resolvedVideoUrl ? (
                <>
                  <ReactPlayer
                    ref={playerRef}
                    url={resolvedVideoUrl}
                    width="100%"
                    height="100%"
                    controls
                    onError={(e) => console.error("Video load error", e)}
                    config={{
                      file: {
                        attributes: { crossOrigin: "anonymous" },
                      },
                    }}
                    onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                  />
                  <video
                    src={resolvedVideoUrl}
                    style={{ display: "none" }}
                    onError={(e) => console.error("Fallback video tag error", e)}
                  />
                </>
              ) : (
                <Stack alignItems="center" justifyContent="center" sx={{ position: "absolute", inset: 0, color: "text.secondary" }}>
                  <Typography variant="body2">Load a project to preview</Typography>
                </Stack>
              )}
              {assContent && <JSOOverlay videoRef={playerRef} assContent={assContent} fonts={overlayFonts} />}
            </Box>

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
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Play size={16} color="#66e3c4" />
                  <Typography variant="body2" color="text.secondary">
                    Timeline
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {currentTime.toFixed(2)}s / {(words[words.length - 1]?.end ?? 0).toFixed(2)}s
                </Typography>
              </Stack>
              <Box
                sx={{
                  position: "relative",
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: "grey.900",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: `${(currentTime / totalDuration) * 100}%`,
                    bgcolor: "primary.main",
                    opacity: 0.14,
                    transition: "width 120ms ease-out",
                  }}
                />
                {timelineCues.map((cue) => (
                  <Box
                    key={cue.key}
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: 2,
                      bgcolor: "primary.light",
                      left: cue.left,
                    }}
                    title={cue.text}
                  />
                ))}
                <input
                  type="range"
                  min={0}
                  max={totalDuration}
                  step={0.01}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" }}
                />
              </Box>
            </Paper>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", gap: 2, borderRadius: 2 }}>
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
            <Grid container spacing={1.5} sx={{ maxHeight: "80vh", overflowY: "auto", pr: 1 }}>
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
                          height: 64,
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
                overflowY: "auto",
                overflowX: "hidden",
                maxHeight: "80vh",
                pl: { xs: 1, md: 0 },
                pr: { xs: 3, md: 6 },
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ImageIcon className="w-4 h-4" />}
                  onClick={takeScreenshot}
                >
                  Save preset screenshot
                </Button>
                <Button variant="contained" size="small" onClick={savePreset} disabled={savingPreset}>
                  {savingPreset ? "Saving..." : "Save preset"}
                </Button>
              </Stack>

              <Divider textAlign="left">Typography</Divider>
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
                      max={120}
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
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Opacity
                    </Typography>
                    <Slider
                      min={0}
                      max={100}
                      value={style.opacity ?? 100}
                      onChange={(_, val) => setStyle({ ...style, opacity: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.opacity ?? 100}%
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!style.italic}
                        onChange={(e) => setStyle({ ...style, italic: e.target.checked ? 1 : 0 })}
                      />
                    }
                    label="Italic"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!style.underline}
                        onChange={(e) => setStyle({ ...style, underline: e.target.checked ? 1 : 0 })}
                      />
                    }
                    label="Underline"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!style.strikeout}
                        onChange={(e) => setStyle({ ...style, strikeout: e.target.checked ? 1 : 0 })}
                      />
                    }
                    label="Strikeout"
                  />
                </Grid>
              </Grid>

              <Divider textAlign="left">Colors</Divider>
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

              <Divider textAlign="left">Stroke & Shadow</Divider>
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

              <Divider textAlign="left">Position & Spacing</Divider>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Margin L
                    </Typography>
                    <Slider
                      min={0}
                      max={100}
                      value={style.margin_l ?? 10}
                      onChange={(_, val) => setStyle({ ...style, margin_l: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.margin_l ?? 10}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Margin R
                    </Typography>
                    <Slider
                      min={0}
                      max={100}
                      value={style.margin_r ?? 10}
                      onChange={(_, val) => setStyle({ ...style, margin_r: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.margin_r ?? 10}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Margin V
                    </Typography>
                    <Slider
                      min={0}
                      max={150}
                      value={style.margin_v ?? 40}
                      onChange={(_, val) => setStyle({ ...style, margin_v: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.margin_v ?? 40}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>

              <Divider textAlign="left">Transform</Divider>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Rotation
                    </Typography>
                    <Slider
                      min={-45}
                      max={45}
                      value={style.rotation ?? 0}
                      onChange={(_, val) => setStyle({ ...style, rotation: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.rotation ?? 0}°
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Rot X
                    </Typography>
                    <Slider
                      min={-45}
                      max={45}
                      value={style.rotation_x ?? 0}
                      onChange={(_, val) => setStyle({ ...style, rotation_x: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.rotation_x ?? 0}°
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Rot Y
                    </Typography>
                    <Slider
                      min={-45}
                      max={45}
                      value={style.rotation_y ?? 0}
                      onChange={(_, val) => setStyle({ ...style, rotation_y: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.rotation_y ?? 0}°
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Shear
                    </Typography>
                    <Slider
                      min={-45}
                      max={45}
                      value={style.shear ?? 0}
                      onChange={(_, val) => setStyle({ ...style, shear: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.shear ?? 0}°
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Scale X
                    </Typography>
                    <Slider
                      min={50}
                      max={200}
                      value={style.scale_x ?? 100}
                      onChange={(_, val) => setStyle({ ...style, scale_x: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.scale_x ?? 100}%
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Scale Y
                    </Typography>
                    <Slider
                      min={50}
                      max={200}
                      value={style.scale_y ?? 100}
                      onChange={(_, val) => setStyle({ ...style, scale_y: val as number })}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" width={40} textAlign="right">
                      {style.scale_y ?? 100}%
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
            <Stack spacing={1.5} sx={{ overflowY: "auto", maxHeight: "75vh", pr: 1.5 }}>
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
    </Box>
  );
}
