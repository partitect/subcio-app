import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UploadCloud, PlayCircle, Languages, CheckCircle, Loader2, FileVideo, ArrowRight, Sun, Moon } from "lucide-react";
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
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
} from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";
import { GlassCard, GradientButton, AnimatedContainer, SectionHeader } from "../components/ui";
import { useTheme } from "../ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
const models = ["tiny", "base", "small", "medium", "large-v2", "large-v3", "distil-large-v3", "turbo"];

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("");
  const [model, setModel] = useState<string>("medium");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { mode, toggleTheme, isDark } = useTheme();
  const muiTheme = useMuiTheme();

  const dropLabel = useMemo(() => (file ? file.name : "Drop a video or audio file here"), [file]);

  const handleFile = (incoming?: File) => {
    if (incoming) {
      setFile(incoming);
      setLogs((prev) => [...prev, `Selected file: ${incoming.name}`]);
    }
  };

  const startTranscription = async () => {
    if (!file) return;
    setLoading(true);
    setLogs((prev) => [...prev, "Uploading and transcribing..."]);
    const form = new FormData();
    form.append("file", file);
    form.append("model_name", model);
    if (language) form.append("language", language);

    try {
      const { data } = await axios.post(`${API_BASE}/transcribe`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogs((prev) => [...prev, "Transcription finished, creating project..."]);
      const projectId = data.projectId || data.project?.id;
      navigate(`/editor/${projectId}`, { state: { project: data.project, words: data.words } });
    } catch (err) {
      console.error(err);
      setLogs((prev) => [...prev, "Transcription failed. Check backend logs."]);
      alert("Transcription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        bgcolor: "background.default", 
        color: "text.primary", 
        py: { xs: 4, md: 6 },
        position: "relative",
      }}
    >
      {/* Theme Toggle Button */}
      <Tooltip title={isDark ? "Açık Tema" : "Koyu Tema"} arrow placement="left">
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: alpha(muiTheme.palette.background.paper, 0.8),
            backdropFilter: "blur(8px)",
            border: `1px solid ${alpha(muiTheme.palette.divider, 0.3)}`,
            color: "text.secondary",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: alpha(muiTheme.palette.background.paper, 0.95),
              color: isDark ? "warning.main" : "primary.main",
              transform: "rotate(15deg)",
            },
          }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </IconButton>
      </Tooltip>

      {/* Background Gradient */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: isDark 
            ? "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.08), transparent 50%)"
            : "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.04), transparent 50%)",
          pointerEvents: "none",
        }}
      />
      
      <LoadingOverlay isLoading={loading} />
      
      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <AnimatedContainer delay={0}>
          <SectionHeader
            title="Upload & Transcribe"
            subtitle="Drop your video or audio file to get started"
            icon={<UploadCloud size={20} />}
          />
        </AnimatedContainer>
        
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={8}>
            <AnimatedContainer delay={0.1}>
              <GlassCard sx={{ p: { xs: 2.5, md: 3 }, height: "100%", display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Drop Zone */}
                <Box
                  sx={{
                    p: { xs: 4, md: 5 },
                    textAlign: "center",
                    borderRadius: 3,
                    border: `2px dashed ${file ? muiTheme.palette.success.main : muiTheme.palette.divider}`,
                    bgcolor: file 
                      ? alpha(muiTheme.palette.success.main, 0.05) 
                      : alpha(muiTheme.palette.primary.main, 0.03),
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": { 
                      borderColor: muiTheme.palette.primary.main,
                      bgcolor: alpha(muiTheme.palette.primary.main, 0.06),
                    },
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Stack spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: file 
                          ? alpha(muiTheme.palette.success.main, 0.15) 
                          : alpha(muiTheme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: file ? "success.main" : "primary.main",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {file ? <FileVideo size={28} /> : <UploadCloud size={28} />}
                    </Box>
                    
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        {dropLabel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Supports MP4, MOV, WAV, MP3
                      </Typography>
                    </Box>
                    
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      style={{ display: "none" }}
                      id="file-input"
                      onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
                    />
                    <label htmlFor="file-input">
                      <Button 
                        component="span" 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderRadius: 5,
                          px: 3,
                          fontWeight: 600,
                        }}
                      >
                        Choose file
                      </Button>
                    </label>
                  </Stack>
                </Box>

                {/* Settings Grid */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? "grey.900" : "grey.50",
                        border: `1px solid ${muiTheme.palette.divider}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            bgcolor: alpha(muiTheme.palette.primary.main, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "primary.main",
                          }}
                        >
                          <PlayCircle size={14} />
                        </Box>
                        <Typography fontWeight={600} variant="body2" color="text.primary">
                          Whisper Model
                        </Typography>
                      </Stack>
                      <TextField 
                        select 
                        fullWidth 
                        size="small" 
                        value={model} 
                        onChange={(e) => setModel(e.target.value)}
                      >
                        {models.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? "grey.900" : "grey.50",
                        border: `1px solid ${muiTheme.palette.divider}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            bgcolor: alpha(muiTheme.palette.secondary.main, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "secondary.main",
                          }}
                        >
                          <Languages size={14} />
                        </Box>
                        <Typography fontWeight={600} variant="body2" color="text.primary">
                          Language
                        </Typography>
                      </Stack>
                      <TextField
                        fullWidth
                        size="small"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="auto-detect or en, tr..."
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? "grey.900" : "grey.50",
                        border: `1px solid ${muiTheme.palette.divider}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            bgcolor: loading 
                              ? alpha(muiTheme.palette.warning.main, 0.15) 
                              : alpha(muiTheme.palette.success.main, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: loading ? "warning.main" : "success.main",
                          }}
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        </Box>
                        <Typography fontWeight={600} variant="body2" color="text.primary">
                          Status
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {loading ? "Processing..." : "Ready to transcribe"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {loading && (
                  <Box>
                    <LinearProgress 
                      color="primary" 
                      sx={{ 
                        borderRadius: 5,
                        height: 6,
                      }} 
                    />
                  </Box>
                )}

                <Box
                  mt="auto"
                  display="flex"
                  justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                  width="100%"
                >
                  <GradientButton
                    size="large"
                    disabled={!file || loading}
                    onClick={startTranscription}
                    endIcon={!loading && <ArrowRight size={18} />}
                    sx={{ 
                      width: { xs: "100%", sm: "auto" },
                      minWidth: 200,
                    }}
                  >
                    {loading ? "Working..." : "Start Transcription"}
                  </GradientButton>
                </Box>
              </GlassCard>
            </AnimatedContainer>
          </Grid>

          <Grid item xs={12} md={4}>
            <AnimatedContainer delay={0.2}>
              <GlassCard 
                sx={{ 
                  p: { xs: 2.5, md: 3 }, 
                  height: "100%", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 1.5,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: logs.length > 0 ? "success.main" : "text.disabled",
                      boxShadow: logs.length > 0 ? `0 0 8px ${muiTheme.palette.success.main}` : "none",
                    }}
                  />
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    Progress Log
                  </Typography>
                </Stack>
                
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: "auto", 
                    pr: 1,
                    maxHeight: 320,
                    borderRadius: 2,
                    bgcolor: isDark ? "grey.900" : "grey.50",
                    p: 2,
                  }}
                >
                  <Stack spacing={1.5}>
                    {logs.length === 0 ? (
                      <Typography color="text.disabled" variant="body2" fontStyle="italic" fontWeight={500}>
                        Waiting for upload...
                      </Typography>
                    ) : null}
                    {logs.map((line, idx) => (
                      <Stack 
                        key={idx} 
                        direction="row" 
                        spacing={1} 
                        alignItems="flex-start"
                        sx={{
                          animation: "fadeIn 0.3s ease",
                          "@keyframes fadeIn": {
                            from: { opacity: 0, transform: "translateX(-8px)" },
                            to: { opacity: 1, transform: "translateX(0)" },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            mt: 0.8,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {line}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </GlassCard>
            </AnimatedContainer>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}