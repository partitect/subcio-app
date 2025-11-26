/**
 * Features Section Component
 * 
 * Showcases main features with icons and descriptions
 */

import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Wand2,
  Languages,
  Palette,
  Zap,
  Download,
  Cloud,
  Smartphone,
  Shield,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Wand2,
    title: "AI Transcription",
    description:
      "Powered by OpenAI Whisper, get accurate transcriptions in 50+ languages with word-level timing.",
    color: "#8B5CF6",
  },
  {
    icon: Palette,
    title: "50+ Style Presets",
    description:
      "From minimal to cinematic, choose from professionally designed animation presets or create your own.",
    color: "#EC4899",
  },
  {
    icon: Zap,
    title: "Real-time Preview",
    description:
      "See your styled subtitles update instantly as you edit. No waiting for renders.",
    color: "#F59E0B",
  },
  {
    icon: Languages,
    title: "Multi-language",
    description:
      "Support for 50+ languages including RTL languages like Arabic and Hebrew.",
    color: "#10B981",
  },
  {
    icon: Download,
    title: "Multiple Export Formats",
    description:
      "Export as burned-in video, SRT, ASS, or VTT. Perfect for any platform.",
    color: "#3B82F6",
  },
  {
    icon: Cloud,
    title: "Cloud Storage",
    description:
      "Your projects are automatically saved and synced across devices. Never lose your work.",
    color: "#6366F1",
  },
  {
    icon: Smartphone,
    title: "Optimized for Social",
    description:
      "Pre-configured export settings for YouTube, TikTok, Instagram Reels, and more.",
    color: "#EF4444",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your videos are processed securely and automatically deleted after export.",
    color: "#14B8A6",
  },
];

export function FeaturesSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ py: 10, bgcolor: isDark ? "grey.900" : "grey.50" }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack spacing={2} alignItems="center" sx={{ mb: 8, textAlign: "center" }}>
          <Chip
            icon={<Sparkles size={14} />}
            label="Features"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}
          >
            Everything you need to create amazing subtitles
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, fontWeight: 500 }}
          >
            PyCaps combines powerful AI with beautiful design presets to help you
            create professional subtitles in minutes, not hours.
          </Typography>
        </Stack>

        {/* Features Grid */}
        <Grid container spacing={3}>
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: "background.paper",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 20px 40px ${alpha(feature.color, 0.15)}`,
                      borderColor: alpha(feature.color, 0.3),
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(feature.color, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Icon size={24} color={feature.color} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

export default FeaturesSection;
