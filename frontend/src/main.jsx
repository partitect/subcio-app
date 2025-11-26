import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import App from "./App.tsx";
import { ThemeProvider } from "./ThemeContext";
import "./index.css";

// i18n initialization
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
