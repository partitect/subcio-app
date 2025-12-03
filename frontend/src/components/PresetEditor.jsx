import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  Save,
  RotateCcw,
  Plus,
  Layout,
  Type,
  Palette,
  Zap,
  MousePointer2,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
  Wand2,
  ListFilter,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const colorPalettes = [
  { name: "Fire", primary: "#ff7a2b", outline: "#1f0a00", shadow: "#0c0505" },
  { name: "Neon", primary: "#ff5cf0", outline: "#1c032f", shadow: "#0b0016" },
  { name: "Ice", primary: "#8ae3ff", outline: "#0f3a55", shadow: "#04121f" },
  { name: "Sunset", primary: "#ffd166", outline: "#743c00", shadow: "#2d1100" },
  { name: "Mono", primary: "#ffffff", outline: "#000000", shadow: "#000000" },
];

const alignmentPresets = [
  { key: "top", label: "Ust", alignment: 8, margin: 90 },
  { key: "middle", label: "Orta", alignment: 5, margin: 40 },
  { key: "bottom", label: "Alt", alignment: 2, margin: 60 },
];

const resolveFontStack = (fontName = "Inter") => {
  const cleaned = fontName.trim();
  const alt1 = cleaned.replace(/\s+/g, "-");
  const alt2 = cleaned.replace(/-/g, " ");
  const stack = [cleaned, alt1, alt2, "Inter"].filter(
    (v, idx, arr) => v && arr.indexOf(v) === idx
  );
  return stack.join(", ");
};

const detectPreviewMode = (preset) => {
  const id = preset?.id || "";
  if (id.includes("group") || id.includes("sentence") || id.includes("box")) {
    return "group";
  }
  return "word";
};

// Helper: Convert ASS color (&HAABBGGRR) to Hex (#RRGGBB)
const assToHex = (ass) => {
    if (!ass || !ass.startsWith('&H')) return '#ffffff';
    try {
        const clean = ass.replace('&H', '').replace(/&/g, '');
        if (clean.length === 8) {
            const b = clean.substring(2, 4);
            const g = clean.substring(4, 6);
            const r = clean.substring(6, 8);
            return `#${r}${g}${b}`;
        } else if (clean.length === 6) {
            const b = clean.substring(0, 2);
            const g = clean.substring(2, 4);
            const r = clean.substring(4, 6);
            return `#${r}${g}${b}`;
        }
        return '#ffffff';
    } catch (e) {
        return '#ffffff';
    }
};

// Helper: Convert Hex to ASS
const hexToASS = (hex) => {
    if (!hex) return '&H00FFFFFF';
    const clean = hex.replace('#', '');
    const r = clean.substring(0, 2);
    const g = clean.substring(2, 4);
    const b = clean.substring(4, 6);
    return `&H00${b}${g}${r}`;
};

export default function PresetEditor() {
    const [presets, setPresets] = useState([]);
    const [selectedPresetId, setSelectedPresetId] = useState(null);
    const [editedPreset, setEditedPreset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aasCatalog, setAasCatalog] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [fontOptions, setFontOptions] = useState([]);
    const [showFontModal, setShowFontModal] = useState(false);
    const [fontSearch, setFontSearch] = useState("");
    const [showPaletteModal, setShowPaletteModal] = useState(false);
    const [previewMode, setPreviewMode] = useState("word");
    const [aasList, setAasList] = useState([]);
    const [aasSearch, setAasSearch] = useState("");
    const [selectedAasPath, setSelectedAasPath] = useState("");
    const [importingStyle, setImportingStyle] = useState(false);
    const [importError, setImportError] = useState("");
    const filteredFonts = useMemo(() => {
        if (!fontSearch) return fontOptions;
        return fontOptions.filter((f) =>
            f.toLowerCase().includes(fontSearch.toLowerCase())
        );
    }, [fontOptions, fontSearch]);
    const filteredAas = useMemo(() => {
        if (!aasSearch) return aasList;
        return aasList.filter((p) =>
            p.name.toLowerCase().includes(aasSearch.toLowerCase())
        );
    }, [aasList, aasSearch]);

    // Preview States
    const [previewBackground, setPreviewBackground] = useState('gradient'); // gradient, white, black, green, image
    const previewRef = useRef(null);

    // Fetch presets on mount
    useEffect(() => {
        fetchPresets();
        fetchFontList();
        fetchAasList();
        fetch("/AASPRESETS_CATALOG.txt")
            .then(res => res.text())
            .then(text => setAasCatalog(text))
            .catch(err => console.error("Failed to load catalog", err));
    }, []);

    const fetchPresets = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/presets`);
            setPresets(res.data);
            if (res.data.length > 0 && !selectedPresetId) {
                selectPreset(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch presets", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFontList = async () => {
        try {
            const res = await axios.get(`${API_BASE}/fonts`);
            const fonts = res.data?.fonts || [];
            setFontOptions(fonts.sort((a, b) => a.localeCompare(b)));
        } catch (err) {
            console.error("Failed to fetch fonts", err);
        }
    };

    const fetchAasList = async () => {
        try {
            const res = await axios.get(`${API_BASE}/aaspresets/list`);
            const list = res.data || [];
            setAasList(list);
            if (list.length && !selectedAasPath) {
                setSelectedAasPath(list[0].path);
            }
        } catch (err) {
            console.error("Failed to load aas presets", err);
        }
    };

    const selectPreset = (preset) => {
        if (!preset) return;
        setSelectedPresetId(preset.id);
        setEditedPreset(JSON.parse(JSON.stringify(preset))); // Deep copy
        setPreviewMode(detectPreviewMode(preset));
    };

    const handleChange = (key, value) => {
        setEditedPreset(prev => ({ ...prev, [key]: value }));
    };

    const handleColorChange = (key, assValue) => {
        setEditedPreset(prev => ({ ...prev, [key]: assValue }));
    };

    const handleSave = async () => {
        if (!editedPreset) return;
        try {
            await axios.post(`${API_BASE}/presets/update`, editedPreset);
            alert("Preset saved successfully!");
            fetchPresets();
        } catch (err) {
            console.error("Failed to save preset", err);
            alert("Failed to save preset.");
        }
    };

    const handleCreateNew = () => {
        const newId = `custom-${Date.now()}`;
        const newPreset = {
            id: newId,
            font: "Arial",
            font_size: 60,
            primary_color: "&H00FFFFFF",
            secondary_color: "&H0000FFFF",
            outline_color: "&H00000000",
            back_color: "&H00000000",
            alignment: 2,
            margin_v: 50,
            bold: 1,
            italic: 0
        };
        setPresets([...presets, newPreset]);
        selectPreset(newPreset);
    };

    const handleCapture = async () => {
        if (previewRef.current) {
            try {
                const canvas = await html2canvas(previewRef.current, {
                    backgroundColor: null,
                    scale: 2
                });
                const link = document.createElement('a');
                link.download = `preset-${editedPreset.id}.png`;
                link.href = canvas.toDataURL();
                link.click();
            } catch (err) {
                console.error("Screenshot failed:", err);
                alert("Failed to take screenshot. Make sure html2canvas is installed.");
            }
        }
    };

    const handleFontPick = (fontName) => {
        if (!fontName) return;
        setEditedPreset(prev => ({ ...prev, font: fontName }));
        setShowFontModal(false);
    };

    const applyPalette = (palette) => {
        setEditedPreset(prev => ({
            ...prev,
            primary_color: hexToASS(palette.primary),
            outline_color: hexToASS(palette.outline),
            shadow_color: hexToASS(palette.shadow),
        }));
        setShowPaletteModal(false);
    };

    const handlePositionSelect = (pos) => {
        setEditedPreset(prev => ({
            ...prev,
            alignment: pos.alignment,
            margin_v: pos.margin,
        }));
    };

    const handleImportStyle = async () => {
        if (!selectedAasPath) {
            setImportError("Lutfen bir AAS dosyasi secin.");
            return;
        }
        setImportingStyle(true);
        setImportError("");
        try {
            const res = await axios.post(`${API_BASE}/aaspresets/extract-style`, { path: selectedAasPath });
            const imported = res.data || {};
            setEditedPreset(prev => {
                const merged = { ...prev, ...imported };
                setPreviewMode(detectPreviewMode(merged));
                return merged;
            });
            setImportError("Stil uygulandi. Kaydetmeyi unutma.");
        } catch (err) {
            console.error("Import failed", err);
            setImportError("Stil cekilemedi. Loglari kontrol et.");
        } finally {
            setImportingStyle(false);
        }
    };

    // --- PREVIEW COMPONENT ---
    const LivePreview = ({ style, background, mode }) => {
        const containerStyle = {
            fontFamily: resolveFontStack(style.font || 'Arial'),
            fontSize: `${style.font_size || 60}px`,
            fontWeight: style.bold ? 'bold' : 'normal',
            fontStyle: style.italic ? 'italic' : 'normal',
            textShadow: `
                -1px -1px 0 ${assToHex(style.outline_color)},  
                 1px -1px 0 ${assToHex(style.outline_color)},
                -1px  1px 0 ${assToHex(style.outline_color)},
                 1px  1px 0 ${assToHex(style.outline_color)},
                 2px 2px 4px ${assToHex(style.shadow_color || '&H00000000')}
            `,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            height: '100%',
            width: '100%',
            color: assToHex(style.primary_color),
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '0.5rem',
            // Background Logic
            background: background === 'gradient' ? 'linear-gradient(45deg, #1a1a2e 0%, #16213e 100%)' :
                background === 'white' ? '#ffffff' :
                    background === 'black' ? '#000000' :
                        background === 'green' ? '#00ff00' : 'transparent',
            backgroundImage: background === 'image' ? 'url("https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80")' : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        };

        const activeWordStyle = {
            color: assToHex(style.secondary_color),
            transform: `scale(${style.active_scale ? style.active_scale / 100 : 1.1})`,
            backgroundColor: style.active_bg_color ? assToHex(style.active_bg_color) : 'transparent',
            padding: style.active_bg_color ? '6px 12px' : '0 6px',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1.1
        };
        const passiveStyle = {
            opacity: 0.55,
            color: assToHex(style.primary_color),
            textShadow: containerStyle.textShadow,
            fontSize: `${(style.font_size || 60) * 0.62}px`,
            fontFamily: containerStyle.fontFamily,
        };

        return (
            <div ref={previewRef} style={containerStyle}>
                {/* Grid lines (only visible on gradient/black for reference) */}
                {(background === 'gradient' || background === 'black') && (
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
                    </div>
                )}

                {mode === 'group' ? (
                    <div className="w-full flex flex-col gap-2 items-center text-center px-4">
                        <span style={passiveStyle}>Grup stili ornek satir</span>
                        <span style={activeWordStyle}>AKTIF KELIME</span>
                        <span style={passiveStyle}>Kapanis satiri</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 items-center">
                        <span style={activeWordStyle}>AKTIF</span>
                        <span className="text-[11px] text-slate-200/70 tracking-wide">Kelime modu</span>
                    </div>
                )}
            </div>
        );
    };

    if (!editedPreset) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex">
            {/* SIDEBAR: Preset List */}
            <div className="w-64 bg-[#1e293b] border-r border-white/10 flex flex-col max-h-[calc(100vh-20px)]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="font-bold text-emerald-400">Presets</h2>
                    <button onClick={handleCreateNew} className="p-1 hover:bg-white/10 rounded transition">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {presets.map(p => (
                        <button
                            key={p.id}
                            onClick={() => selectPreset(p)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${selectedPresetId === p.id
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'hover:bg-white/5 text-slate-400'
                                }`}
                        >
                            {p.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN EDITOR */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* HEADER */}
                <header className="h-16 bg-[#1e293b] border-b border-white/10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-200 hover:text-white hover:border-emerald-400/60 transition"
                        >
                            <ChevronLeft size={16} />
                            Ana ekrana don
                        </Link>
                        <h1 className="text-xl font-bold">{editedPreset.id}</h1>
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">ID: {editedPreset.id}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => selectPreset(presets.find(p => p.id === selectedPresetId))}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold transition shadow-lg shadow-emerald-500/20"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </header>

                {/* CONTENT GRID */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">

                        {/* LEFT COLUMN: Controls */}
                        <div className="col-span-12 lg:col-span-7 space-y-6">

                            {/* 1. PASSIVE STYLE (General) */}
                            <section className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
                                <div className="flex items-center gap-2 mb-4 text-slate-300 border-b border-white/5 pb-2">
                                    <Type size={18} />
                                    <h3 className="font-semibold">Passive / General Style</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Font Family</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editedPreset.font}
                                                onChange={(e) => handleChange('font', e.target.value)}
                                                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                            />
                                            <button
                                                onClick={() => setShowFontModal(true)}
                                                className="px-3 bg-slate-800 border border-white/10 rounded text-xs text-slate-200 hover:border-emerald-400/60 transition"
                                            >
                                                Liste
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Font Size (px)</label>
                                        <input
                                            type="number"
                                            value={editedPreset.font_size}
                                            onChange={(e) => handleChange('font_size', parseInt(e.target.value))}
                                            className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                        />
                                    </div>

                                    {/* Color Pickers */}
                                    <div className="col-span-2 grid grid-cols-3 gap-4 mt-2">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Text Color</label>
                                            <div className="flex gap-2 items-center bg-slate-800 p-1 rounded border border-white/10">
                                                <input
                                                    type="color"
                                                    value={assToHex(editedPreset.primary_color)}
                                                    onChange={(e) => handleColorChange('primary_color', hexToASS(e.target.value))}
                                                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                                />
                                                <span className="text-xs font-mono opacity-50">{assToHex(editedPreset.primary_color)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Outline Color</label>
                                            <div className="flex gap-2 items-center bg-slate-800 p-1 rounded border border-white/10">
                                                <input
                                                    type="color"
                                                    value={assToHex(editedPreset.outline_color)}
                                                    onChange={(e) => handleColorChange('outline_color', hexToASS(e.target.value))}
                                                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                                />
                                                <span className="text-xs font-mono opacity-50">{assToHex(editedPreset.outline_color)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Shadow Color</label>
                                            <div className="flex gap-2 items-center bg-slate-800 p-1 rounded border border-white/10">
                                                <input
                                                    type="color"
                                                    value={assToHex(editedPreset.shadow_color || '&H00000000')}
                                                    onChange={(e) => handleColorChange('shadow_color', hexToASS(e.target.value))}
                                                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                                />
                                                <span className="text-xs font-mono opacity-50">{assToHex(editedPreset.shadow_color)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex flex-wrap gap-2 mt-3">
                                        {colorPalettes.map((p) => (
                                            <button
                                                key={p.name}
                                                onClick={() => applyPalette(p)}
                                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 text-[11px] bg-slate-800/80 hover:border-emerald-400/50 transition"
                                            >
                                                <span className="w-4 h-4 rounded-full" style={{ background: p.primary }} />
                                                <span className="w-4 h-4 rounded-full border" style={{ background: p.outline }} />
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* 2. ACTIVE STYLE (Highlight) */}
                            <section className="bg-[#1e293b] rounded-xl border border-emerald-500/30 p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Zap size={100} />
                                </div>
                                <div className="flex items-center gap-2 mb-4 text-emerald-400 border-b border-emerald-500/20 pb-2">
                                    <Zap size={18} />
                                    <h3 className="font-semibold">Active / Highlight Style</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Active Text Color</label>
                                        <div className="flex gap-2 items-center bg-slate-800 p-1 rounded border border-white/10">
                                            <input
                                                type="color"
                                                value={assToHex(editedPreset.secondary_color)}
                                                onChange={(e) => handleColorChange('secondary_color', hexToASS(e.target.value))}
                                                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                            />
                                            <span className="text-xs font-mono opacity-50">{assToHex(editedPreset.secondary_color)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Active Background (Box)</label>
                                        <div className="flex gap-2 items-center bg-slate-800 p-1 rounded border border-white/10">
                                            <input
                                                type="color"
                                                value={assToHex(editedPreset.active_bg_color || '&H00000000')}
                                                onChange={(e) => handleColorChange('active_bg_color', hexToASS(e.target.value))}
                                                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                            />
                                            <span className="text-xs font-mono opacity-50">{assToHex(editedPreset.active_bg_color || '&H00000000')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Scale Multiplier (%)</label>
                                        <input
                                            type="number"
                                            value={editedPreset.active_scale || 110}
                                            onChange={(e) => handleChange('active_scale', parseInt(e.target.value))}
                                            className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-500">100 = Normal, 120 = 20% Larger</span>
                                    </div>
                                </div>
                            </section>

                            {/* 3. LAYOUT & POSITION */}
                            <section className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
                                <div className="flex items-center gap-2 mb-4 text-slate-300 border-b border-white/5 pb-2">
                                    <Layout size={18} />
                                    <h3 className="font-semibold">Konum</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {alignmentPresets.map((pos) => (
                                        <button
                                            key={pos.key}
                                            onClick={() => handlePositionSelect(pos)}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all ${editedPreset.alignment === pos.alignment
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-inner shadow-emerald-500/20'
                                                    : 'bg-slate-800 border-white/10 text-slate-300 hover:border-emerald-400/40 hover:text-white'
                                                }`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-3">
                                    Margin {editedPreset.margin_v || 0}px olarak otomatik ayarlandi; detay ayar gerekmiyorsa bu bolum sade kaldi.
                                </p>
                            </section>

                            {/* 4. IMPORT FROM AAS */}
                            <section className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="w-full py-3 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:bg-white/5 hover:border-emerald-500 hover:text-emerald-400 transition flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Import Style from AAS Catalog
                                </button>
                            </section>

                        </div>

                        {/* RIGHT COLUMN: Preview */}
                        <div className="col-span-12 lg:col-span-5">
                            <div className="sticky top-6">
                                <div className="bg-[#1e293b] rounded-xl border border-white/10 p-1 shadow-2xl">
                                    {/* Preview Controls */}
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setPreviewBackground('gradient')}
                                                className={`w-6 h-6 rounded-full border border-white/20 ${previewBackground === 'gradient' ? 'ring-2 ring-emerald-500' : ''}`}
                                                style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e)' }}
                                                title="Gradient"
                                            />
                                            <button
                                                onClick={() => setPreviewBackground('black')}
                                                className={`w-6 h-6 rounded-full bg-black border border-white/20 ${previewBackground === 'black' ? 'ring-2 ring-emerald-500' : ''}`}
                                                title="Black"
                                            />
                                            <button
                                                onClick={() => setPreviewBackground('white')}
                                                className={`w-6 h-6 rounded-full bg-white border border-white/20 ${previewBackground === 'white' ? 'ring-2 ring-emerald-500' : ''}`}
                                                title="White"
                                            />
                                            <button
                                                onClick={() => setPreviewBackground('green')}
                                                className={`w-6 h-6 rounded-full bg-[#00ff00] border border-white/20 ${previewBackground === 'green' ? 'ring-2 ring-emerald-500' : ''}`}
                                                title="Green Screen"
                                            />
                                            <button
                                                onClick={() => setPreviewBackground('image')}
                                                className={`w-6 h-6 rounded-full bg-slate-500 border border-white/20 flex items-center justify-center ${previewBackground === 'image' ? 'ring-2 ring-emerald-500' : ''}`}
                                                title="Image"
                                            >
                                                <ImageIcon size={12} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px]">
                                            <span className="text-slate-400">Ornek</span>
                                            <div className="bg-slate-800 border border-white/10 rounded-full p-1 flex gap-1">
                                                {["word", "group"].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setPreviewMode(mode)}
                                                        className={`px-2 py-1 rounded-full text-xs transition ${previewMode === mode
                                                                ? "bg-emerald-500 text-white shadow-emerald-500/30 shadow"
                                                                : "text-slate-300 hover:text-white"
                                                            }`}
                                                    >
                                                        {mode === "word" ? "Kelime" : "Grup"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCapture}
                                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                                            title="Take Screenshot"
                                        >
                                            <Camera size={16} />
                                        </button>
                                    </div>

                                    <div
                                        className="w-full bg-black rounded-lg overflow-hidden relative border border-white/10"
                                        style={{ aspectRatio: "9 / 16", minHeight: "520px", maxHeight: "78vh" }}
                                    >
                                        <LivePreview style={editedPreset} background={previewBackground} mode={previewMode} />
                                    </div>
                                    <div className="p-3 text-center">
                                        <p className="text-xs text-slate-500">
                                            * 9:16 telefona yakin oranda aktif/pasif renkleri gosterir. Animasyon mantigi secilen preset tarafindan belirlenecek.
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowFontModal(true)}
                                        className="p-4 bg-[#1e293b] hover:bg-slate-800 border border-white/10 rounded-xl flex flex-col items-center gap-2 transition group"
                                    >
                                        <MousePointer2 className="text-emerald-400 group-hover:scale-110 transition" />
                                        <span className="text-sm font-medium">Font Sec</span>
                                    </button>
                                    <button
                                        onClick={() => setShowPaletteModal(true)}
                                        className="p-4 bg-[#1e293b] hover:bg-slate-800 border border-white/10 rounded-xl flex flex-col items-center gap-2 transition group"
                                    >
                                        <Palette className="text-purple-400 group-hover:scale-110 transition" />
                                        <span className="text-sm font-medium">Renk Paleti</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* IMPORT MODAL */}
                <AnimatePresence>
                    {showImportModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowImportModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                className="bg-[#1e293b] w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="text-emerald-400" />
                                        <h3 className="text-xl font-bold">AAS Stil Iceri Aktar</h3>
                                    </div>
                                    <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">Kapat</button>
                                </div>
                                <div className="p-6 overflow-hidden flex-1 grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-5 bg-slate-900/60 border border-white/5 rounded-xl p-3 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ListFilter size={16} className="text-slate-300" />
                                            <span className="text-sm text-slate-200">AAS Dosyalari</span>
                                        </div>
                                        <div className="relative mb-3">
                                            <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-500" />
                                            <input
                                                value={aasSearch}
                                                onChange={(e) => setAasSearch(e.target.value)}
                                                placeholder="Ara..."
                                                className="w-full bg-slate-800/80 rounded-lg pl-8 pr-3 py-2 text-sm border border-white/10 focus:border-emerald-400/50 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                                            {filteredAas.map((file) => (
                                                <button
                                                    key={file.path}
                                                    onClick={() => setSelectedAasPath(file.path)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg border transition text-sm ${selectedAasPath === file.path
                                                            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                                                            : "border-white/5 bg-white/5 hover:border-emerald-400/40 text-slate-200"
                                                        }`}
                                                >
                                                    <div className="font-medium">{file.name}</div>
                                                    <div className="text-[11px] text-slate-400 break-all">{file.path}</div>
                                                </button>
                                            ))}
                                            {!filteredAas.length && (
                                                <div className="text-slate-400 text-sm">Dosya bulunamadi.</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-7 flex flex-col gap-3">
                                        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm text-slate-200">Secilen stili mevcut presete uygula.</p>
                                                    <p className="text-xs text-slate-400">Renk ve fontlar direk kopyalanir; Kaydet ile kalici olur.</p>
                                                </div>
                                                <button
                                                    onClick={handleImportStyle}
                                                    disabled={importingStyle || !selectedAasPath}
                                                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {importingStyle ? "Aktariliyor..." : "Stili uygula"}
                                                </button>
                                            </div>
                                            {importError && (
                                                <div className="text-xs px-3 py-2 rounded-md border border-white/10 bg-white/5 text-emerald-200">
                                                    {importError}
                                                </div>
                                            )}
                                            <div className="flex-1 min-h-[160px] bg-slate-950/50 border border-white/5 rounded-lg p-3 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                                                {aasCatalog || "Catalog yukleniyor..."}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-slate-400 bg-slate-900/50 border border-white/10 rounded-lg p-3">
                                            Not: Once listeden bir stil secin, ardından "Stili uygula" ile aktif presete aktarip sag ustten kaydedin.
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FONT MODAL */}
                <AnimatePresence>
                    {showFontModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowFontModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                                className="bg-[#1e293b] w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <MousePointer2 className="text-emerald-400" />
                                        <h3 className="text-lg font-bold">Font Sec</h3>
                                    </div>
                                    <button onClick={() => setShowFontModal(false)} className="text-slate-400 hover:text-white text-sm">Kapat</button>
                                </div>
                                <div className="p-5 flex flex-col gap-4 flex-1 overflow-hidden">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                                        <input
                                            value={fontSearch}
                                            onChange={(e) => setFontSearch(e.target.value)}
                                            placeholder="Font ara..."
                                            className="w-full bg-slate-800/80 rounded-lg pl-9 pr-3 py-2.5 text-sm border border-white/10 focus:border-emerald-400/50 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1">
                                        {(filteredFonts.length ? filteredFonts : ["Poppins", "Inter", "Montserrat"]).map((font) => (
                                            <button
                                                key={font}
                                                onClick={() => handleFontPick(font)}
                                                className={`w-full text-left p-3 rounded-lg border transition ${editedPreset.font === font
                                                        ? "border-emerald-400/70 bg-emerald-500/10"
                                                        : "border-white/10 bg-slate-900/50 hover:border-emerald-400/40"
                                                    }`}
                                            >
                                                <div className="text-[11px] text-slate-400 mb-1"> {font}</div>
                                                <div style={{ fontFamily: resolveFontStack(font) }} className="text-lg text-slate-100">
                                                    Aa Bb Cc
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-400">Secenekler backend /api/fonts listesinden gelir; secim aninda onizleme guncellenir.</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PALETTE MODAL */}
                <AnimatePresence>
                    {showPaletteModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowPaletteModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                                className="bg-[#1e293b] w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Palette className="text-purple-400" />
                                        <h3 className="text-lg font-bold">Renk Paletleri</h3>
                                    </div>
                                    <button onClick={() => setShowPaletteModal(false)} className="text-slate-400 hover:text-white text-sm">Kapat</button>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {colorPalettes.map((p) => (
                                        <button
                                            key={p.name}
                                            onClick={() => applyPalette(p)}
                                            className="p-4 rounded-xl border border-white/10 bg-slate-900/60 hover:border-emerald-400/50 text-left transition"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-5 h-5 rounded-full" style={{ background: p.primary }} />
                                                <span className="w-5 h-5 rounded-full border" style={{ background: p.outline }} />
                                                <span className="w-5 h-5 rounded-full border border-slate-700" style={{ background: p.shadow }} />
                                            </div>
                                            <div className="text-sm font-semibold text-slate-100">{p.name}</div>
                                            <div className="text-[11px] text-slate-400">Primary: {p.primary} • Outline: {p.outline}</div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
