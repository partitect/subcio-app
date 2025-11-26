/**
 * CTA Section Component
 * 
 * Final call-to-action before footer
 */

import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ py: 12 }}>
      <Container maxWidth="md">
        <Box
          sx={{
            position: "relative",
            borderRadius: 4,
            overflow: "hidden",
            p: { xs: 4, md: 6 },
            textAlign: "center",
            background: isDark 
              ? `linear-gradient(135deg, 
                  #1a1a2e 0%, 
                  #16213e 50%,
                  #0f0f23 100%
                )`
              : `linear-gradient(135deg, 
                  #1e1e2f 0%, 
                  #2d1f3d 50%,
                  #1a1a2e 100%
                )`,
            boxShadow: isDark 
              ? "0 30px 60px rgba(0, 0, 0, 0.5)"
              : "0 30px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.1,
              backgroundImage: `
                radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                radial-gradient(circle at 40% 40%, white 1px, transparent 1px),
                radial-gradient(circle at 60% 60%, white 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          <Stack spacing={3} sx={{ position: "relative" }}>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Sparkles size={24} color="white" />
            </Stack>

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                color: "white",
                fontSize: { xs: "1.75rem", md: "2.5rem" },
              }}
            >
              Ready to create amazing subtitles?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: alpha("#fff", 0.9),
                maxWidth: 500,
                mx: "auto",
                fontWeight: 500,
              }}
            >
              Start your free trial today. No credit card required. Cancel anytime.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
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
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: "white",
                  border: "none",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Start Free Trial
              </Button>
              <Button
                component={Link}
                to="/pricing"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.75,
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: "1rem",
                  borderColor: alpha("#fff", 0.5),
                  color: "white",
                  borderWidth: 2,
                  "&:hover": {
                    borderColor: "white",
                    borderWidth: 2,
                    bgcolor: alpha("#fff", 0.1),
                  },
                }}
              >
                View Pricing
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default CTASection;
