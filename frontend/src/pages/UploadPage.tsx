/**
 * Upload Page - Modern Redesign
 * 
 * Features:
 * - Real-time usage stats from API
 * - Recent projects from API
 * - Professional drop zone with Lottie animations
 * - Supported formats display
 * - Step-by-step progress
 */

import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Lottie from "lottie-react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Stack,
  TextField,
  MenuItem,
  LinearProgress,
  alpha,
  Chip,
  Card,
  CardContent,
  Avatar,
  Divider,
  useTheme,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  UploadCloud,
  Languages,
  CheckCircle,
  FileVideo,
  ArrowRight,
  ArrowLeft,
  Music,
  Film,
  Mic,
  Clock,
  Sparkles,
  Zap,
  AlertCircle,
  TrendingUp,
  Calendar,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "../components/landing";
import { getUsageStats, UsageStats } from "../services/authService";
import { ProjectMeta } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

const WHISPER_MODELS = [
  { id: "tiny", name: "Tiny", speed: "Fastest", accuracy: "Basic", recommended: false },
  { id: "base", name: "Base", speed: "Fast", accuracy: "Good", recommended: false },
  { id: "small", name: "Small", speed: "Medium", accuracy: "Better", recommended: false },
  { id: "medium", name: "Medium", speed: "Balanced", accuracy: "Great", recommended: true },
  { id: "large-v2", name: "Large V2", speed: "Slow", accuracy: "Excellent", recommended: false },
  { id: "large-v3", name: "Large V3", speed: "Slow", accuracy: "Best", recommended: false },
  { id: "turbo", name: "Turbo", speed: "Fast", accuracy: "Great", recommended: false },
];

const SUPPORTED_FORMATS = [
  { ext: "MP4", icon: Film, color: "#6366f1" },
  { ext: "MOV", icon: Film, color: "#8b5cf6" },
  { ext: "AVI", icon: Film, color: "#a855f7" },
  { ext: "MKV", icon: Film, color: "#d946ef" },
  { ext: "MP3", icon: Music, color: "#ec4899" },
  { ext: "WAV", icon: Music, color: "#f43f5e" },
  { ext: "M4A", icon: Mic, color: "#f97316" },
];

// Processing steps
const PROCESSING_STEPS = [
  { id: "upload", labelKey: "upload", icon: UploadCloud },
  { id: "extract", labelKey: "transcribe", icon: Music },
  { id: "transcribe", labelKey: "analyze", icon: Mic },
  { id: "process", labelKey: "generate", icon: Sparkles },
  { id: "complete", labelKey: "complete", icon: CheckCircle },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("");
  const [model, setModel] = useState<string>("medium");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  
  // API data state
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectMeta[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Lottie animations
  const [uploadAnimation, setUploadAnimation] = useState<any>(null);
  const [processingAnimation, setProcessingAnimation] = useState<any>(null);
  const [successAnimation, setSuccessAnimation] = useState<any>(null);

  // Load Lottie animations
  useEffect(() => {
    fetch("/lottie/upload-animation.json")
      .then(res => res.json())
      .then(setUploadAnimation)
      .catch(console.error);
    
    fetch("/lottie/processing-dots.json")
      .then(res => res.json())
      .then(setProcessingAnimation)
      .catch(console.error);
    
    fetch("/lottie/success-check.json")
      .then(res => res.json())
      .then(setSuccessAnimation)
      .catch(console.error);
  }, []);

  // Fetch usage stats from API
  const fetchUsageStats = useCallback(async () => {
    setLoadingUsage(true);
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error("Failed to load usage stats", err);
    } finally {
      setLoadingUsage(false);
    }
  }, []);

  // Fetch recent projects from API
  const fetchRecentProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      // Get last 3 projects
      const projects = Array.isArray(data) ? data.slice(0, 3) : [];
      setRecentProjects(projects);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageStats();
    fetchRecentProjects();
  }, [fetchUsageStats, fetchRecentProjects]);

  const dropLabel = useMemo(() => (
    file ? file.name : t('upload.dropzone.title')
  ), [file, t]);

  const fileSize = useMemo(() => {
    if (!file) return null;
    const mb = file.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
  }, [file]);

  const handleFile = (incoming?: File) => {
    if (incoming) {
      setFile(incoming);
    }
  };

  const simulateProgress = () => {
    const steps = [0, 1, 2, 3, 4];
    const delays = [500, 2000, 8000, 2000, 500];
    
    let currentIndex = 0;
    const advanceStep = () => {
      if (currentIndex < steps.length) {
        setCurrentStep(steps[currentIndex]);
        currentIndex++;
        if (currentIndex < steps.length) {
          setTimeout(advanceStep, delays[currentIndex - 1]);
        }
      }
    };
    advanceStep();
  };

  const startTranscription = async () => {
    if (!file) return;
    setLoading(true);
    setCurrentStep(0);
    simulateProgress();
    
    const form = new FormData();
    form.append("file", file);
    form.append("model_name", model);
    if (language) form.append("language", language);

    try {
      const { data } = await axios.post(`${API_BASE}/transcribe`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentStep(4);
      setTimeout(() => {
        const projectId = data.projectId || data.project?.id;
        navigate(`/editor/${projectId}`, { state: { project: data.project, words: data.words } });
      }, 1500);
    } catch (err) {
      console.error(err);
      alert(t('upload.errors.transcriptionFailed'));
      setLoading(false);
      setCurrentStep(0);
    }
  };

  // Calculate usage percentages
  const minutesUsed = usageStats?.usage?.minutes_used ?? 0;
  const minutesLimit = usageStats?.usage?.minutes_limit ?? 100;
  const minutesPercentage = minutesLimit > 0 ? (minutesUsed / minutesLimit) * 100 : 0;

  const exportsUsed = usageStats?.usage?.exports_used ?? 0;
  const exportsLimit = usageStats?.usage?.exports_limit ?? 10;

  // Format project date
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('upload.recentUploads.unknown');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return t('upload.recentUploads.justNow');
    if (diffHours < 24) return t('upload.recentUploads.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('upload.recentUploads.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Navbar />

      {/* Background Effects */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          background: isDark
            ? "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08), transparent 40%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.06), transparent 40%)"
            : "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.04), transparent 40%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.03), transparent 40%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ pt: 12, pb: 6, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              component={RouterLink}
              to="/dashboard"
              startIcon={<ArrowLeft size={18} />}
              sx={{ color: "text.secondary" }}
            >
              {t('upload.backToDashboard')}
            </Button>
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            {t('upload.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            {t('upload.subtitle')}
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Main Upload Area */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Drop Zone Card */}
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                  overflow: "visible",
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  {/* Drop Zone */}
                  <Box
                    sx={{
                      p: { xs: 4, md: 6 },
                      textAlign: "center",
                      borderRadius: 3,
                      border: `2px dashed ${
                        dragOver
                          ? theme.palette.primary.main
                          : file
                          ? theme.palette.success.main
                          : alpha(theme.palette.divider, 0.3)
                      }`,
                      bgcolor: dragOver
                        ? alpha(theme.palette.primary.main, 0.05)
                        : file
                        ? alpha(theme.palette.success.main, 0.03)
                        : "transparent",
                      m: 2,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      },
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <Stack spacing={3} alignItems="center">
                      {/* Lottie Animation */}
                      <Box sx={{ width: 120, height: 120 }}>
                        {loading && processingAnimation ? (
                          <Lottie animationData={processingAnimation} loop />
                        ) : file && successAnimation ? (
                          <Lottie animationData={successAnimation} loop={false} />
                        ) : uploadAnimation ? (
                          <Lottie animationData={uploadAnimation} loop />
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <UploadCloud size={48} color={theme.palette.primary.main} />
                          </Box>
                        )}
                      </Box>

                      <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {dropLabel}
                        </Typography>
                        {file && fileSize && (
                          <Chip
                            label={fileSize}
                            size="small"
                            color="success"
                            sx={{ mb: 1 }}
                          />
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {t('upload.dropzone.hint')}
                        </Typography>
                      </Box>

                      <input
                        type="file"
                        accept="video/*,audio/*"
                        style={{ display: "none" }}
                        id="file-input"
                        onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
                      />
                    </Stack>
                  </Box>

                  {/* Supported Formats */}
                  <Box sx={{ px: 3, pb: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: "block" }}>
                      {t('upload.supportedFormats')}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {SUPPORTED_FORMATS.map((format) => (
                        <Chip
                          key={format.ext}
                          icon={<format.icon size={14} />}
                          label={format.ext}
                          size="small"
                          sx={{
                            bgcolor: alpha(format.color, 0.1),
                            color: format.color,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            "& .MuiChip-icon": { color: format.color },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                    {t('upload.settings.title')}
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Model Selection */}
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Zap size={16} color={theme.palette.primary.main} />
                          <Typography variant="body2" fontWeight={600}>
                            {t('upload.settings.aiModel')}
                          </Typography>
                        </Stack>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        >
                          {WHISPER_MODELS.map((m) => (
                            <MenuItem key={m.id} value={m.id}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                <Typography>{m.name}</Typography>
                                <Stack direction="row" spacing={1}>
                                  {m.recommended && (
                                    <Chip label={t('upload.settings.recommended')} size="small" color="primary" sx={{ height: 20, fontSize: "0.65rem" }} />
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    {m.accuracy}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    </Grid>

                    {/* Language Selection */}
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Languages size={16} color={theme.palette.secondary.main} />
                          <Typography variant="body2" fontWeight={600}>
                            {t('upload.settings.language')}
                          </Typography>
                        </Stack>
                        <TextField
                          fullWidth
                          size="small"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          placeholder={t('upload.settings.languagePlaceholder')}
                        />
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Progress Steps */}
                  {loading && (
                    <Box sx={{ mt: 4 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                        {PROCESSING_STEPS.map((step, index) => (
                          <Stack key={step.id} alignItems="center" spacing={1} sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor:
                                  index < currentStep
                                    ? "success.main"
                                    : index === currentStep
                                    ? "primary.main"
                                    : alpha(theme.palette.divider, 0.2),
                                color:
                                  index <= currentStep ? "white" : "text.disabled",
                                transition: "all 0.3s ease",
                              }}
                            >
                              <step.icon size={18} />
                            </Box>
                            <Typography
                              variant="caption"
                              fontWeight={index === currentStep ? 700 : 500}
                              color={index <= currentStep ? "text.primary" : "text.disabled"}
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              {t(`upload.processing.${step.labelKey}`)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(currentStep / (PROCESSING_STEPS.length - 1)) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      />
                    </Box>
                  )}

                  {/* Action Button */}
                  <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!file || loading}
                      onClick={startTranscription}
                      endIcon={!loading && <ArrowRight size={18} />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                        },
                        "&:disabled": {
                          background: alpha(theme.palette.divider, 0.3),
                        },
                      }}
                    >
                      {loading ? t('upload.buttons.processing') : t('upload.buttons.startTranscription')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Usage Card - Real Data */}
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TrendingUp size={18} color={theme.palette.primary.main} />
                      <Typography variant="subtitle1" fontWeight={700}>
                        {t('upload.usage.title')}
                      </Typography>
                    </Stack>
                    {loadingUsage ? (
                      <Skeleton width={60} height={24} />
                    ) : (
                      <Chip
                        label={usageStats?.plan || 'Free'}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Stack>

                  {loadingUsage ? (
                    <Stack spacing={2}>
                      <Skeleton height={40} />
                      <Skeleton height={8} />
                      <Skeleton height={40} />
                    </Stack>
                  ) : (
                    <>
                      {/* Minutes Usage */}
                      <Box sx={{ mb: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Clock size={14} />
                            <Typography variant="body2" color="text.secondary">
                              {t('upload.usage.minutesLabel')}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {minutesUsed} / {minutesLimit}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(minutesPercentage, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: minutesPercentage >= 90 ? 'error.main' : 
                                       minutesPercentage >= 70 ? 'warning.main' : 'primary.main',
                            }
                          }}
                        />
                      </Box>

                      {/* Exports Usage */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Film size={14} />
                            <Typography variant="body2" color="text.secondary">
                              {t('upload.usage.exportsLabel')}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {exportsUsed} / {exportsLimit}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={exportsLimit > 0 ? Math.min((exportsUsed / exportsLimit) * 100, 100) : 0}
                          color="secondary"
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          }}
                        />
                      </Box>

                      {minutesPercentage >= 80 && (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AlertCircle size={16} color={theme.palette.warning.main} />
                            <Typography variant="caption" color="warning.main" fontWeight={600}>
                              {t('upload.usage.lowWarning')}
                            </Typography>
                          </Stack>
                        </Box>
                      )}
                    </>
                  )}

                  <Button
                    component={RouterLink}
                    to="/pricing"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {t('upload.usage.upgrade')}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Projects Card - Real Data */}
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Calendar size={18} color={theme.palette.secondary.main} />
                      <Typography variant="subtitle1" fontWeight={700}>
                        {t('upload.recentUploads.title')}
                      </Typography>
                    </Stack>
                    <Tooltip title={t('common.refresh')}>
                      <IconButton size="small" onClick={fetchRecentProjects} disabled={loadingProjects}>
                        <RefreshCw size={16} className={loadingProjects ? "animate-spin" : ""} />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {loadingProjects ? (
                    <Stack spacing={2}>
                      {[1, 2, 3].map((i) => (
                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                          <Skeleton variant="circular" width={40} height={40} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton width="80%" height={20} />
                            <Skeleton width="50%" height={16} />
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  ) : recentProjects.length === 0 ? (
                    <Box
                      sx={{
                        py: 4,
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      <FileVideo size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <Typography variant="body2">
                        {t('upload.recentUploads.noProjects')}
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {recentProjects.map((project, index) => (
                        <Box key={project.id}>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            component={RouterLink}
                            to={`/editor/${project.id}`}
                            sx={{
                              textDecoration: "none",
                              color: "inherit",
                              p: 1,
                              mx: -1,
                              borderRadius: 2,
                              transition: "background 0.2s",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                              }}
                            >
                              {project.thumbnail ? (
                                <Box
                                  component="img"
                                  src={project.thumbnail}
                                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <PlayCircle size={18} />
                              )}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                sx={{ maxWidth: 180 }}
                              >
                                {project.name || t('upload.recentUploads.untitled')}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Clock size={12} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDuration(project.duration)}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  •
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(project.createdAt)}
                                </Typography>
                              </Stack>
                            </Box>
                            <Chip
                              icon={<CheckCircle size={12} />}
                              label={t('upload.recentUploads.done')}
                              size="small"
                              color="success"
                              sx={{ height: 24, fontSize: "0.65rem" }}
                            />
                          </Stack>
                          {index < recentProjects.length - 1 && (
                            <Divider sx={{ mt: 2 }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {recentProjects.length > 0 && (
                    <Button
                      component={RouterLink}
                      to="/dashboard"
                      size="small"
                      fullWidth
                      endIcon={<ArrowRight size={14} />}
                      sx={{ mt: 2 }}
                    >
                      {t('upload.recentUploads.viewAll')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card
                sx={{
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Sparkles size={18} color={theme.palette.primary.main} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      {t('upload.tips.title')}
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      • {t('upload.tips.tip1')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {t('upload.tips.tip2')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {t('upload.tips.tip3')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
