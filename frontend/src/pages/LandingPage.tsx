import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Box, 
  Button, 
  Container,
  Grid, 
  Typography, 
  Stack, 
  Card, 
  CardContent, 
  CardMedia,
  Chip,
  alpha,
} from "@mui/material";
import { 
  Play, 
  Upload, 
  Sparkles, 
  Rocket, 
  SlidersHorizontal, 
  ListChecks, 
  Download,
  Zap,
  Palette,
  Film,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { ProjectMeta } from "../types";
import { 
  GlassCard, 
  GradientButton, 
  SectionHeader, 
  FeatureCard,
  AnimatedContainer,
  EmptyState,
  GradientText,
} from "../components/ui";
import { designTokens } from "../theme";

const { colors, radii } = designTokens;

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

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
            <GlassCard
              glowEffect
              sx={{
                p: 3,
                borderRadius: radii.lg,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Highlights
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: "text.secondary" }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: radii.sm, 
                    bgcolor: alpha(colors.brand.primary, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.brand.primaryLight,
                  }}>
                    <Rocket size={16} />
                  </Box>
                  <Typography variant="body2">Fast preview/export pipeline (PyonFX)</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: "text.secondary" }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: radii.sm, 
                    bgcolor: alpha(colors.brand.primary, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.brand.primaryLight,
                  }}>
                    <Palette size={16} />
                  </Box>
                  <Typography variant="body2">Preset screenshots stored with projects</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: "text.secondary" }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: radii.sm, 
                    bgcolor: alpha(colors.brand.primary, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.brand.primaryLight,
                  }}>
                    <Zap size={16} />
                  </Box>
                  <Typography variant="body2">All effects migrated to new renderer</Typography>
                </Stack>
              </Stack>
            </GlassCard>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <SectionHeader
            title="Why you'll like it"
            subtitle="Modern subtitle editing experience"
            icon={<Sparkles size={18} />}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FeatureCard icon={<SlidersHorizontal size={22} />} title="Style-first" description="PyonFX-based effects, live preview, and preset screenshots." gradient />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard icon={<ListChecks size={22} />} title="Organized projects" description="Media, transcripts, and style configs persist together." />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard icon={<Download size={22} />} title="Fast exports" description="ASS render + ffmpeg burn pipeline kept lean and cached." />
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
            <GlassCard sx={{ py: 5, textAlign: "center" }}>
              <EmptyState
                icon={<FolderOpen size={36} />}
                title="No projects yet"
                description="Start by uploading a video to create your first project."
                action={
                  <Button
                    component={Link}
                    to="/upload"
                    variant="contained"
                    startIcon={<Upload size={18} />}
                    sx={{
                      background: colors.gradients.primary,
                      "&:hover": { 
                        background: `linear-gradient(135deg, ${colors.brand.primaryDark} 0%, ${colors.brand.primary} 100%)`,
                      },
                    }}
                  >
                    Upload Video
                  </Button>
                }
              />
            </GlassCard>
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
