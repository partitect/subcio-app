import { useEffect, useRef, useState } from "react";
import axios from "axios";
// @ts-ignore
import JASSUB from 'jassub';
import { StyleConfig } from "../types";
import { getAssetPath, getFontUrl } from "../utils/assetPath";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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

interface StylePreviewProps {
    style: StyleConfig;
    text: string;
    fonts: string[];

    className?: string;
}

export default function StylePreview({ style, text, fonts, className }: StylePreviewProps) {
    const [assContent, setAssContent] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const jassubInstanceRef = useRef<any>(null);

    // Use a minimal valid MP4 data URI for the dummy video
    // This is a 1x1 pixel black video, 0.1s duration.
    const DUMMY_VIDEO = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCAtIEguMjY0L01QRHctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTYgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yYWRlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSAOOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9MCB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0wIHdlaWdodHA9MCBrZXlpbnQ9MjUwIGtleWludF9taW49MjUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTI4LjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXFfbW9kZT0xIGFxX3N0cmVuZ3RoPTEuMDAgAAADU21vb3YAAABsbXZoZAAAAABZJ57MWSeezAABAAABAAABAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAGGlvZHMAAAAAEICAgAcAT////3//AAACQXRyYWsAAABcdGtoZAAAAAFZJ57MWSeezAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAACAAABZ21kaWEAAAAgbWRoZAAAAABZJ57MWSeezAABAAAAAQAAAAEAAAAAAC5oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVW1aW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABx1cmwgAAAAAQAAAAAAAAAAAAAAAQAAANBzdGJsAAAAZ3N0c2QAAAAAAAAAAQAAAFdhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAUABAAAAAAABj//AAAAC2F2Y0MBZAAL/+4ADZZMsGDUV/8BbgR5AAADAAEAAAMAMg8BAf/gAA9nZWFyAAAAA2F1cgAAAAEAAAAAc3R0cwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAYc3RszwAAAAAAAAABAAAAqXN0Y28AAAAAAAAAAQAAADAAAABudWR0YQAAAGxtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAAMjAxNi0xMS0wNSAxOToxNTowNA==";

    useEffect(() => {
        const fetchPreview = async () => {
            const words = [{
                start: 0,
                end: 30,
                text: text
            }];

            const form = new FormData();
            form.append("words_json", JSON.stringify(words));
            form.append("style_json", JSON.stringify(style));

            try {
                const res = await axios.post(`${API_BASE}/preview-ass`, form);
                setAssContent(res.data);
            } catch (err) {
                console.error("Preview ASS fetch failed", err);
            }
        };

        const timeout = setTimeout(fetchPreview, 100);
        return () => clearTimeout(timeout);
    }, [style, text]);

    // Handle Canvas Resizing independently of JASSUB
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const { width, height } = entry.contentRect;
            const dpr = window.devicePixelRatio || 1;

            // Always set canvas dimensions
            if (canvasRef.current) {
                canvasRef.current.width = width * dpr;
                canvasRef.current.height = height * dpr;
            }

            // If JASSUB is running, update it too
            if (jassubInstanceRef.current) {
                jassubInstanceRef.current.resize(width * dpr, height * dpr);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Initialize JASSUB when content is ready
    useEffect(() => {
        if (!assContent || !canvasRef.current) return;

        // Create detached video element
        const video = document.createElement("video");
        video.src = DUMMY_VIDEO;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        const defaultFonts = [
            getFontUrl("Bungee-Regular.ttf"),
            getFontUrl("RubikSprayPaint-Regular.ttf"),
            getFontUrl("LuckiestGuy-Regular.ttf"),
            getFontUrl("Grandstander-ExtraBold.ttf"),
            getFontUrl("Nunito-ExtraBold.ttf"),
        ];

        let jassub: any = null;
        try {
            jassub = new JASSUB({
                video: video,
                canvas: canvasRef.current,
                subContent: assContent,
                fonts: fonts || defaultFonts,
                workerUrl: getAssetPath('jassub/jassub-worker.js'),
                wasmUrl: getAssetPath('jassub/jassub-worker.wasm'),
                legacyWasmUrl: getAssetPath('jassub/jassub-worker.wasm.js'),
            });
            jassubInstanceRef.current = jassub;

            // Initial resize to ensure JASSUB matches current canvas
            const dpr = window.devicePixelRatio || 1;
            // Use current canvas dimensions, which would have been set by the resize observer
            jassub.resize(canvasRef.current.width, canvasRef.current.height);
        } catch (e) {
            console.error("JASSUB Init Error:", e);
        }

        // Handle static frame seeking
        const setStaticFrame = () => {
            video.currentTime = 0.05;
            setTimeout(() => video.pause(), 100);
        };
        if (video.readyState >= 2) setStaticFrame();
        else video.addEventListener("loadeddata", setStaticFrame);

        return () => {
            if (jassub) jassub.destroy();
            jassubInstanceRef.current = null;
            video.remove();
        };
    }, [assContent, fonts]);

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
            />
        </div>
    );
}
