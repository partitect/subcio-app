import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UploadCloud, PlayCircle, Languages, CheckCircle, Loader2, FileVideo, ArrowRight } from "lucide-react";
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
} from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";
import { GlassCard, GradientButton, AnimatedContainer, SectionHeader } from "../components/ui";
import { designTokens } from "../theme";

const { colors, radii } = designTokens;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
const models = ["tiny", "base", "small", "medium", "large-v2", "large-v3", "distil-large-v3", "turbo"];

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("");
  const [model, setModel] = useState<string>("medium");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

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
      {/* Background Gradient */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: colors.gradients.hero,
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
                    borderRadius: radii.lg,
                    border: `2px dashed ${file ? colors.status.success : colors.border.light}`,
                    bgcolor: file 
                      ? alpha(colors.status.success, 0.05) 
                      : alpha(colors.brand.primary, 0.03),
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": { 
                      borderColor: colors.brand.primary,
                      bgcolor: alpha(colors.brand.primary, 0.06),
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
                          ? alpha(colors.status.success, 0.15) 
                          : alpha(colors.brand.primary, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: file ? colors.status.success : colors.brand.primary,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {file ? <FileVideo size={28} /> : <UploadCloud size={28} />}
                    </Box>
                    
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {dropLabel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
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
                          borderRadius: radii.full,
                          px: 3,
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
                        borderRadius: radii.md,
                        bgcolor: colors.bg.elevated,
                        border: `1px solid ${colors.border.default}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: radii.sm,
                            bgcolor: alpha(colors.brand.primary, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.brand.primaryLight,
                          }}
                        >
                          <PlayCircle size={14} />
                        </Box>
                        <Typography fontWeight={600} variant="body2">
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
                        borderRadius: radii.md,
                        bgcolor: colors.bg.elevated,
                        border: `1px solid ${colors.border.default}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: radii.sm,
                            bgcolor: alpha(colors.brand.secondary, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.brand.secondaryLight,
                          }}
                        >
                          <Languages size={14} />
                        </Box>
                        <Typography fontWeight={600} variant="body2">
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
                        borderRadius: radii.md,
                        bgcolor: colors.bg.elevated,
                        border: `1px solid ${colors.border.default}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: radii.sm,
                            bgcolor: loading 
                              ? alpha(colors.status.warning, 0.15) 
                              : alpha(colors.status.success, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: loading ? colors.status.warning : colors.status.success,
                          }}
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        </Box>
                        <Typography fontWeight={600} variant="body2">
                          Status
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
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
                        borderRadius: radii.full,
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
                      bgcolor: logs.length > 0 ? colors.status.success : colors.text.disabled,
                      boxShadow: logs.length > 0 ? `0 0 8px ${colors.status.success}` : "none",
                    }}
                  />
                  <Typography variant="h6" fontWeight={700}>
                    Progress Log
                  </Typography>
                </Stack>
                
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: "auto", 
                    pr: 1,
                    maxHeight: 320,
                    borderRadius: radii.md,
                    bgcolor: colors.bg.elevated,
                    p: 2,
                  }}
                >
                  <Stack spacing={1.5}>
                    {logs.length === 0 ? (
                      <Typography color="text.disabled" variant="body2" fontStyle="italic">
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
                            bgcolor: colors.brand.primary,
                            mt: 0.8,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
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