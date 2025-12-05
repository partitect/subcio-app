import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import UploadPage from "./pages/UploadPage";
import EditorPage from "./pages/EditorPage";
import ExportPage from "./pages/ExportPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Info pages (optional to keep)
// Info pages removed

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Main App Routes - Desktop Mode */}
        {/* Home is Dashboard (Project List) */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route path="/upload" element={<UploadPage />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
        <Route path="/export/:projectId" element={<ExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Info Pages removed */}

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
