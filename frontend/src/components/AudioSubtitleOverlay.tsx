import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { WordCue, StyleConfig } from "../types";

interface AudioSubtitleOverlayProps {
  words: WordCue[];
  currentTime: number;
  style: StyleConfig;
}

// Convert ASS color (&HAABBGGRR) to CSS rgba
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

export default function AudioSubtitleOverlay({ words, currentTime, style }: AudioSubtitleOverlayProps) {
  // Find current active word(s) - show up to 3-5 words at a time for better readability
  const visibleWords = useMemo(() => {
    const currentIndex = words.findIndex((w) => currentTime >= w.start && currentTime < w.end);
    if (currentIndex === -1) return [];
    
    // Show current word and maybe next few words
    const groupSize = 3;
    const startIdx = Math.max(0, currentIndex - 1);
    const endIdx = Math.min(words.length, startIdx + groupSize);
    
    return words.slice(startIdx, endIdx).map((w, idx) => ({
      ...w,
      isActive: currentTime >= w.start && currentTime < w.end,
      relativeIndex: idx,
    }));
  }, [words, currentTime]);

  const currentWord = useMemo(
    () => words.find((w) => currentTime >= w.start && currentTime < w.end),
    [words, currentTime]
  );

  // Build text shadow for outline effect
  const textShadow = useMemo(() => {
    const outlineSize = Math.max(style.border || 0, 0);
    const outlineColor = assToCssColor(style.outline_color as string, "#000000");
    const shadowColor = assToCssColor(style.shadow_color as string, "rgba(0,0,0,0.4)");
    const shadowBlur = Math.max(style.shadow_blur || style.blur || 0, 0);
    const shadowOffset = Math.max(style.shadow || 0, 0);

    const outlineShadows =
      outlineSize > 0
        ? [
            `-${outlineSize}px 0 ${outlineColor}`,
            `${outlineSize}px 0 ${outlineColor}`,
            `0 -${outlineSize}px ${outlineColor}`,
            `0 ${outlineSize}px ${outlineColor}`,
            `-${outlineSize}px -${outlineSize}px ${outlineColor}`,
            `${outlineSize}px -${outlineSize}px ${outlineColor}`,
            `-${outlineSize}px ${outlineSize}px ${outlineColor}`,
            `${outlineSize}px ${outlineSize}px ${outlineColor}`,
          ]
        : [];

    const softShadow =
      shadowBlur > 0 || shadowOffset > 0
        ? [`${shadowOffset}px ${shadowOffset}px ${shadowBlur}px ${shadowColor}`]
        : [];

    return [...outlineShadows, ...softShadow].join(", ");
  }, [style.border, style.outline_color, style.shadow_color, style.shadow_blur, style.blur, style.shadow]);

  // Alignment positioning
  const alignmentStyles = useMemo(() => {
    const align = style.alignment || 2;
    const map: Record<number, { justify: string; align: string; textAlign: "left" | "center" | "right" }> = {
      1: { justify: "flex-end", align: "flex-start", textAlign: "left" },
      2: { justify: "flex-end", align: "center", textAlign: "center" },
      3: { justify: "flex-end", align: "flex-end", textAlign: "right" },
      4: { justify: "center", align: "flex-start", textAlign: "left" },
      5: { justify: "center", align: "center", textAlign: "center" },
      6: { justify: "center", align: "flex-end", textAlign: "right" },
      7: { justify: "flex-start", align: "flex-start", textAlign: "left" },
      8: { justify: "flex-start", align: "center", textAlign: "center" },
      9: { justify: "flex-start", align: "flex-end", textAlign: "right" },
    };
    return map[align] || map[2];
  }, [style.alignment]);

  if (!currentWord) return null;

  const fontSize = Math.max(16, Math.min((style.font_size || 56) * 0.6, 72)); // Scale down for preview
  const primaryColor = assToCssColor(style.primary_color as string, "#ffffff");
  const secondaryColor = assToCssColor(style.secondary_color as string, "#00ffff");

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: alignmentStyles.justify,
        alignItems: alignmentStyles.align,
        padding: `${style.margin_v || 40}px ${style.margin_l || 10}px`,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.3em",
          justifyContent: alignmentStyles.textAlign === "center" ? "center" : alignmentStyles.textAlign === "right" ? "flex-end" : "flex-start",
          maxWidth: "90%",
        }}
      >
        {visibleWords.map((word, idx) => (
          <Typography
            key={`${word.start}-${idx}`}
            component="span"
            sx={{
              fontFamily: style.font || "Inter, sans-serif",
              fontSize: `${fontSize}px`,
              fontWeight: style.bold ? 700 : 400,
              fontStyle: style.italic ? "italic" : "normal",
              letterSpacing: `${style.letter_spacing || 0}px`,
              color: word.isActive ? primaryColor : secondaryColor,
              textShadow,
              textAlign: alignmentStyles.textAlign,
              transform: word.isActive ? "scale(1.05)" : "scale(1)",
              opacity: word.isActive ? 1 : 0.7,
              transition: "all 150ms ease-out",
              textDecoration: style.underline ? "underline" : style.strikeout ? "line-through" : "none",
            }}
          >
            {word.text}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
