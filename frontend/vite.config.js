import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Required headers for FFmpeg.wasm SharedArrayBuffer support
    // Using 'credentialless' instead of 'require-corp' to allow external resources
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  // Optimize deps for FFmpeg.wasm
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          
          // Animation libraries (lottie is large)
          'vendor-animation': ['framer-motion', 'lottie-react'],
          
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          
          // Media/player
          'vendor-media': ['react-player', 'jassub'],
          
          // Utilities
          'vendor-utils': ['axios', 'clsx', 'lucide-react'],
        },
      },
      
      // Suppress lottie-web eval warning (it's a known issue in lottie-web)
      onwarn(warning, warn) {
        // Ignore eval warnings from lottie-web
        if (warning.code === 'EVAL' && warning.id?.includes('lottie-web')) {
          return;
        }
        warn(warning);
      },
    },
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  
  // Suppress eval warning from lottie-web (it's in node_modules)
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
