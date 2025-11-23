import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProjectMeta } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export default function LandingPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/projects`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load projects", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-purple-600/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-14 flex flex-col gap-10">
          <header className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">Subtitle Studio</p>
              <h1 className="text-4xl md:text-5xl font-black mt-2 leading-tight">
                Style-rich captions with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400">real-time</span> feedback
              </h1>
              <p className="text-white/60 mt-3 max-w-2xl">
                Upload, transcribe, style, and export without leaving the browser. Saved projects keep your media, transcripts, and presets together.
              </p>
              <div className="flex gap-3 mt-6">
                <Link
                  to="/upload"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/editor/demo"
                  className="px-5 py-3 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 transition"
                >
                  Open Demo Editor
                </Link>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur">
              <p className="text-sm text-white/70 mb-2">Recent activity</p>
              <ul className="space-y-2 text-white/80">
                <li>Grouped subtitles now stay locked in place.</li>
                <li>Preset screenshots saved to public previews.</li>
                <li>Project history lives in the backend.</li>
              </ul>
            </div>
          </header>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Link to="/upload" className="text-emerald-300 hover:text-emerald-200 text-sm">New Project →</Link>
            </div>
            {projects.length === 0 ? (
              <div className="text-white/50 border border-dashed border-white/10 rounded-xl p-8 text-center">
                No projects yet. Start by uploading a video.
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    to={`/editor/${project.id}`}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-emerald-400/40 transition shadow-lg hover:shadow-emerald-500/20"
                  >
                    <div className="relative h-40 bg-slate-900">
                      {project.thumb_url ? (
                        <img
                          src={project.thumb_url}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          No thumbnail
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{project.name}</p>
                        <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {project.id.slice(0, 6)}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm">
                        {project.created_at ? new Date(project.created_at).toLocaleString() : "Unknown date"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
