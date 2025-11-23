import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { Download, ArrowLeft, Plus } from "lucide-react";

export default function ExportPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoUrl = useMemo(() => (location.state as any)?.videoUrl as string | undefined, [location.state]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 mb-1">Export Ready</p>
        <h1 className="text-3xl font-black mb-4">Your video is ready</h1>
        {videoUrl ? (
          <video src={videoUrl} controls className="w-full rounded-xl border border-white/10 mb-4" />
        ) : (
          <div className="h-64 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-white/40 mb-4">
            Provide a video to preview here.
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {videoUrl && (
            <a
              href={videoUrl}
              download={`pycaps-${projectId || "export"}.mp4`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold shadow-lg shadow-emerald-500/30"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
          <button
            onClick={() => navigate(`/editor/${projectId || "latest"}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Editor
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>
    </div>
  );
}
