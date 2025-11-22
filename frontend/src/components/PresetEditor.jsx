import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Save, RotateCcw, Plus, Layout, Type, Palette, Zap, MousePointer2, Camera, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

const API_BASE = "http://localhost:8000/api";

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

    // Preview States
    const [previewBackground, setPreviewBackground] = useState('gradient'); // gradient, white, black, green, image
    const previewRef = useRef(null);

    // Fetch presets on mount
    useEffect(() => {
        fetchPresets();
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

    const selectPreset = (preset) => {
        setSelectedPresetId(preset.id);
        setEditedPreset(JSON.parse(JSON.stringify(preset))); // Deep copy
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

    // --- PREVIEW COMPONENT ---
    const LivePreview = ({ style, background }) => {
        const containerStyle = {
            fontFamily: style.font || 'Arial',
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
            padding: style.active_bg_color ? '0 10px' : '0',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            display: 'inline-block'
        };

        return (
            <div ref={previewRef} style={containerStyle}>
                {/* Grid lines (only visible on gradient/black for reference) */}
                {(background === 'gradient' || background === 'black') && (
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
                    </div>
                )}

                <span className="opacity-70">Normal</span>
                <span style={activeWordStyle}>ACTIVE</span>
                <span className="opacity-70">Normal</span>
            </div>
        );
    };

    if (!editedPreset) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex">
            {/* SIDEBAR: Preset List */}
            <div className="w-64 bg-[#1e293b] border-r border-white/10 flex flex-col">
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
                                        <input
                                            type="text"
                                            value={editedPreset.font}
                                            onChange={(e) => handleChange('font', e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                        />
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
                                    <h3 className="font-semibold">Layout & Position</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Alignment (Numpad)</label>
                                        <div className="grid grid-cols-3 gap-1 w-24">
                                            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => handleChange('alignment', num)}
                                                    className={`h-8 rounded border ${editedPreset.alignment === num
                                                            ? 'bg-emerald-500 border-emerald-400 text-white'
                                                            : 'bg-slate-800 border-white/10 text-slate-500 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Vertical Margin</label>
                                            <input
                                                type="range" min="0" max="500"
                                                value={editedPreset.margin_v}
                                                onChange={(e) => handleChange('margin_v', parseInt(e.target.value))}
                                                className="w-full accent-emerald-500"
                                            />
                                            <span className="text-xs text-right block">{editedPreset.margin_v}px</span>
                                        </div>
                                    </div>
                                </div>
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
                                        <button
                                            onClick={handleCapture}
                                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                                            title="Take Screenshot"
                                        >
                                            <Camera size={16} />
                                        </button>
                                    </div>

                                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative">
                                        <LivePreview style={editedPreset} background={previewBackground} />
                                    </div>
                                    <div className="p-3 text-center">
                                        <p className="text-xs text-slate-500">
                                            * This preview simulates the Active/Passive style.
                                            Actual animation depends on the selected preset logic.
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <button className="p-4 bg-[#1e293b] hover:bg-slate-800 border border-white/10 rounded-xl flex flex-col items-center gap-2 transition group">
                                        <MousePointer2 className="text-emerald-400 group-hover:scale-110 transition" />
                                        <span className="text-sm font-medium">Select Font</span>
                                    </button>
                                    <button className="p-4 bg-[#1e293b] hover:bg-slate-800 border border-white/10 rounded-xl flex flex-col items-center gap-2 transition group">
                                        <Palette className="text-purple-400 group-hover:scale-110 transition" />
                                        <span className="text-sm font-medium">Color Palette</span>
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
                                className="bg-[#1e293b] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Import from Catalog</h3>
                                    <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">Close</button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                                    {aasCatalog || "Loading catalog..."}
                                </div>
                                <div className="p-4 bg-slate-900/50 border-t border-white/10 text-xs text-slate-500 text-center">
                                    Copy a style block from above and paste it into a new preset manually (Auto-import coming soon)
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
