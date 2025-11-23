import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UploadPage from "./pages/UploadPage";
import EditorPage from "./pages/EditorPage";
import ExportPage from "./pages/ExportPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
      <Route path="/export/:projectId" element={<ExportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
