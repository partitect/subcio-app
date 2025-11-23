import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UploadCloud, PlayCircle, Languages } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

const models = ["tiny", "base", "small", "medium", "large-v2", "large-v3", "distil-large-v3", "turbo"];

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("");
  const [model, setModel] = useState<string>("medium");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const dropLabel = useMemo(() => (file ? file.name : "Drop a video or audio file here"), [file]);

  const handleFile = (incoming?: File) => {
    if (incoming) {
      setFile(incoming);
      setLogs((prev) => [...prev, `Selected file: ${incoming.name}`]);
    }
  };

  const startTranscription = async () => {
    if (!file) return;
    setLoading(true);
    setLogs((prev) => [...prev, "Uploading and transcribing..."]);
    const form = new FormData();
    form.append("file", file);
    form.append("model_name", model);
    if (language) form.append("language", language);

    try {
      const { data } = await axios.post(`${API_BASE}/transcribe`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogs((prev) => [...prev, "Transcription finished, creating project..."]);
      const projectId = data.projectId || data.project?.id;
      navigate(`/editor/${projectId}`, { state: { project: data.project, words: data.words } });
    } catch (err) {
      console.error(err);
      setLogs((prev) => [...prev, "Transcription failed. Check backend logs."]);
      alert("Transcription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80 mb-2">Upload</p>
          <h1 className="text-3xl font-black mb-6">Upload & Transcribe</h1>

          <label
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl py-12 cursor-pointer bg-white/5 hover:border-emerald-400/50 transition"
          >
            <UploadCloud className="w-10 h-10 text-emerald-300 mb-3" />
            <p className="font-semibold">{dropLabel}</p>
            <p className="text-white/50 text-sm mt-1">MP4, MOV, WAV, MP3</p>
            <input
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <PlayCircle className="w-4 h-4 text-emerald-300" />
                Whisper Model
              </div>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 rounded-lg px-3 py-2 border border-white/10 focus:border-emerald-400/60 outline-none"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Languages className="w-4 h-4 text-cyan-300" />
                Language
              </div>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="auto-detect or en, tr..."
                className="w-full bg-slate-900 rounded-lg px-3 py-2 border border-white/10 focus:border-cyan-400/60 outline-none"
              />
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <span className="w-4 h-4 bg-emerald-400 rounded-full inline-block" />
                Status
              </div>
              <p className="text-white/70 text-sm">{loading ? "Processing..." : "Ready"}</p>
            </div>
          </div>

          {loading && (
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse" />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              disabled={!file || loading}
              onClick={startTranscription}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Working..." : "Start Transcription"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-semibold mb-3">Progress</h2>
          <div className="space-y-2 text-sm text-white/70 max-h-[320px] overflow-y-auto pr-1">
            {logs.length === 0 ? <p className="text-white/40">Waiting for upload...</p> : null}
            {logs.map((line, idx) => (
              <p key={idx}>• {line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
