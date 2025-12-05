import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    // Custom middleware to add CORS headers for font and WASM files
    {
      name: 'cors-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Add CORS headers for all responses
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');

          // Ensure Cross-Origin-Resource-Policy is set for all resources
          // This is required when COEP is credentialless/require-corp
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

          next();
        });
      },
    },
  ],
  // Use relative paths for Electron compatibility
  base: './',
  server: {
    port: 5173,
    // Permissive CORS for development (needed for Electron)
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  // Ensure WASM files are served correctly
  assetsInclude: ['**/*.wasm'],
  // Optimize deps - exclude libraries that have WASM workers
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', 'jassub'],
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
