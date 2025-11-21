import { motion, AnimatePresence, useDragControls } from "framer-motion";
import clsx from "clsx";

const defaultWordAnim = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  active: { opacity: 1, scale: 1.12, y: -2, filter: "blur(0px)" },
  inactive: { opacity: 0.5, scale: 0.9, y: 6, filter: "blur(0.5px)" },
  exit: { opacity: 0, scale: 0.9, y: 10 },
  transition: { type: "spring", stiffness: 220, damping: 16 },
};

const styleThemes = {
  "neon-glow": {
    className: "text-white drop-shadow-[0_0_12px_rgba(0,255,255,0.8)]",
    active: { color: "#7CFCFF", textShadow: "0 0 16px #00f5ff" },
    passive: { color: "#B0F4FF", filter: "blur(0px)" },
  },
  "gradient-bounce": {
    className:
      "bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-indigo-400",
    active: { scale: 1.12 },
    passive: { opacity: 0.6 },
  },
  "bold-pop": {
    className: "font-black tracking-tight text-amber-200",
    active: { scale: 1.18, rotate: -1 },
    passive: { opacity: 0.45 },
  },
  "tiktok-pulse": {
    className: "text-white drop-shadow-[0_0_20px_rgba(255,0,85,0.7)]",
    active: { scale: 1.15, textShadow: "0 0 20px #ff0055" },
    passive: { opacity: 0.5 },
  },
  "netflix-highlight": {
    className: "text-white bg-black/60 px-3 py-1 rounded-lg",
    active: { scale: 1.08, color: "#e50914" },
    passive: { opacity: 0.5 },
  },
  "fire-text": {
    className:
      "bg-clip-text text-transparent bg-gradient-to-b from-amber-200 via-orange-500 to-red-500 drop-shadow-[0_4px_18px_rgba(255,109,0,0.5)]",
    active: { scale: 1.2 },
    passive: { opacity: 0.55 },
  },
  "particle-fire": {
    className: "text-amber-400 drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]",
    active: { scale: 1.1, textShadow: "0 0 20px #ff4400" },
    passive: { opacity: 0.5 },
  },
  "glitch-chaos": {
    className: "text-cyan-400 drop-shadow-[2px_0_0_#ff0000]",
    active: { x: [0, -2, 2, -1, 0], skewX: [0, 10, -10, 0] },
    passive: { opacity: 0.6 },
  },
  // Imported from original pycaps presets (CSS + animation approximations)
  default: {
    className:
      "text-white font-black drop-shadow-[1px_1px_0px_#000,-1px_1px_0px_#000,2px_2px_3px_rgba(0,0,0,0.7)] px-1",
    active: { scale: 1.05 },
    passive: { opacity: 0.8 },
    wordAnimation: {
      ...defaultWordAnim,
      active: { opacity: 1, scale: 1.05, y: -1 },
      inactive: { opacity: 0.7, scale: 0.95, y: 4 },
    },
    segmentAnimation: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
  },
  classic: {
    className:
      "text-white font-semibold drop-shadow-[1px_1px_0px_#000,-1px_1px_0px_#000,2px_2px_3px_rgba(0,0,0,0.7)] px-1",
    active: { scale: 1.05 },
    passive: { opacity: 0.8 },
  },
  fast: {
    className:
      "text-white font-bold text-[30px] drop-shadow-[0_-2px_0_#000,-2px_0_0_#000,0_3px_0_#000,3px_0_0_#000,3px_3px_0_#000]",
    active: { scale: 1.08 },
    passive: { opacity: 0.75 },
    wordAnimation: {
      initial: { opacity: 0, y: 20, scale: 0.9 },
      active: { opacity: 1, scale: 1.12, y: 0 },
      inactive: { opacity: 0.65, scale: 0.95, y: 4 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.12, ease: "easeOut" }, // punchy, short
    },
  },
  explosive: {
    className:
      "font-black text-[#FFDD00] drop-shadow-[0_0_6px_#FF8800,0_0_9px_#FF4400,1px_1px_0_#000] px-2",
    active: { color: "#FFFFFF", textShadow: "0 0 12px #FF0000" },
    passive: { opacity: 0.75 },
    wordAnimation: {
      initial: { opacity: 0, scale: 0.5 },
      active: { opacity: 1, scale: 1.1 },
      inactive: { opacity: 0.6, scale: 0.9 },
      exit: { opacity: 0, scale: 0.8 },
      transition: { duration: 0.2, type: "spring", stiffness: 320, damping: 20 }, // zoom_in_primitive ~0.2s
    },
    segmentAnimation: {
      initial: { opacity: 0, x: -80 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 80 },
      transition: { duration: 0.4, ease: "easeOut" }, // slide_in_primitive duration 0.4
    },
  },
  hype: {
    className:
      "text-[#DDDDDD] font-black drop-shadow-[-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,3px_3px_5px_rgba(0,0,0,0.5)] px-2",
    active: { color: "#FFFF00" },
    passive: { opacity: 0.7 },
    wordAnimation: {
      initial: { opacity: 0, scale: 0.8 },
      active: { opacity: 1, scale: 1.08 },
      inactive: { opacity: 0.65, scale: 0.92 },
      exit: { opacity: 0, scale: 0.85 },
      transition: { duration: 0.12, ease: "easeOut" }, // zoom_in_primitive 0.12s
    },
    segmentAnimation: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.15 }, // fade in/out 0.15s
    },
  },
  "retro-gaming": {
    className:
      "text-[#E0E0E0] bg-[rgba(20,20,80,0.85)] border border-white font-mono text-base px-2 py-1",
    active: { color: "#FFFF88" },
    passive: { opacity: 0.8 },
    wordAnimation: {
      initial: { opacity: 0, y: 40 },
      active: { opacity: 1, y: 0 },
      inactive: { opacity: 0.7, y: 6 },
      exit: { opacity: 0, y: 30 },
      transition: { duration: 0.3, ease: "easeOut" },
    },
    segmentAnimation: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -40 },
      transition: { duration: 0.3, ease: "easeOut" }, // slide_in_primitive up/down 0.3s
    },
  },
  "neo-minimal": {
    className:
      "text-[#D4D4D4] font-mono bg-[#1E1E1E] px-2 py-1 rounded-sm text-sm",
    active: { color: "#569CD6", backgroundColor: "#252526", fontWeight: 700 },
    passive: { opacity: 0.8, color: "#808080" },
    wordAnimation: {
      initial: { opacity: 0 },
      active: { opacity: 1 },
      inactive: { opacity: 0.6 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    segmentAnimation: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
  },
  vibrant: {
    className:
      "text-white font-black drop-shadow-[-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#FF00FF,-2px_-2px_0_#00FFFF] px-2",
    active: { scale: 1.08 },
    passive: { opacity: 0.6 },
    wordAnimation: {
      initial: { opacity: 0, scale: 0.95 },
      active: { opacity: 1, scale: 1.05 },
      inactive: { opacity: 0.6, scale: 0.93 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 0.15 }, // pop_in_primitive 0.15s
    },
    segmentAnimation: {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }, // fade_out on segment end
    },
  },
  "line-focus": {
    className:
      "text-white font-black uppercase drop-shadow-[-2px_-2px_2px_#000,2px_-2px_2px_#000,-2px_2px_2px_#000,2px_2px_2px_#000] px-1",
    active: { backgroundColor: "blue", color: "#fff", scale: 1.1 },
    passive: { opacity: 0.8 },
    wordAnimation: {
      initial: { opacity: 0, y: 12 },
      active: { opacity: 1, y: 0 },
      inactive: { opacity: 0.7, y: 4 },
      exit: { opacity: 0, y: 12 },
      transition: { duration: 0.2 },
    },
  },
  minimalist: {
    className:
      "text-[rgba(255,255,255,0.7)] bg-[rgba(0,0,0,0.6)] px-2 py-1 rounded-sm text-sm",
    active: { color: "#fff", scale: 1.02 },
    passive: { opacity: 0.8 },
    wordAnimation: {
      initial: { opacity: 0 },
      active: { opacity: 1 },
      inactive: { opacity: 0.7 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },
    segmentAnimation: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },
  },
  "word-focus": {
    className:
      "text-white font-black uppercase drop-shadow-[-2px_-2px_2px_#000,2px_-2px_2px_#000,-2px_2px_2px_#000,2px_2px_2px_#000] px-1",
    active: { backgroundColor: "#f76f00", borderRadius: "5%", color: "#fff" },
    passive: { opacity: 0.8 },
  },
  "retro-arcade": {
    className: "font-['Press_Start_2P'] text-[#00FF00] drop-shadow-[2px_2px_0px_#000000]",
    active: { color: "#00FF00", textShadow: "2px 2px 0px #000000" },
    passive: { opacity: 0.7 },
    wordAnimation: {
      initial: { opacity: 0 },
      active: { opacity: 1 },
      inactive: { opacity: 0.7 },
      exit: { opacity: 0 },
      transition: { duration: 0 }, // Instant change for retro feel
    }
  },
  "horror-creepy": {
    className: "font-['BlackCaps'] text-[#FF0000] drop-shadow-[0_0_5px_#000000]",
    active: { scale: 1.1, textShadow: "0 0 10px #FF0000", x: [0, -2, 2, -1, 0] }, // Shaky
    passive: { opacity: 0.6, filter: "blur(1px)" },
  },
  "luxury-gold": {
    className: "font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#B8860B] drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]",
    active: { scale: 1.05, filter: "brightness(1.2)" },
    passive: { opacity: 0.8 },
  },
  "comic-book": {
    className: "font-['Komika_Axis'] text-white drop-shadow-[2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000] px-2",
    active: { scale: 1.15, rotate: -2, color: "#FFFF00" },
    passive: { opacity: 0.8 },
  },
  "news-ticker": {
    className: "font-mono bg-[#0000AA] text-white px-4 py-1 border-b-2 border-white",
    active: { backgroundColor: "#0000CC" },
    passive: { opacity: 0.9 },
    wordAnimation: {
      initial: { x: 20, opacity: 0 },
      active: { x: 0, opacity: 1 },
      inactive: { opacity: 0.8 },
      exit: { x: -20, opacity: 0 },
      transition: { duration: 0.2 },
    }
  },
};

// Available styles for the UI selector
export const stylePool = [
  { id: "word-pop", label: "Clean Pop" },
  { id: "fire-storm", label: "Fire Storm" },
  { id: "cyber-glitch", label: "Cyber Glitch" },
  { id: "neon-pulse", label: "Neon Pulse" },
  { id: "kinetic-bounce", label: "Kinetic Bounce" },
  { id: "cinematic-blur", label: "Cinematic Blur" },
  { id: "thunder-strike", label: "Thunder Strike" },
  { id: "typewriter-pro", label: "Typewriter Pro" },
  { id: "rainbow-wave", label: "Rainbow Wave" },
  { id: "earthquake-shake", label: "Earthquake" },
  { id: "retro-arcade", label: "Retro Arcade" },
  { id: "horror-creepy", label: "Horror Creepy" },
  { id: "luxury-gold", label: "Luxury Gold" },
  { id: "comic-book", label: "Comic Book" },
  { id: "news-ticker", label: "News Ticker" },
];

function getTheme(id) {
  return styleThemes[id] || styleThemes["default"];
}

export default function SubtitleOverlay({
  words,
  currentTime,
  activeStyle,
  activeIndex,
  containerRef,
  renderText = true, // Default to true for backward compatibility
}) {
  if (!words.length || activeIndex < 0) return null;
  const dragControls = useDragControls();
  const theme = getTheme(activeStyle.id);

  // CRITICAL: Show ONLY the active word (like .ass does)
  // Backend shows one word at a time with karaoke timing
  const activeWord = words[activeIndex];
  if (!activeWord) return null;

  // If renderText is false, we only render the drag container but no text
  // This is used when JSOOverlay is handling the rendering
  if (!renderText) {
    return (
      <motion.div
        className={`absolute inset-0 flex justify-center pointer-events-none ${activeStyle.alignment === 8 ? "items-start pt-6" : "items-end pb-6"}`}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={containerRef}
        whileDrag={{ scale: 1.01, opacity: 0.9 }}
      >

        {/* Invisible placeholder to maintain layout if needed, or just empty */}
        <div className="w-64 h-16 flex items-center justify-center text-xs text-transparent">
        </div>
      </motion.div>
    );
  }

  const baseSize = activeStyle.font_size || 48;
  const dynamicFontSize = baseSize; // No dynamic scaling for exact match

  const wordAnim = theme.wordAnimation || defaultWordAnim;

  // Convert alignment number to flexbox position
  // 2 = bottom-center, 8 = top-center
  const alignmentClass = activeStyle.alignment === 8 ? "items-start pt-6" : "items-end pb-6";

  // Build custom text shadow from style properties
  const buildTextShadow = () => {
    const shadows = [];

    // Outline/stroke effect
    if (activeStyle.border > 0) {
      const outlineColor = activeStyle.outline_color || "#000000";
      const strokeSize = activeStyle.border;
      // Create outline effect with multiple shadows
      for (let i = -strokeSize; i <= strokeSize; i++) {
        for (let j = -strokeSize; j <= strokeSize; j++) {
          if (i !== 0 || j !== 0) {
            shadows.push(`${i}px ${j}px 0 ${outlineColor}`);
          }
        }
      }
    }

    // Drop shadow effect
    if (activeStyle.shadow > 0) {
      const shadowColor = activeStyle.shadow_color || "#000000";
      const shadowX = activeStyle.shadow_x || 0;
      const shadowY = activeStyle.shadow_y || 2;
      const shadowBlur = activeStyle.shadow_blur || 8;
      shadows.push(`${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`);
    }

    return shadows.length > 0 ? shadows.join(", ") : "none";
  };

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 flex justify-center ${alignmentClass}`}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={containerRef}
      whileDrag={{ scale: 1.01, opacity: 0.9 }}
    >

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeIndex}
          className="w-full flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="max-w-full flex justify-center select-none pointer-events-auto overflow-hidden text-center px-2">
            <AnimatePresence mode="wait">
              {activeWord && (
                (() => {
                  // Get theme animation properties
                  const themeAnimProps = theme.active;

                  // Separate animated properties from static styles
                  const { scale, rotate, x, y, textShadow: themeTextShadow, color: themeColor, backgroundColor, ...themeStaticStyles } = themeAnimProps || {};

                  // Build animated properties for Framer Motion
                  // We use 'animate' for the active state since we are only showing the active word
                  const animatedProps = {
                    opacity: 1,
                    filter: "blur(0px)",
                    ...(scale !== undefined && { scale }),
                    ...(rotate !== undefined && { rotate }),
                    ...(x !== undefined && { x }),
                    ...(y !== undefined && { y }),
                  };

                  const initialProps = {
                    opacity: 0,
                    scale: 0.5,
                    y: 10
                  };

                  const exitProps = {
                    opacity: 0,
                    scale: 1.5,
                    filter: "blur(10px)",
                    transition: { duration: 0.1 }
                  };

                  // Build static style object with user settings
                  const staticStyle = {
                    fontSize: `${dynamicFontSize}px`,
                    fontFamily: activeStyle.font || "Inter",
                    fontWeight: activeStyle.bold ? 900 : 600,
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                    ...themeStaticStyles,
                  };

                  // Apply user or theme color
                  const userColor = activeStyle.primary_color || "#ffffff";
                  if (userColor !== "#ffffff" || !themeColor) {
                    staticStyle.color = userColor;
                  } else if (themeColor) {
                    staticStyle.color = themeColor;
                  }

                  // Apply user text shadow (stroke + shadow) or theme shadow
                  const userTextShadow = buildTextShadow();
                  if (userTextShadow !== "none") {
                    staticStyle.textShadow = userTextShadow;
                  } else if (themeTextShadow) {
                    staticStyle.textShadow = themeTextShadow;
                  }

                  // Apply theme background if exists
                  if (backgroundColor) {
                    staticStyle.backgroundColor = backgroundColor;
                  }

                  return (
                    <motion.span
                      key={`${activeWord.start}-${activeWord.text}`}
                      className={clsx(
                        "backdrop-blur-md px-4 py-2 break-words",
                        theme.className
                      )}
                      initial={initialProps}
                      animate={animatedProps}
                      exit={exitProps}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={staticStyle}
                    >
                      {activeWord.text}
                    </motion.span>
                  );
                })()
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
