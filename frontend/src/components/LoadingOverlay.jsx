import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";

// Public Lottie URL for a magical loader (Rocket/Magic theme)
// Using a reliable CDN link for a high-quality animation

const MESSAGES = [
    "Sihir yapılıyor... ✨",
    "Pikseller dans ediyor... 💃",
    "Yapay zeka düşünüyor... 🧠",
    "Kahve molası verilebilir... ☕",
    "Videoların efendisi hazırlanıyor... 🎬",
    "Neredeyse bitti... 🚀",
];

export default function LoadingOverlay({ isLoading }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [animationData, setAnimationData] = useState(null);

    // Fetch animation data
    useEffect(() => {
        const fetchLottie = async () => {
            try {
                // Using a reliable public Lottie URL (Rocket/Space theme)
                const response = await fetch("https://assets9.lottiefiles.com/packages/lf20_x62chJ.json");
                if (!response.ok) throw new Error("Failed to load lottie");
                const data = await response.json();
                setAnimationData(data);
            } catch (e) {
                console.error("Lottie load failed", e);
                // If fetch fails, we'll just fall back to the spinner in the render method
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
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md"
                >
                    <div className="w-64 h-64 md:w-96 md:h-96">
                        {animationData ? (
                            <Lottie animationData={animationData} loop={true} />
                        ) : (
                            // Fallback loader if Lottie fails or loading
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    <motion.p
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400"
                    >
                        {MESSAGES[messageIndex]}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
