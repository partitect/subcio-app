import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { stylePool } from "./SubtitleOverlay";

const presetStyleDefaults = {
  "fire-storm": {
    primary_color: "#006DFF", // Orange-ish in BGR
    outline_color: "#000000",
    font_size: 64,
    font: "Archivo Black",
  },
  "cyber-glitch": {
    primary_color: "#FFFFFF",
    outline_color: "#0000FF", // Red-ish in BGR
    font_size: 60,
    font: "Roboto Mono",
  },
  "neon-pulse": {
    primary_color: "#7CFFFC", // Cyan
    outline_color: "#FF00FF", // Magenta
    font_size: 62,
    font: "Inter",
  },
  "kinetic-bounce": {
    primary_color: "#FFFFFF",
    outline_color: "#000000",
    font_size: 64,
    font: "Sora",
  },
  "cinematic-blur": {
    primary_color: "#E0E0E0",
    outline_color: "#000000",
    font_size: 58,
    font: "Montserrat",
  },
  "thunder-strike": {
    primary_color: "#FFFF00",
    outline_color: "#000000",
    font_size: 66,
    font: "Impact",
  },
  "typewriter-pro": {
    primary_color: "#FFFFFF",
    outline_color: "#000000",
    font_size: 56,
    font: "Courier New",
  },
  "rainbow-wave": {
    primary_color: "#FFFFFF",
    outline_color: "#000000",
    font_size: 64,
    font: "Fredoka One",
  },
  "earthquake-shake": {
    primary_color: "#FF0000",
    outline_color: "#FFFFFF",
    font_size: 70,
    font: "Bebas Neue",
  },
  "word-pop": {
    primary_color: "#FFFFFF",
    outline_color: "#333333",
    font_size: 60,
    font: "Poppins",
  },
  "retro-arcade": {
    primary_color: "#00FF00",
    outline_color: "#000000",
    font_size: 50,
    font: "Press Start 2P",
  },
  "horror-creepy": {
    primary_color: "#FF0000",
    outline_color: "#330000",
    font_size: 68,
    font: "BlackCaps",
  },
  "luxury-gold": {
    primary_color: "#FFD700",
    outline_color: "#000000",
    font_size: 60,
    font: "Montserrat",
  },
  "comic-book": {
    primary_color: "#FFFFFF",
    outline_color: "#000000",
    font_size: 64,
    font: "Komika Axis",
  },
  "news-ticker": {
    primary_color: "#FFFFFF",
    outline_color: "#000000",
    font_size: 48,
    font: "Roboto Mono",
  },
};

const googleFonts = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Sora",
  "Space Grotesk",
  "Roboto Mono",
  "Bebas Neue",
  "Archivo Black",
  "Oswald",
  "Lobster",
  "Press Start 2P",
  "Komika Axis",
  "BlackCaps",
];

const getGradient = (id) => {
  const palette = {
    "fire-storm": "from-orange-500 to-red-600",
    "cyber-glitch": "from-cyan-500 to-blue-600",
    "neon-pulse": "from-fuchsia-500 to-cyan-500",
    "kinetic-bounce": "from-emerald-400 to-teal-600",
    "cinematic-blur": "from-slate-400 to-slate-600",
    "thunder-strike": "from-yellow-400 to-amber-500",
    "typewriter-pro": "from-gray-700 to-black",
    "rainbow-wave": "from-pink-500 via-purple-500 to-indigo-500",
    "earthquake-shake": "from-red-600 to-rose-800",
    "word-pop": "from-violet-500 to-purple-600",
    "retro-arcade": "from-green-500 to-emerald-700",
    "horror-creepy": "from-red-900 to-black",
    "luxury-gold": "from-yellow-400 to-amber-600",
    "comic-book": "from-blue-400 to-yellow-400",
    "news-ticker": "from-blue-800 to-slate-900",
  };
  return palette[id] || "from-slate-700 to-slate-900";
};

const parseColorToHex = (val) => {
  if (!val) return "#ffffff";
  if (val.startsWith("#")) return val;
  const up = val.toUpperCase();
  if (up.startsWith("&H") && up.length === 10) {
    const bb = up.slice(4, 6);
    const gg = up.slice(6, 8);
    const rr = up.slice(8, 10);
    return `#${rr}${gg}${bb}`;
  }
  return "#ffffff";
};

export default function ControlPanel({
  style,
  onStyleChange,
  words,
  onWordEdit,
  loading,
  resolution,
  onResolutionChange,
  modelName,
  onModelChange,
}) {
  const [activeTab, setActiveTab] = useState("presets"); // presets | settings
  const previewWords = useMemo(() => words.slice(0, 6), [words]);

  const handleStylePick = (id) => {
    const preset = presetStyleDefaults[id] || {};
    onStyleChange({ ...style, id, ...preset });
  };

  const handleFont = (font) => onStyleChange({ ...style, font });
  const handleSize = (size) =>
    onStyleChange({ ...style, font_size: Number(size) });
  const handleAlign = (alignment) =>
    onStyleChange({ ...style, alignment: Number(alignment) });

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/70 rounded-2xl p-3 flex flex-col gap-3 h-full overflow-hidden">

      {/* Tab Navigation */}
      <div className="flex p-1 bg-slate-800/50 rounded-xl border border-white/5 shrink-0">
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "presets"
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20"
            : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
        >
          Presetler
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "settings"
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20"
            : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
        >
          Ayarlar
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "timeline"
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
            : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
        >
          Timeline
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
        {activeTab === "presets" && (
          /* Style Selector Tab */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stylePool.map((item) => {
              const isSelected = style.id === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStylePick(item.id)}
                  className={`
                    relative p-3 rounded-xl border text-left transition-all overflow-hidden group
                    ${isSelected
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                    }
                  `}
                >
                  <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${getGradient(item.id)}`} />

                  <div className="relative z-10 flex flex-col gap-1">
                    <span className={`text-xs font-bold tracking-wide ${isSelected ? "text-emerald-400" : "text-white/90"}`}>
                      {item.label}
                    </span>
                    <div className="flex gap-1 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${getGradient(item.id)}`} />
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${getGradient(item.id)} opacity-50`} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {activeTab === "settings" && (
          /* Settings Tab */
          <div className="flex flex-col gap-3">
            {/* Font & Size */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <h4 className="text-xs font-semibold text-white/90 mb-2 flex items-center gap-1.5">
                <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Tipografi
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-white/60 mb-1 block">Font</label>
                  <select
                    className="w-full bg-slate-800/80 hover:bg-slate-700/80 rounded-md px-2 py-1.5 text-xs border border-white/10 focus:border-cyan-400/50 focus:outline-none transition-all"
                    value={style.font}
                    onChange={(e) => handleFont(e.target.value)}
                  >
                    {googleFonts.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/60 mb-1 block">Boyut</label>
                  <input
                    type="number"
                    min={24}
                    max={96}
                    value={style.font_size}
                    onChange={(e) => handleSize(e.target.value)}
                    className="w-full bg-slate-800/80 hover:bg-slate-700/80 rounded-md px-2 py-1.5 text-xs border border-white/10 focus:border-cyan-400/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <h4 className="text-xs font-semibold text-white/90 mb-2 flex items-center gap-1.5">
                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Renkler
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-white/60 mb-1 block">Ana</label>
                  <input
                    type="color"
                    value={parseColorToHex(style.primary_color)}
                    onChange={(e) =>
                      onStyleChange({ ...style, primary_color: e.target.value })
                    }
                    className="w-full bg-slate-800/80 rounded-md h-8 px-1 border border-white/10 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 mb-1 block">Stroke</label>
                  <input
                    type="color"
                    value={parseColorToHex(style.outline_color)}
                    onChange={(e) =>
                      onStyleChange({ ...style, outline_color: e.target.value })
                    }
                    className="w-full bg-slate-800/80 rounded-md h-8 px-1 border border-white/10 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 mb-1 block">Gölge</label>
                  <input
                    type="color"
                    value={parseColorToHex(style.shadow_color || "#000000")}
                    onChange={(e) =>
                      onStyleChange({ ...style, shadow_color: e.target.value })
                    }
                    className="w-full bg-slate-800/80 rounded-md h-8 px-1 border border-white/10 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Effects */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <h4 className="text-xs font-semibold text-white/90 mb-2 flex items-center gap-1.5">
                <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Efektler
              </h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-white/60">Stroke</label>
                    <span className="text-[10px] text-emerald-400 font-mono">{style.border}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={style.border}
                    onChange={(e) =>
                      onStyleChange({ ...style, border: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-white/60">Gölge Blur</label>
                    <span className="text-[10px] text-emerald-400 font-mono">{style.shadow_blur || 8}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={style.shadow_blur || 8}
                    onChange={(e) =>
                      onStyleChange({ ...style, shadow_blur: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Alignment - Compact */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAlign(2)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${style.alignment === 2
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border border-white/10"
                  }`}
              >
                Alt
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAlign(5)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${style.alignment === 5
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border border-white/10"
                  }`}
              >
                Orta
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAlign(8)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${style.alignment === 8
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border border-white/10"
                  }`}
              >
                Üst
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          /* Timeline Tab */
          <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between flex-shrink-0 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white/90">Zaman Çizelgesi</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-lg border border-purple-500/20">
                {words.length} kelime
              </span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {words.map((w, i) => (
                <motion.div
                  key={`${w.start}-${i}`}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.005 }}
                  className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-purple-400/50 rounded-lg p-2 flex items-center gap-3 transition-all duration-200 hover:bg-white/[0.07] group"
                >
                  <div className="flex flex-col items-end min-w-[60px]">
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">
                      {w.start.toFixed(1)}s
                    </span>
                    <span className="text-white/30 font-mono text-[9px]">
                      {w.end.toFixed(1)}s
                    </span>
                  </div>

                  <div className="h-8 w-[1px] bg-white/10 group-hover:bg-purple-500/30 transition-colors" />

                  <input
                    value={w.text}
                    onChange={(e) => onWordEdit(i, e.target.value)}
                    className="bg-transparent text-sm text-white/90 focus:text-white focus:outline-none w-full placeholder-white/20 font-medium"
                    placeholder="Metin..."
                  />

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </motion.div>
              ))}
              {!words.length && (
                <div className="w-full py-12 flex flex-col items-center justify-center text-white/30 gap-2">
                  <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-xs">Transkript bekleniyor...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
