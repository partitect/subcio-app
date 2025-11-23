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

const defaultWords: WordCue[] = [
  { start: 0, end: 0.8, text: "Grouped" },
  { start: 0.8, end: 1.6, text: "preview" },
  { start: 1.6, end: 2.4, text: "now" },
  { start: 2.4, end: 3.2, text: "matches" },
  { start: 3.2, end: 4.0, text: "export" },
];

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
    font: "Inter",
    primary_color: "#ffffff",
    secondary_color: "#00ffff",
    outline_color: "#000000",
    shadow_color: "#000000",
    shadow_blur: 6,
    font_size: 56,
    alignment: 2,
    border: 2,
  });
  const [assContent, setAssContent] = useState<string>("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [fontOptions, setFontOptions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"presets" | "style" | "transcript">("presets");
  const [resolution, setResolution] = useState("1080p");
  const [exporting, setExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [exportName, setExportName] = useState("pycaps_export");
  const [exportQuality, setExportQuality] = useState("1080p");

  const activeIndex = useMemo(
    () => words.findIndex((w) => w && currentTime >= w.start && currentTime < w.end),
    [words, currentTime]
  );

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
        setStyle((prev) => ({
          ...prev,
          ...styleFromConfig,
          id: styleFromConfig.id || prev.id,
          primary_color: assToHex(styleFromConfig.primary_color),
          secondary_color: assToHex(styleFromConfig.secondary_color),
          outline_color: assToHex(styleFromConfig.outline_color),
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
        if (data?.fonts) setFontOptions(data.fonts);
      })
      .catch((err) => console.error("Failed to load fonts", err));
  }, []);

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
    setStyle((prev) => ({
      ...prev,
      ...preset,
      id: preset.id,
      primary_color: assToHex(preset.primary_color as string),
      secondary_color: assToHex(preset.secondary_color as string),
      outline_color: assToHex(preset.outline_color as string),
    }));
  };

  const takeScreenshot = async () => {
    if (!overlayRef.current) return;
    const node = overlayRef.current;
    const prevBg = node.style.backgroundColor;
    const prevFilter = node.style.filter;
    // Hide video layer for clean caption-only shot
    node.style.backgroundColor = "#ffffff";
    node.style.filter = "none";
    node.querySelectorAll("video").forEach((vid) => ((vid as HTMLVideoElement).style.display = "none"));

    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 1.2,
    });

    // restore
    node.style.backgroundColor = prevBg;
    node.style.filter = prevFilter;
    node.querySelectorAll("video").forEach((vid) => ((vid as HTMLVideoElement).style.display = ""));

    const image = canvas.toDataURL("image/png");
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
            {assContent && <JSOOverlay videoRef={playerRef} assContent={assContent} />}
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
                    <span className="text-white/30 text-xs">Preview</span>
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
                      <option key={f} value={f}>
                        {f}
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
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={takeScreenshot}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400/50"
                >
                  <ImageIcon className="w-4 h-4" />
                  Save preset screenshot
                </button>
                <button
                  onClick={() => setActiveTab("transcript")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20"
                >
                  <ListChecks className="w-4 h-4" />
                  Transcript tab
                </button>
              </div>
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="space-y-2 overflow-y-auto pr-1 max-h-[70vh]">
              {words.map((w, idx) => (
                <div key={`${w.text}-${idx}`} className={`p-2 rounded-lg border ${idx === activeIndex ? "border-emerald-400/60 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
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
