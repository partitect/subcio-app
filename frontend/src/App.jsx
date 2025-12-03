import { useState, useRef, useMemo, useEffect } from "react";
import axios from "axios";
import ReactPlayer from "react-player";
import SubtitleOverlay from "./components/SubtitleOverlay";
import ControlPanel from "./components/ControlPanel";
import { motion, AnimatePresence } from "framer-motion";
import JSOOverlay from "./components/JSOOverlay";
import LoadingOverlay from "./components/LoadingOverlay";
import { Link } from "react-router-dom";
import { Palette } from "lucide-react";


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";


export default function App() {
  const playerRef = useRef(null);
  const overlayRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [words, setWords] = useState([]);
  const [assContent, setAssContent] = useState(null); // New state for ASS content
  const [language, setLanguage] = useState("");
  const [device, setDevice] = useState("");
  const [modelName, setModelName] = useState("medium");
  const [videoAspect, setVideoAspect] = useState(9 / 16);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [style, setStyle] = useState({
    id: "neon-glow",
    font: "Inter",
    primary_color: "#ffffff",
    outline_color: "#00ff00",
    font_size: 56,
    bold: 1,
    border: 3,
    shadow: 1,
    shadow_color: "#000000",
    shadow_x: 0,
    shadow_y: 2,
    shadow_blur: 8,
    alignment: 2,
  });
  const [resolution, setResolution] = useState("1080p");

  // Fetch ASS preview when words or style change
  useEffect(() => {
    const fetchPreviewAss = async () => {
      if (!words.length) return;

      const form = new FormData();
      form.append("words_json", JSON.stringify(words));
      form.append("style_json", JSON.stringify(style));

      try {
        const res = await axios.post(`${API_BASE}/preview-ass`, form);
        setAssContent(res.data);
      } catch (err) {
        console.error("Preview fetch failed:", err);
      }
    };

    // Debounce slightly to avoid too many requests
    const timeoutId = setTimeout(fetchPreviewAss, 300);
    return () => clearTimeout(timeoutId);
  }, [words, style]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setWords([]);
    await handleTranscribe(file);
  };

  const handleTranscribe = async (file) => {
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("model_name", modelName);
    try {
      const { data } = await axios.post(`${API_BASE}/transcribe`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setWords(data.words || []);
      setLanguage(data.language || "");
      setDevice(data.device || "auto");
      if (data.model) setModelName(data.model);
    } catch (err) {
      console.error(err);
      alert("Transcription failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTestVideo = async () => {
    setLoading(true);
    try {
      // Load dummy words
      const response = await fetch('/test-video/test-data.json');
      const data = await response.json();
      setWords(data);

      // Set video URL
      setVideoUrl('/test-video/export_7ea10b8f2a224be0953d0792b13f7605.mp4');
      setVideoFile(null); // Not a real file upload
      setLanguage("en");
      setModelName("test-mode");
      setDevice("virtual");

    } catch (error) {
      console.error("Failed to load test video:", error);
      alert("Failed to load test video data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!videoFile || !words.length) return;
    const form = new FormData();
    form.append("video", videoFile);
    form.append("words_json", JSON.stringify(words));
    form.append("style_json", JSON.stringify(style));
    form.append("resolution", resolution);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/export`, form, {
        responseType: "blob",
      });

      // Extract filename from Content-Disposition header if available
      const contentDisposition = res.headers['content-disposition'];
      let filename = "subcio_export.mp4";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();

      // Clean up blob URL after download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error(err);
      alert("Export failed. Check backend logs.");
    } finally {
      setLoading(false);
      setShowExport(false);
    }
  };

  const handleWordEdit = (index, newText) => {
    setWords((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], text: newText };
      return clone;
    });
  };

  const activeIndex = useMemo(() => {
    return words.findIndex(
      (w) => currentTime >= w.start && currentTime < w.end
    );
  }, [words, currentTime]);

  return (
    <div className="min-h-screen text-white flex flex-col overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 glass-panel px-4 md:px-6 py-5 flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center border-b border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Subcio Studio
            </h1>
            <p className="text-xs text-white/50 flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-500/30">
                {modelName}
              </span>
              <span className="text-white/30">•</span>
              <span>{language || "Dil algılanacak"}</span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1">
                {device === "cuda" ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    GPU
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    CPU
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <label className="relative group cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/80 hover:to-slate-600/80 rounded-xl border border-white/10 hover:border-emerald-400/50 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium">Video Yükle</span>
            </div>
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>

          <button
            onClick={handleLoadTestVideo}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/80 hover:to-pink-500/80 rounded-xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 text-white"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Test Video</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExport(true)}
            disabled={!words.length || loading}
            className="relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 px-3 md:px-6 py-6 min-h-0">
        {/* Control Panel */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl shadow-2xl overflow-hidden hover-lift lg:col-span-9 h-[600px]"
        >
          <ControlPanel
            style={style}
            onStyleChange={setStyle}
            words={words}
            onWordEdit={handleWordEdit}
            loading={loading}
            resolution={resolution}
            onResolutionChange={setResolution}
            modelName={modelName}
            onModelChange={setModelName}
          />
        </motion.aside>

        {/* Video Preview Section */}
        <motion.section
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl shadow-2xl overflow-hidden relative flex items-center justify-center w-full hover-lift lg:col-span-3"
        >
          <div
            ref={overlayRef}
            className="relative bg-black/80 rounded-xl overflow-hidden shadow-lg w-full h-full max-w-full border border-white/5"
            style={{ aspectRatio: videoAspect || 1.777, maxHeight: "100%" }}
          >
            {videoUrl ? (
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                controls
                width="100%"
                height="100%"
                progressInterval={10}
                onReady={() => {
                  try {
                    const internal = playerRef.current?.getInternalPlayer();
                    const vw = internal?.videoWidth;
                    const vh = internal?.videoHeight;
                    if (vw && vh) setVideoAspect(vw / vh);
                  } catch { }
                }}
                onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                config={{
                  file: {
                    attributes: {
                      crossOrigin: "anonymous",
                      style: { objectFit: "contain", width: "100%", height: "100%" },
                    },
                  },
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-10 h-10 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm">Video yükleyin veya sürükleyin</span>
              </div>
            )}

            {/* Use JSOOverlay instead of SubtitleOverlay */}
            {assContent && (
              <JSOOverlay
                videoRef={playerRef}
                assContent={assContent}
              />
            )}

            {/* Keep SubtitleOverlay only for dragging/editing UI if needed, 
                but hide its text rendering to avoid double subtitles */}
            <SubtitleOverlay
              containerRef={overlayRef}
              words={words}
              currentTime={currentTime}
              activeStyle={style}
              activeIndex={activeIndex}
              renderText={false} // New prop to disable text rendering
            />
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {showExport && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && setShowExport(false)}
          >
            <motion.div
              className="glass-panel rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-white/20"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Export Ayarları</h4>
                  <p className="text-xs text-white/50">Video kalitesi ve model seçimi</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <label className="text-sm font-medium text-white/80 mb-2 block">Çözünürlük</label>
                  <select
                    className="w-full bg-slate-800/80 hover:bg-slate-700/80 rounded-lg px-3 py-2.5 text-white border border-white/10 focus:border-emerald-400/50 focus:outline-none transition-all"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  >
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="4k">4K (Ultra HD)</option>
                    <option value="original">Orijinal</option>
                  </select>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <label className="text-sm font-medium text-white/80 mb-2 block">Whisper Model</label>
                  <select
                    className="w-full bg-slate-800/80 hover:bg-slate-700/80 rounded-lg px-3 py-2.5 text-white border border-white/10 focus:border-emerald-400/50 focus:outline-none transition-all"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  >
                    {["tiny", "base", "small", "medium", "large-v2", "large-v3", "distil-large-v3", "turbo"].map(
                      (m) => (
                        <option key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {loading && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-emerald-400 font-medium">Video işleniyor...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExport(false)}
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl py-3 font-medium border border-white/10 hover:border-white/20 transition-all"
                  disabled={loading}
                >
                  İptal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  disabled={!words.length || loading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl py-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                >
                  {loading ? "İşleniyor..." : "Dışa Aktar"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Magic Loading Overlay */}
      <LoadingOverlay isLoading={loading} />

      {/* Floating Preset Editor Button */}
      <Link
        to="/preset-editor"
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
      >
        <Palette className="w-5 h-5" />
        <span className="font-semibold">Preset Editor</span>
      </Link>
    </div>
  );
}

