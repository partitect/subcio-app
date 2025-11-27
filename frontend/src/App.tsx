import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import LandingPage from "./pages/LandingPage";
import UploadPage from "./pages/UploadPage";
import EditorPage from "./pages/EditorPage";
import ExportPage from "./pages/ExportPage";
import DashboardPage from "./pages/DashboardPage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminRoute } from "./components/admin";
import {
  AdminOverview,
  AdminUsers,
  AdminProjects,
  AdminSubscriptions,
  AdminAnalytics,
  AdminSettings,
  AdminPresets,
} from "./pages/admin";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* OAuth Callback Routes */}
        <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        } />
        <Route path="/editor/:projectId" element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        } />
        <Route path="/export/:projectId" element={
          <ProtectedRoute>
            <ExportPage />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminOverview />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="/admin/projects" element={
          <AdminRoute>
            <AdminProjects />
          </AdminRoute>
        } />
        <Route path="/admin/subscriptions" element={
          <AdminRoute>
            <AdminSubscriptions />
          </AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute>
            <AdminAnalytics />
          </AdminRoute>
        } />
        <Route path="/admin/settings" element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        } />
        <Route path="/admin/presets" element={
          <AdminRoute>
            <AdminPresets />
          </AdminRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
    </ToastProvider>
  );
}
