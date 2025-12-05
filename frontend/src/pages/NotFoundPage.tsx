/**
 * 404 Not Found Page
 * 
 * Custom 404 page with navigation options
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
import { Home, ArrowLeft, Search } from "lucide-react";
// Imports removed

export default function NotFoundPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Navbar Removed */}

      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
        }}
      >
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* 404 Number */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "8rem", md: "12rem" },
              fontWeight: 900,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            404
          </Typography>

          {/* Message */}
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>
              Page Not Found
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 480 }}
            >
              Oops! The page you're looking for doesn't exist or has been moved.
              Don't worry, let's get you back on track.
            </Typography>
          </Stack>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ pt: 2 }}
          >
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="large"
              startIcon={<Home size={20} />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Go Home
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outlined"
              size="large"
              startIcon={<ArrowLeft size={20} />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Go Back
            </Button>
          </Stack>

          {/* Helpful Links */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Popular Pages
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ gap: 1 }}
            >
              {[
                { label: "Dashboard", to: "/dashboard" },
                // { label: "Pricing", to: "/pricing" },
                // { label: "Login", to: "/login" },
                // { label: "Contact", to: "/contact" },
              ].map((link) => (
                <Button
                  key={link.label}
                  component={Link}
                  to={link.to}
                  size="small"
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>

      {/* Footer Removed */}
    </Box>
  );
}
