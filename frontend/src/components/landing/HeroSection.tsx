/**
 * Hero Section Component
 * 
 * Main hero area with video preview and CTA
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Play, Upload, Sparkles, ArrowRight, Star } from "lucide-react";
import { STATS } from "../../config/pricing";

export function HeroSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        pt: { xs: 8, md: 12 },
        pb: { xs: 10, md: 14 },
      }}
    >
      {/* Background Gradient */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? `
              radial-gradient(ellipse 80% 50% at 50% -20%, ${alpha(theme.palette.primary.main, 0.3)}, transparent),
              radial-gradient(ellipse 60% 40% at 100% 0%, ${alpha(theme.palette.secondary.main, 0.2)}, transparent),
              radial-gradient(ellipse 50% 30% at 0% 100%, ${alpha(theme.palette.info.main, 0.15)}, transparent)
            `
            : `
              radial-gradient(ellipse 80% 50% at 50% -20%, ${alpha(theme.palette.primary.main, 0.15)}, transparent),
              radial-gradient(ellipse 60% 40% at 100% 0%, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)
            `,
          pointerEvents: "none",
        }}
      />

      {/* Grid Pattern */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? `linear-gradient(${alpha("#fff", 0.03)} 1px, transparent 1px),
               linear-gradient(90deg, ${alpha("#fff", 0.03)} 1px, transparent 1px)`
            : `linear-gradient(${alpha("#000", 0.03)} 1px, transparent 1px),
               linear-gradient(90deg, ${alpha("#000", 0.03)} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Badge */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<Sparkles size={14} />}
                  label={t('landing.hero.badge')}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                />
                <Chip
                  icon={<Star size={12} />}
                  label={t('landing.hero.stats.rating')}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: "warning.main",
                    fontWeight: 600,
                  }}
                />
              </Stack>

              {/* Headline */}
              <Typography
                variant="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem", lg: "4rem" },
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {t('landing.hero.title')}{" "}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t('landing.hero.titleHighlight')}
                </Box>{" "}
                {t('landing.hero.titleEnd')}
              </Typography>

              {/* Subheadline */}
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight={500}
                sx={{
                  maxWidth: 480,
                  lineHeight: 1.6,
                  fontSize: { xs: "1rem", md: "1.15rem" },
                }}
              >
                {t('landing.hero.subtitle')}
              </Typography>

              {/* CTA Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ pt: 2 }}
              >
                <Button
                  component={Link}
                  to="/upload"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight size={18} />}
                  sx={{
                    py: 1.75,
                    px: 4,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: "1rem",
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {t('landing.hero.cta')}
                </Button>
                <Button
                  component={Link}
                  to="/editor/demo"
                  variant="outlined"
                  size="large"
                  startIcon={<Play size={18} />}
                  sx={{
                    py: 1.75,
                    px: 4,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </Stack>

              {/* Trust Indicators */}
              <Stack direction="row" spacing={4} sx={{ pt: 3 }}>
                {STATS.slice(0, 3).map((stat, idx) => (
                  <Box key={idx}>
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      color="primary.main"
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Right Content - Video Preview */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: isDark
                  ? `0 40px 80px ${alpha("#000", 0.5)}`
                  : `0 40px 80px ${alpha(theme.palette.primary.main, 0.2)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transform: "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
                transition: "transform 0.5s ease",
                "&:hover": {
                  transform: "perspective(1000px) rotateY(0deg) rotateX(0deg)",
                },
              }}
            >
              {/* Browser Chrome */}
              <Box
                sx={{
                  bgcolor: isDark ? "grey.900" : "grey.100",
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "#ff5f57",
                  }}
                />
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "#ffbd2e",
                  }}
                />
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "#28ca42",
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    ml: 2,
                    bgcolor: isDark ? "grey.800" : "white",
                    borderRadius: 1,
                    px: 2,
                    py: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    app.subcio.io/editor
                  </Typography>
                </Box>
              </Box>

              {/* Preview Image/Video */}
              <Box
                sx={{
                  aspectRatio: "16/10",
                  bgcolor: isDark ? "grey.900" : "grey.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Animated Preview Placeholder */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                      ${alpha(theme.palette.secondary.main, 0.1)} 100%
                    )`,
                  }}
                />

                {/* Fake Editor UI */}
                <Box sx={{ position: "relative", width: "100%", height: "100%", p: 2 }}>
                  {/* Sidebar */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 16,
                      top: 16,
                      bottom: 16,
                      width: 200,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      p: 2,
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Style Presets
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {["Fire Storm", "Neon Glow", "Minimal", "Cinematic"].map((preset, i) => (
                        <Box
                          key={i}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: i === 0 ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                            border: i === 0 ? `1px solid ${theme.palette.primary.main}` : "1px solid transparent",
                          }}
                        >
                          <Typography variant="caption" fontWeight={i === 0 ? 600 : 400}>
                            {preset}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Video Preview Area */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 232,
                      right: 16,
                      top: 16,
                      height: "60%",
                      bgcolor: "#000",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: { xs: "0.9rem", md: "1.25rem" },
                        textShadow: `0 0 20px ${theme.palette.primary.main}, 0 0 40px ${theme.palette.secondary.main}`,
                        animation: "pulse 2s ease-in-out infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 1 },
                          "50%": { opacity: 0.7 },
                        },
                      }}
                    >
                      Your styled subtitles here
                    </Typography>
                  </Box>

                  {/* Timeline */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 232,
                      right: 16,
                      bottom: 16,
                      height: 60,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      p: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 1,
                        position: "relative",
                      }}
                    >
                      {/* Playhead */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: "30%",
                          top: 0,
                          bottom: 0,
                          width: 2,
                          bgcolor: "primary.main",
                          animation: "move 3s linear infinite",
                          "@keyframes move": {
                            "0%": { left: "0%" },
                            "100%": { left: "100%" },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default HeroSection;
