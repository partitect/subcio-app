import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { Download, ArrowLeft, Plus, Video, CheckCircle2, Sparkles } from "lucide-react";
import { Box, Button, Container, Stack, Typography, alpha, Chip } from "@mui/material";
import { GlassCard, GradientButton, AnimatedContainer, SectionHeader } from "../components/ui";
import { designTokens } from "../theme";

const { colors, radii } = designTokens;

export default function ExportPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoUrl = useMemo(() => (location.state as any)?.videoUrl as string | undefined, [location.state]);

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        bgcolor: "background.default", 
        color: "text.primary", 
        display: "flex", 
        alignItems: "center", 
        py: { xs: 4, md: 8 },
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
      
      <Container maxWidth="md" sx={{ position: "relative" }}>
        <AnimatedContainer delay={0}>
          <GlassCard 
            glowEffect
            sx={{ 
              p: { xs: 3, md: 5 }, 
              borderRadius: radii.xl,
              textAlign: "center",
            }}
          >
            {/* Success Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: colors.gradients.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: `0 0 40px ${alpha(colors.brand.accent, 0.3)}`,
              }}
            >
              <CheckCircle2 size={40} color="#fff" />
            </Box>
            
            <Chip 
              label="Export Ready" 
              color="success" 
              size="small"
              sx={{ 
                mb: 2,
                fontWeight: 600,
                borderRadius: radii.full,
              }}
            />
            
            <Typography 
              variant="h3" 
              fontWeight={800} 
              gutterBottom
              sx={{
                background: colors.gradients.primary,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your video is ready!
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ mb: 4, maxWidth: 400, mx: "auto" }}
            >
              Your subtitled video has been rendered and is ready for download.
            </Typography>

            {videoUrl ? (
              <Box
                sx={{
                  position: "relative",
                  borderRadius: radii.lg,
                  overflow: "hidden",
                  border: `1px solid ${colors.border.light}`,
                  mb: 4,
                  boxShadow: colors.shadows.xl,
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: -1,
                    borderRadius: radii.lg,
                    padding: 1,
                    background: colors.gradients.primary,
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    pointerEvents: "none",
                    opacity: 0.5,
                  },
                }}
              >
                <Box
                  component="video"
                  src={videoUrl}
                  controls
                  sx={{
                    width: "100%",
                    display: "block",
                    bgcolor: colors.bg.default,
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  height: 220,
                  borderRadius: radii.lg,
                  border: `2px dashed ${colors.border.light}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  color: "text.secondary",
                  mb: 4,
                  bgcolor: alpha(colors.brand.primary, 0.03),
                }}
              >
                <Video size={40} />
                <Typography>
                  Video preview will appear here
                </Typography>
              </Box>
            )}

            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={2} 
              justifyContent="center"
            >
              {videoUrl && (
                <GradientButton
                  component="a"
                  href={videoUrl}
                  download={`subcio-${projectId || "export"}.mp4`}
                  size="large"
                  startIcon={<Download size={18} />}
                  sx={{ minWidth: 160 }}
                >
                  Download
                </GradientButton>
              )}
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<ArrowLeft size={18} />} 
                onClick={() => navigate(`/editor/${projectId || "latest"}`)}
                sx={{ 
                  minWidth: 160,
                  borderWidth: 2,
                  "&:hover": { borderWidth: 2 },
                }}
              >
                Back to Editor
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<Plus size={18} />} 
                onClick={() => navigate("/upload")}
                sx={{ 
                  minWidth: 160,
                  borderWidth: 2,
                  "&:hover": { borderWidth: 2 },
                }}
              >
                New Project
              </Button>
            </Stack>
            
            {/* Decorative Elements */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${colors.border.default}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <Sparkles size={16} />
              <Typography variant="body2">
                Powered by Subcio Subtitle Studio
              </Typography>
            </Box>
          </GlassCard>
        </AnimatedContainer>
      </Container>
    </Box>
  );
}
