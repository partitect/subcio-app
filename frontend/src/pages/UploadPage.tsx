/**
 * Upload Page - Professional Redesign
 * 
 * Features:
 * - Navbar integration
 * - Professional drop zone with Lottie animations
 * - Supported formats display
 * - Usage limit indicator
 * - Recent uploads list
 * - Step-by-step progress
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
} from "lucide-react";
import { Navbar } from "../components/landing";

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
  { id: "upload", label: "Uploading", icon: UploadCloud },
  { id: "extract", label: "Extracting Audio", icon: Music },
  { id: "transcribe", label: "Transcribing", icon: Mic },
  { id: "process", label: "Processing", icon: Sparkles },
  { id: "complete", label: "Complete", icon: CheckCircle },
];

// Mock recent uploads (would come from API)
const MOCK_RECENT_UPLOADS = [
  { id: "1", name: "interview_final.mp4", date: "2 hours ago", duration: "12:34", status: "completed" },
  { id: "2", name: "podcast_ep45.mp3", date: "Yesterday", duration: "45:20", status: "completed" },
  { id: "3", name: "tutorial_v2.mov", date: "3 days ago", duration: "8:15", status: "completed" },
];

// Mock usage data (would come from API based on user plan)
const MOCK_USAGE = {
  used: 45,
  limit: 100,
  plan: "Pro",
};

export default function UploadPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("");
  const [model, setModel] = useState<string>("medium");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  
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

  const dropLabel = useMemo(() => (
    file ? file.name : "Drop your video or audio file here"
  ), [file]);

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
      alert("Transcription failed. Please try again.");
      setLoading(false);
      setCurrentStep(0);
    }
  };

  const usagePercentage = (MOCK_USAGE.used / MOCK_USAGE.limit) * 100;

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
              Dashboard
            </Button>
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            Upload & Transcribe
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Upload your video or audio file to generate AI-powered subtitles
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
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
                          or click to browse from your computer
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
                      SUPPORTED FORMATS
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
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                    Transcription Settings
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Model Selection */}
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Zap size={16} color={theme.palette.primary.main} />
                          <Typography variant="body2" fontWeight={600}>
                            AI Model
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
                                    <Chip label="Recommended" size="small" color="primary" sx={{ height: 20, fontSize: "0.65rem" }} />
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
                            Language
                          </Typography>
                        </Stack>
                        <TextField
                          fullWidth
                          size="small"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          placeholder="Auto-detect (or: en, tr, es...)"
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
                              {step.label}
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
                      {loading ? "Processing..." : "Start Transcription"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Usage Card */}
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Usage This Month
                    </Typography>
                    <Chip
                      label={MOCK_USAGE.plan}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {MOCK_USAGE.used} / {MOCK_USAGE.limit} minutes
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {Math.round(usagePercentage)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={usagePercentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    />
                  </Box>

                  {usagePercentage >= 80 && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AlertCircle size={16} color={theme.palette.warning.main} />
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                          Running low on minutes. Consider upgrading!
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  <Button
                    component={RouterLink}
                    to="/pricing"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Uploads Card */}
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Recent Uploads
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/dashboard"
                      size="small"
                      endIcon={<ArrowRight size={14} />}
                    >
                      View All
                    </Button>
                  </Stack>

                  <Stack spacing={2}>
                    {MOCK_RECENT_UPLOADS.map((upload, index) => (
                      <Box key={upload.id}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: "primary.main",
                            }}
                          >
                            <FileVideo size={18} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              sx={{ maxWidth: 180 }}
                            >
                              {upload.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Clock size={12} />
                              <Typography variant="caption" color="text.secondary">
                                {upload.duration}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                •
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {upload.date}
                              </Typography>
                            </Stack>
                          </Box>
                          <Chip
                            icon={<CheckCircle size={12} />}
                            label="Done"
                            size="small"
                            color="success"
                            sx={{ height: 24, fontSize: "0.65rem" }}
                          />
                        </Stack>
                        {index < MOCK_RECENT_UPLOADS.length - 1 && (
                          <Divider sx={{ mt: 2 }} />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Sparkles size={18} color={theme.palette.primary.main} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Pro Tips
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      • Use "Medium" model for best balance of speed & accuracy
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Clear audio without background music works best
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Set language manually for faster processing
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
