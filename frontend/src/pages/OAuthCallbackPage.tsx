/**
 * OAuth Callback Page
 * 
 * Handles OAuth provider callbacks (Google, GitHub)
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import { Google as GoogleIcon, GitHub as GitHubIcon } from "@mui/icons-material";
import { handleOAuthCallback } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

export default function OAuthCallbackPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const { provider } = useParams<{ provider: "google" | "github" }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      
      if (errorParam) {
        setError(t('auth.oauth.errors.denied'));
        setLoading(false);
        return;
      }
      
      if (!code) {
        setError(t('auth.oauth.errors.noCode'));
        setLoading(false);
        return;
      }
      
      if (!provider || !["google", "github"].includes(provider)) {
        setError(t('auth.oauth.errors.invalidProvider'));
        setLoading(false);
        return;
      }
      
      try {
        await handleOAuthCallback(provider as "google" | "github", code);
        
        // Refresh user data in context
        await refreshUser();
        
        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError(err.message || t('auth.oauth.errors.failed'));
        setLoading(false);
      }
    };
    
    processCallback();
  }, [searchParams, provider, navigate, t, refreshUser]);

  const ProviderIcon = provider === "google" ? GoogleIcon : GitHubIcon;
  const providerName = provider === "google" ? "Google" : "GitHub";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 8,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${alpha(theme.palette.secondary.dark, 0.1)} 100%)`,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(20px)",
            textAlign: "center",
          }}
        >
          <ProviderIcon sx={{ fontSize: 48, mb: 2, color: "primary.main" }} />
          
          {loading ? (
            <>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('auth.oauth.processing')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('auth.oauth.processingDesc', { provider: providerName })}
              </Typography>
              <CircularProgress />
            </>
          ) : error ? (
            <>
              <Typography variant="h5" fontWeight={700} gutterBottom color="error.main">
                {t('auth.oauth.error')}
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                {error}
              </Alert>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/login")}
                >
                  {t('auth.oauth.backToLogin')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  {t('auth.oauth.tryAgain')}
                </Button>
              </Box>
            </>
          ) : null}
        </Paper>
      </Container>
    </Box>
  );
}
