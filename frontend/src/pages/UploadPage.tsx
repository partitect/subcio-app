import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UploadCloud, PlayCircle, Languages } from "lucide-react";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";

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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", py: { xs: 5, md: 8 } }}>
      <LoadingOverlay isLoading={loading} />
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
          <Grid item xs={12} md={8}>
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2.5, md: 3 }, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary" letterSpacing="0.2em">
                  Upload
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  Upload & Transcribe
                </Typography>
              </Stack>

              <Paper
                variant="outlined"
                sx={{
                  mt: 1,
                  p: { xs: 3, md: 4 },
                  textAlign: "center",
                  borderStyle: "dashed",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main" },
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Stack spacing={1.5} alignItems="center">
                  <UploadCloud size={32} />
                  <Typography fontWeight={600}>{dropLabel}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    MP4, MOV, WAV, MP3
                  </Typography>
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    style={{ display: "none" }}
                    id="file-input"
                    onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
                  />
                  <label htmlFor="file-input">
                    <Button component="span" variant="outlined" size="small">
                      Choose file
                    </Button>
                  </label>
                </Stack>
              </Paper>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <PlayCircle size={16} />
                      <Typography fontWeight={600} variant="body2">
                        Whisper Model
                      </Typography>
                    </Stack>
                    <TextField select fullWidth size="small" value={model} onChange={(e) => setModel(e.target.value)}>
                      {models.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Languages size={16} />
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
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Box sx={{ width: 10, height: 10, bgcolor: "success.main", borderRadius: "50%" }} />
                      <Typography fontWeight={600} variant="body2">
                        Status
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {loading ? "Processing..." : "Ready"}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {loading && (
                <Box mt={2}>
                  <LinearProgress color="primary" />
                </Box>
              )}

              <Box
                mt="auto"
                display="flex"
                justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                width="100%"
              >
                <Button
                  variant="contained"
                  size="large"
                  disabled={!file || loading}
                  onClick={startTranscription}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {loading ? "Working..." : "Start Transcription"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2.5, md: 3 }, height: "100%", display: "flex", flexDirection: "column", gap: 1 }}
            >
              <Typography variant="h6" fontWeight={700} mb={1}>
                Progress
              </Typography>
              <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
                <Stack spacing={1} fontSize={14} color="text.secondary">
                  {logs.length === 0 ? <Typography color="text.disabled">Waiting for upload...</Typography> : null}
                  {logs.map((line, idx) => (
                    <Typography key={idx} variant="body2">
                      • {line}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

