import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography, alpha } from "@mui/material";
import { designTokens } from "../theme";

const { colors, radii } = designTokens;

interface LoadingOverlayProps {
  isLoading: boolean;
}

const MESSAGES = [
  "Sihir yapılıyor... ✨",
  "Pikseller dans ediyor... 💃",
  "Yapay zeka düşünüyor... 🧠",
  "Kahve molası verilebilir... ☕",
  "Videoların efendisi hazırlanıyor... 🎬",
  "Neredeyse bitti... 🚀",
];

export default function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [animationData, setAnimationData] = useState<unknown>(null);

  // Fetch animation data
  useEffect(() => {
    const fetchLottie = async () => {
      try {
        const response = await fetch("/Sandy Loading.json");
        if (!response.ok) throw new Error("Failed to load lottie");
        const data = await response.json();
        setAnimationData(data);
      } catch (e) {
        console.error("Lottie load failed", e);
      }
    };

    fetchLottie();
  }, []);

  // Cycle messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(colors.bg.default, 0.85),
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Glow Background */}
          <Box
            sx={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: colors.gradients.mesh,
              filter: "blur(80px)",
              opacity: 0.4,
            }}
          />

          {/* Lottie Container */}
          <Box
            sx={{
              width: { xs: 256, md: 384 },
              height: { xs: 256, md: 384 },
              position: "relative",
              zIndex: 1,
            }}
          >
            {animationData ? (
              <Lottie animationData={animationData} loop={true} />
            ) : (
              // Fallback loader
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: `4px solid ${colors.brand.accent}`,
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Message */}
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ position: "relative", zIndex: 1 }}
          >
            <Typography
              variant="h5"
              sx={{
                mt: 3,
                fontWeight: 700,
                background: colors.gradients.accent,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textAlign: "center",
              }}
            >
              {MESSAGES[messageIndex]}
            </Typography>
          </motion.div>

          {/* Progress Bar */}
          <Box
            sx={{
              mt: 4,
              width: { xs: 200, md: 280 },
              height: 4,
              borderRadius: radii.full,
              bgcolor: alpha(colors.brand.primary, 0.2),
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                width: "40%",
                height: "100%",
                borderRadius: radii.full,
                background: colors.gradients.primary,
                animation: "progress 1.5s ease-in-out infinite",
                "@keyframes progress": {
                  "0%": { transform: "translateX(-100%)" },
                  "100%": { transform: "translateX(350%)" },
                },
              }}
            />
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
