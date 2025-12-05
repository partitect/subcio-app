import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import App from "./App.tsx";
import { ThemeProvider } from "./ThemeContext";
import "./index.css";

// i18n initialization
import "./i18n";

// Initialize logging
import { logger } from "./services/logService";
logger.info("🚀 Subcio uygulaması başlatılıyor...");
logger.debug("Environment:", { 
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isElectron: !!(window.electron?.isElectron)
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
