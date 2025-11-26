/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-static-element-interactions */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Film } from "lucide-react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";
import { ProjectMeta, StyleConfig, WordCue } from "../types";
import useMediaPlayer from "../hooks/useMediaPlayer";

// Import modular components
import {
  EditorHeader,
  PresetGallery,
  StylePanel,
  Timeline,
  TranscriptPanel,
  VideoPlayer,
} from "../components/editor";

// Import utility functions
import {
  assToHex,
  styleToAssColors,
} from "../utils/colorConvert";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

// Types
type Preset = StyleConfig & { label?: string };

// Constants
const PRESET_LABELS: Record<string, string> = {
  mademyday: "Made My Day (3'lü sabit grup)",
};

const DEFAULT_BG_VIDEO = "/audiobg/audio-bg-1.mp4";

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

/**
 * Normalize font name to match available options
 */
const normalizeFontName = (
  options: { name: string; file: string }[],
  value?: string
): string => {
  if (!options.length) return value || "";
  if (!value) return options[0].name;

  const lc = value.toLowerCase();
  const strip = (s: string) =>
    s
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(
        /\b(extra|ultra)?\s*(bold|light|thin|regular|medium|black|heavy|book|semibold)\b/g,
        ""
      )
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

  const overlayRef = useRef<HTMLDivElement>(null);

  // State
  const [project, setProject] = useState<ProjectMeta | null>(
    (location.state as any)?.project || null
  );
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");
  const [bgVideoUrl, setBgVideoUrl] = useState<string>(DEFAULT_BG_VIDEO);
  const [words, setWords] = useState<WordCue[]>(
    (location.state as any)?.words || defaultWords
  );
  const [style, setStyle] = useState<StyleConfig>(defaultFireStormStyle);
  const [assContent, setAssContent] = useState<string>("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"presets" | "style" | "transcript">("presets");
  const [exporting, setExporting] = useState(false);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [exportName, setExportName] = useState("pycaps_export");
  const [exportQuality, setExportQuality] = useState("1080p");
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetSynced, setPresetSynced] = useState(false);
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Media player hook
  const {
    videoRef,
    audioRef,
    bgVideoRef,
    state: mediaState,
    controls: mediaControls,
    getVideoProps,
    getAudioProps,
    getBgVideoProps,
  } = useMediaPlayer(mediaType, {});

  const currentTime = mediaState.currentTime;
  const isPlaying = mediaState.isPlaying;
  const mediaDuration = mediaState.duration;

  // Computed values
  const activeIndex = useMemo(
    () => words.findIndex((w) => w && currentTime >= w.start && currentTime < w.end),
    [words, currentTime]
  );

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
    return ordered
      .filter((f) => f)
      .filter((f) => {
        const key = f.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((fname) => `/fonts/${encodeName(fname)}`);
  }, [style.font, fontOptions]);

  const resolvedVideoUrl = useMemo(() => {
    if (!videoUrl) return "";
    if (videoUrl.startsWith("http")) return videoUrl;
    const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api").replace(/\/api$/, "");
    if (videoUrl.startsWith("/projects/")) {
      const streamPath = videoUrl.replace("/projects/", "/stream/");
      return `${apiBase}${streamPath}`;
    }
    return new URL(videoUrl, apiBase).toString();
  }, [videoUrl]);

  const resolvedAudioUrl = useMemo(() => {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http")) return audioUrl;
    const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api").replace(/\/api$/, "");
    if (audioUrl.startsWith("/projects/")) {
      const streamPath = audioUrl.replace("/projects/", "/stream/");
      return `${apiBase}${streamPath}`;
    }
    return new URL(audioUrl, apiBase).toString();
  }, [audioUrl]);

  // Handlers
  const handleSeek = useCallback(
    (time: number) => {
      const media = mediaType === "video" ? videoRef.current : audioRef.current;
      if (!media) return;

      const duration = media.duration && isFinite(media.duration) ? media.duration : Infinity;
      const clampedTime = Math.max(0, Math.min(time, duration));

      mediaControls.seek(clampedTime);

      if ("fastSeek" in media && typeof media.fastSeek === "function") {
        try {
          (media as any).fastSeek(clampedTime);
          return;
        } catch (e) {
          // Fall back to currentTime
        }
      }

      try {
        media.currentTime = clampedTime;
      } catch (e) {
        console.error("Seek error:", e);
      }
    },
    [mediaType, videoRef, audioRef, mediaControls]
  );

  const handleWordChange = useCallback((idx: number, text: string) => {
    setWords((prev) => {
      const clone = [...prev];
      if (clone[idx]) clone[idx] = { ...clone[idx], text };
      return clone;
    });
  }, []);

  const handleWordTimeChange = useCallback(
    (idx: number, field: "start" | "end", value: number) => {
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
    },
    []
  );

  const addWord = useCallback(() => {
    setWords((prev) => {
      const lastEnd = prev.length ? prev[prev.length - 1].end : 0;
      return [...prev, { start: lastEnd + 0.2, end: lastEnd + 1.2, text: "New subtitle" }];
    });
  }, []);

  const deleteWord = useCallback((idx: number) => {
    setWords((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const sortWords = useCallback(() => {
    setWords((prev) => [...prev].sort((a, b) => a.start - b.start));
  }, []);

  const duplicateWord = useCallback((idx: number) => {
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
  }, []);

  const applyPreset = useCallback(
    (preset: Preset) => {
      const normalizedFont = normalizeFontName(fontOptions, preset.font as string);

      // Convert old margin_v values to new system
      let newMarginV = 0;
      if (preset.margin_v !== undefined) {
        const oldValue = preset.margin_v;
        if (oldValue >= 0 && oldValue <= 150) {
          newMarginV = Math.round((oldValue - 75) * (100 / 75));
          newMarginV = Math.max(-100, Math.min(100, newMarginV));
        } else {
          newMarginV = oldValue;
        }
      }

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
        alignment: preset.alignment ?? prev.alignment ?? 5,
        margin_v: newMarginV,
      }));
    },
    [fontOptions]
  );

  const savePreset = useCallback(async () => {
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
    Object.assign(payload, styleToAssColors(payload));

    if (payload.shadow == null && payload.shadow_blur != null) payload.shadow = payload.shadow_blur;
    if (payload.blur == null && payload.shadow_blur != null) payload.blur = payload.shadow_blur;

    setSavingPreset(true);
    try {
      await axios.post(`${API_BASE}/presets/update`, payload);
      setToast({ open: true, message: "Preset kaydedildi.", severity: "success" });
    } catch (err: any) {
      console.error("Preset save failed", err);
      const msg = err?.response?.data?.detail || "Failed to save preset";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setSavingPreset(false);
    }
  }, [style, presets]);

  const handleExport = useCallback(async () => {
    setShowRenderModal(false);
    setExporting(true);

    const form = new FormData();
    form.append("words_json", JSON.stringify(words));
    form.append("style_json", JSON.stringify(styleToAssColors(style)));
    if (projectId && projectId !== "demo") form.append("project_id", projectId);
    form.append("resolution", exportQuality);

    try {
      const res = await axios.post(`${API_BASE}/export`, form, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      navigate(`/export/${projectId || "latest"}`, {
        state: { videoUrl: blobUrl, filename: `${exportName}.mp4` },
      });
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  }, [words, style, projectId, exportQuality, exportName, navigate]);

  const handleBgVideoSelect = useCallback((url: string) => {
    setBgVideoUrl(url);
    setShowBgSelector(false);
  }, []);

  // Effects
  useEffect(() => {
    if (!projectId || projectId === "demo") {
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

  useEffect(() => {
    if (presetSynced || !presets.length || style.id !== "fire-storm") return;
    const fire = presets.find((p) => p.id === "fire-storm");
    if (fire) {
      applyPreset(fire);
      setPresetSynced(true);
    }
  }, [presets, presetSynced, style.id, applyPreset]);

  useEffect(() => {
    if (!words.length) return;
    const handle = setTimeout(async () => {
      const styleForBackend = styleToAssColors(style);

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
    }, 700);
    return () => clearTimeout(handle);
  }, [words, style, projectId]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LoadingOverlay isLoading={exporting} />

      {/* Header */}
      <EditorHeader exporting={exporting} onExportClick={() => setShowRenderModal(true)} />

      <Grid container spacing={2} sx={{ flex: 1, px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 } }}>
        {/* Left Panel - Presets/Style/Transcript */}
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
              <PresetGallery
                presets={presets}
                selectedPresetId={style.id}
                onPresetSelect={applyPreset}
              />
            )}

            {activeTab === "style" && (
              <StylePanel
                style={style}
                fontOptions={fontOptions}
                savingPreset={savingPreset}
                onStyleChange={setStyle}
                onSavePreset={savePreset}
              />
            )}

            {activeTab === "transcript" && (
              <TranscriptPanel
                words={words}
                totalDuration={totalDuration}
                activeIndex={activeIndex}
                onWordChange={handleWordChange}
                onWordTimeChange={handleWordTimeChange}
                onAddWord={addWord}
                onDeleteWord={deleteWord}
                onDuplicateWord={duplicateWord}
                onSortWords={sortWords}
                onSeekToWord={handleSeek}
              />
            )}
          </Paper>
        </Grid>

        {/* Right Panel - Video & Timeline */}
        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              p: { xs: 1.5, md: 2 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRadius: 2,
            }}
          >
            {/* Audio Mode: Background video selector */}
            {mediaType === "audio" && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Chip icon={<Film size={14} />} label="Audio Mode" size="small" color="info" variant="outlined" />
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

            {/* Video Player */}
            <VideoPlayer
              mediaType={mediaType}
              videoRef={videoRef}
              audioRef={audioRef}
              bgVideoRef={bgVideoRef}
              overlayRef={overlayRef}
              resolvedVideoUrl={resolvedVideoUrl}
              resolvedAudioUrl={resolvedAudioUrl}
              bgVideoUrl={bgVideoUrl}
              assContent={assContent}
              overlayFonts={overlayFonts}
              isPlaying={isPlaying}
              onTogglePlay={mediaControls.toggle}
              getVideoProps={getVideoProps}
              getAudioProps={getAudioProps}
              getBgVideoProps={getBgVideoProps}
            />

            {/* Timeline */}
            <Timeline
              currentTime={currentTime}
              totalDuration={totalDuration}
              isPlaying={isPlaying}
              muted={mediaState.muted}
              volume={mediaState.volume}
              timelineCues={timelineCues}
              onSeek={handleSeek}
              onTogglePlay={mediaControls.toggle}
              onToggleMute={mediaControls.toggleMute}
              onVolumeChange={mediaControls.setVolume}
              onSkipBackward={mediaControls.skipBackward}
              onSkipForward={mediaControls.skipForward}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Render Modal */}
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

      {/* Background Video Selector Dialog */}
      <Dialog open={showBgSelector} onClose={() => setShowBgSelector(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Film size={20} />
            <Typography variant="h6">Select Background Video</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choose a background video for your audio subtitle preview.
          </Typography>

          <Typography variant="subtitle2" mb={1}>
            Available Background Videos
          </Typography>
          <Grid container spacing={1.5} mb={3}>
            {[{ name: "Default BG 1", url: "/audiobg/audio-bg-1.mp4" }].map((bg, idx) => (
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
                    <Box
                      component="video"
                      src={bg.url}
                      muted
                      loop
                      autoPlay
                      playsInline
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <Box sx={{ p: 1, textAlign: "center" }}>
                    <Typography variant="caption">{bg.name}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" mb={1}>
            Custom Video URL
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="https://example.com/video.mp4"
              value={bgVideoUrl}
              onChange={(e) => setBgVideoUrl(e.target.value)}
            />
            <Button variant="contained" onClick={() => setShowBgSelector(false)}>
              Apply
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBgSelector(false)}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleBgVideoSelect(DEFAULT_BG_VIDEO)}>
            Reset to Default
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
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
