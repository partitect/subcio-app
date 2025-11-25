import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Container, Grid, Paper, Chip, Typography, Stack, Card, CardContent, CardMedia } from "@mui/material";
import { Play, Upload, Sparkles, Rocket, SlidersHorizontal, ListChecks, Download } from "lucide-react";
import { ProjectMeta } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <Paper variant="outlined" sx={{ p: 2.5, display: "flex", gap: 1.5, alignItems: "flex-start", bgcolor: "background.paper" }}>
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 2,
        bgcolor: "primary.main",
        color: "common.white",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 8px 20px rgba(123,142,244,0.35)",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {desc}
      </Typography>
    </Box>
  </Paper>
);

export default function LandingPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/projects`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load projects", err));
  }, []);

  const resolveAssetUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const apiHost = API_BASE.replace(/\/api$/, "");
    return `${apiHost}${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(123,142,244,0.14), transparent 30%), radial-gradient(circle at 80% 10%, rgba(246,166,178,0.12), transparent 28%), radial-gradient(circle at 70% 80%, rgba(114,197,158,0.1), transparent 25%)",
          filter: "blur(0px)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={2}>
              <Chip label="PyonFX Subtitle Studio" color="primary" variant="outlined" sx={{ alignSelf: "flex-start", fontWeight: 600 }} />
              <Typography
                variant="h2"
                fontWeight={700}
                sx={{ lineHeight: 1.1, fontSize: { xs: "2.1rem", sm: "2.6rem", md: "3rem" } }}
              >
                Style-rich captions with{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  real-time
                </Box>{" "}
                feedback
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
                Upload, transcribe, style, and export without leaving the browser. Saved projects keep your media, transcripts, and presets together.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ width: "100%" }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Upload size={18} />}
                  component={Link}
                  to="/upload"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Play size={18} />}
                  component={Link}
                  to="/editor/demo"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Open Demo
                </Button>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                  <Sparkles size={16} />
                  <Typography variant="body2">All PyonFX presets included</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                backdropFilter: "blur(8px)",
                boxShadow: "0 12px 36px rgba(0,0,0,0.3)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Highlights
              </Typography>
              <Stack spacing={1} color="text.secondary" fontSize={14}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rocket size={16} />
                  <span>Fast preview/export pipeline (PyonFX)</span>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sparkles size={16} />
                  <span>Preset screenshots stored with projects</span>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sparkles size={16} />
                  <span>All effects migrated to new renderer</span>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Why you’ll like it
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Feature icon={<SlidersHorizontal size={18} />} title="Style-first" desc="PyonFX-based effects, live preview, and preset screenshots." />
            </Grid>
            <Grid item xs={12} md={4}>
              <Feature icon={<ListChecks size={18} />} title="Organized projects" desc="Media, transcripts, and style configs persist together." />
            </Grid>
            <Grid item xs={12} md={4}>
              <Feature icon={<Download size={18} />} title="Fast exports" desc="ASS render + ffmpeg burn pipeline kept lean and cached." />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={{ xs: 1, sm: 0 }}
            mb={2}
          >
            <Typography variant="h6" fontWeight={700}>
              Recent Projects
            </Typography>
            <Button
              component={Link}
              to="/upload"
              size="small"
              color="primary"
              sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
            >
              New Project →
            </Button>
          </Stack>
          {projects.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center", color: "text.secondary", borderStyle: "dashed" }}>
              No projects yet. Start by uploading a video.
            </Paper>
          ) : (
            <Grid container spacing={1}>
              {projects.slice(0, 6).map((project) => (
                <Grid item xs={12} sm={4} md={2} key={project.id}>
                  <Card
                    component={Link}
                    to={`/editor/${project.id}`}
                    sx={{
                      textDecoration: "none",
                      bgcolor: "background.paper",
                      border: "none",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
                      "&:hover": { boxShadow: "0 12px 28px rgba(123,142,244,0.2)" },
                    }}
                  >
                    {project.thumb_url ? (
                      <CardMedia
                        component="img"
                        height="120"
                        image={resolveAssetUrl(project.thumb_url)}
                        alt={project.name}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ height: 120, display: "grid", placeItems: "center", color: "text.secondary" }}>No thumbnail</Box>
                    )}
                    <CardContent sx={{ py: 1.5, px: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography fontWeight={600}>{project.name}</Typography>
                        <Chip label={project.id.slice(0, 6)} size="small" color="primary" variant="outlined" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {project.created_at ? new Date(project.created_at).toLocaleString() : "Unknown date"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
}
