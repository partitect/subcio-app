import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import axios from "axios";
import html2canvas from "html2canvas";
import { Play, SlidersHorizontal, ListChecks, Image as ImageIcon, Download } from "lucide-react";
import JSOOverlay from "../components/JSOOverlay";
import { ProjectMeta, StyleConfig, WordCue } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

type Preset = StyleConfig & { label?: string };
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
  const [previewScale, setPreviewScale] = useState(0.7);
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

  const previewFontSize = useMemo(
    () => Math.max(12, Math.round((style.font_size || 56) * previewScale)),
    [style.font_size, previewScale]
  );

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
    const shadowBlur = Math.max(style.shadow_blur || 0, style.blur || 0, 0);
    const shadowOffset = Math.max(style.shadow || 0, 0);
    const shadowColor = assToCssColor(style.shadow_color as string, "rgba(0,0,0,0.4)");

    const outlineShadows =
      outlineSize > 0
        ? [
          `-${outlineSize}px 0 ${outlineColor}`,
          `${outlineSize}px 0 ${outlineColor}`,
          `0 -${outlineSize}px ${outlineColor}`,
          `0 ${outlineSize}px ${outlineColor}`,
        ]
        : [];

    const shadow =
      shadowBlur > 0 || shadowOffset > 0
        ? [`0 ${shadowOffset || 6}px ${shadowBlur}px ${shadowColor}`]
        : [];

    return [...outlineShadows, ...shadow].join(", ");
  }, [style.border, style.outline_color, style.shadow_blur, style.blur, style.shadow, style.shadow_color]);

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
      .then(({ data }) => setPresets(data))
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
      const form = new FormData();
      form.append("words_json", JSON.stringify(words));
      form.append("style_json", JSON.stringify(style));
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

    payload.primary_color = hexToAss(payload.primary_color as string);
    payload.secondary_color = hexToAss(payload.secondary_color as string);
    payload.outline_color = hexToAss(payload.outline_color as string);
    payload.shadow_color = hexToAss(payload.shadow_color as string);
    payload.back_color = hexToAss(payload.back_color as string);

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
    form.append("style_json", JSON.stringify(style));
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

  const timelineCues = useMemo(
    () =>
      words.map((w, idx) => ({
        key: `${idx}-${w.start}`,
        left: `${(w.start / Math.max(words[words.length - 1]?.end || 1, 1)) * 100}%`,
        text: w.text,
      })),
    [words]
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur bg-black/30">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Editor</p>
          <div className="flex items-center gap-3">
            <input
              value={project?.name || "Untitled Project"}
              onChange={(e) => setProject((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              className="bg-transparent border-b border-white/10 focus:border-emerald-400 outline-none text-2xl font-black"
            />
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
              {projectId || "demo"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20"
          >
            Back Home
          </button>
          <button
            onClick={() => setShowRenderModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          >
            <Download className="w-4 h-4" />
            Render & Export
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4">
        <section className="lg:col-span-8 bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div ref={overlayRef} className="relative w-full bg-black aspect-video">
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
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                Load a project to preview
              </div>
            )}
            {assContent && <JSOOverlay videoRef={playerRef} assContent={assContent} fonts={overlayFonts} />}
          </div>

          <div className="ml-2 mr-2 bg-white/5 border-t border-white/10 px-4 py-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-300" />
                <p className="text-sm text-white/70">Timeline</p>
              </div>
              <div className="text-xs text-white/50">
                {currentTime.toFixed(2)}s / {words[words.length - 1]?.end?.toFixed(2) || "0"}s
              </div>
            </div>
            <div className="relative h-10 bg-slate-900 rounded-lg border border-white/10 overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-emerald-400/10" style={{ width: `${(currentTime / (words[words.length - 1]?.end || 1)) * 100}%` }} />
              {timelineCues.map((cue) => (
                <div
                  key={cue.key}
                  className="absolute top-0 h-full w-[2px] bg-emerald-400/60"
                  style={{ left: cue.left }}
                  title={cue.text}
                />
              ))}
              <input
                type="range"
                min={0}
                max={words[words.length - 1]?.end || 1}
                step={0.01}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setActiveTab("presets")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "presets" ? "bg-white/10 border border-white/20" : "bg-white/5 border border-transparent"}`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab("style")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "style" ? "bg-white/10 border border-white/20" : "bg-white/5 border border-transparent"}`}
            >
              Style Settings
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "transcript" ? "bg-white/10 border border-white/20" : "bg-white/5 border border-transparent"}`}
            >
              Transcript
            </button>
          </div>

          {activeTab === "presets" && (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 max-h-[80vh]">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border ${style.id === preset.id ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/5"} text-left`}
                >
                  <p className="font-semibold text-sm">{preset.id.replace(/-/g, " ")}</p>
                  <p className="text-xs text-white/50 mb-2">Font {preset.font || "Default"}</p>
                  <div className="h-16 bg-slate-950 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                    <img
                      src={`/sspresets/${preset.id}.png`}
                      alt={preset.id}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      className="object-cover w-full h-full"
                    />

                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === "style" && (
            <div className="space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Font</label>
                  <select
                    value={style.font || ""}
                    onChange={(e) => setStyle({ ...style, font: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  >
                    {fontOptions.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Font Size</label>
                  <input
                    type="number"
                    value={style.font_size || 56}
                    onChange={(e) => setStyle({ ...style, font_size: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/60">Primary</label>
                  <input
                    type="color"
                    value={(style.primary_color as string) || "#ffffff"}
                    onChange={(e) => setStyle({ ...style, primary_color: e.target.value })}
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Secondary</label>
                  <input
                    type="color"
                    value={(style.secondary_color as string) || "#00ffff"}
                    onChange={(e) => setStyle({ ...style, secondary_color: e.target.value })}
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Outline</label>
                  <input
                    type="color"
                    value={(style.outline_color as string) || "#000000"}
                    onChange={(e) => setStyle({ ...style, outline_color: e.target.value })}
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Shadow Color</label>
                  <input
                    type="color"
                    value={(style.shadow_color as string) || "#000000"}
                    onChange={(e) => setStyle({ ...style, shadow_color: e.target.value })}
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Background</label>
                  <input
                    type="color"
                    value={(style.back_color as string) || "#000000"}
                    onChange={(e) => setStyle({ ...style, back_color: e.target.value })}
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Border</label>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={style.border || 0}
                    onChange={(e) => setStyle({ ...style, border: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Shadow Blur</label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={style.shadow_blur || 0}
                    onChange={(e) => setStyle({ ...style, shadow_blur: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Opacity</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={style.opacity ?? 100}
                    onChange={(e) => setStyle({ ...style, opacity: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-[11px] text-white/50 mt-1">{style.opacity ?? 100}%</p>
                </div>
                <div>
                  <label className="text-xs text-white/60">Letter Spacing</label>
                  <input
                    type="number"
                    value={style.letter_spacing ?? 0}
                    onChange={(e) => setStyle({ ...style, letter_spacing: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <input
                    id="bold-toggle"
                    type="checkbox"
                    checked={!!style.bold}
                    onChange={(e) => setStyle({ ...style, bold: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="bold-toggle" className="text-sm text-white/70">Bold</label>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <input
                    id="italic-toggle"
                    type="checkbox"
                    checked={!!style.italic}
                    onChange={(e) => setStyle({ ...style, italic: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="italic-toggle" className="text-sm text-white/70">Italic</label>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <input
                    id="underline-toggle"
                    type="checkbox"
                    checked={!!style.underline}
                    onChange={(e) => setStyle({ ...style, underline: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="underline-toggle" className="text-sm text-white/70">Underline</label>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <input
                    id="strike-toggle"
                    type="checkbox"
                    checked={!!style.strikeout}
                    onChange={(e) => setStyle({ ...style, strikeout: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="strike-toggle" className="text-sm text-white/70">Strikeout</label>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[2, 5, 8].map((align) => (
                  <button
                    key={align}
                    onClick={() => setStyle({ ...style, alignment: align })}
                    className={`py-2 rounded-lg border ${style.alignment === align ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}
                  >
                    Align {align === 2 ? "Bottom" : align === 5 ? "Center" : "Top"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/60">Margin L</label>
                  <input
                    type="number"
                    value={style.margin_l ?? 10}
                    onChange={(e) => setStyle({ ...style, margin_l: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Margin R</label>
                  <input
                    type="number"
                    value={style.margin_r ?? 10}
                    onChange={(e) => setStyle({ ...style, margin_r: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Margin V</label>
                  <input
                    type="number"
                    value={style.margin_v ?? 40}
                    onChange={(e) => setStyle({ ...style, margin_v: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/60">Rotation</label>
                  <input
                    type="number"
                    value={style.rotation ?? 0}
                    onChange={(e) => setStyle({ ...style, rotation: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Rot X</label>
                  <input
                    type="number"
                    value={style.rotation_x ?? 0}
                    onChange={(e) => setStyle({ ...style, rotation_x: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Rot Y</label>
                  <input
                    type="number"
                    value={style.rotation_y ?? 0}
                    onChange={(e) => setStyle({ ...style, rotation_y: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/60">Shear</label>
                  <input
                    type="number"
                    value={style.shear ?? 0}
                    onChange={(e) => setStyle({ ...style, shear: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Scale X</label>
                  <input
                    type="number"
                    value={style.scale_x ?? 100}
                    onChange={(e) => setStyle({ ...style, scale_x: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Scale Y</label>
                  <input
                    type="number"
                    value={style.scale_y ?? 100}
                    onChange={(e) => setStyle({ ...style, scale_y: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Shadow (offset)</label>
                  <input
                    type="number"
                    value={style.shadow ?? 0}
                    onChange={(e) => setStyle({ ...style, shadow: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Blur</label>
                  <input
                    type="number"
                    value={style.blur ?? 0}
                    onChange={(e) => setStyle({ ...style, blur: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span>Font scale</span>
                  <input
                    type="range"
                    min={0.4}
                    max={1.4}
                    step={0.05}
                    value={previewScale}
                    onChange={(e) => setPreviewScale(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white/70 w-10 text-right">{Math.round(previewScale * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={takeScreenshot}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400/50"
                >
                  <ImageIcon className="w-4 h-4" />
                  Save preset screenshot
                </button>
                <button
                  onClick={savePreset}
                  disabled={savingPreset}
                  className="px-3 py-2 rounded-lg bg-emerald-500/80 text-black font-semibold border border-emerald-300 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {savingPreset ? "Saving..." : "Save preset"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="space-y-2 overflow-y-auto pr-1 max-h-[70vh]">
              {words.map((w, idx) => (
                <div key={`word-${idx}`} className={`p-2 rounded-lg border ${idx === activeIndex ? "border-emerald-400/60 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                    <span>
                      {w.start.toFixed(2)}s - {w.end.toFixed(2)}s
                    </span>
                    <button onClick={() => handleSeek(w.start)} className="text-emerald-300 text-[11px]">Jump</button>
                  </div>
                  <input
                    value={w.text}
                    onChange={(e) => handleWordChange(idx, e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>



      {showRenderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Render Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60">Output Name</label>
                <input
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Quality</label>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 mt-1"
                >
                  <option value="1080p">1080p</option>
                  <option value="4k">4K</option>
                  <option value="original">Original</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRenderModal(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                {exporting ? "Rendering..." : "Render"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
