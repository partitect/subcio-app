/**
 * Login Page
 * 
 * User login/authentication page
 */

import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  alpha,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { initiateGoogleOAuth, initiateGitHubOAuth, getOAuthProviders, OAuthProviders } from "../services/authService";
import { getAssetPath } from "../utils/assetPath";

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess, showWarning } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProviders | null>(null);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);

  // Fetch OAuth providers on mount
  useEffect(() => {
    getOAuthProviders()
      .then(setOAuthProviders)
      .catch((err) => {
        // Check if it's a connection error
        if (err.message?.includes('bağlanılamıyor') || err.message?.includes('Connection')) {
          showWarning(t('auth.login.errors.serverOffline') || 'Sunucu şu anda erişilemiyor. Lütfen daha sonra tekrar deneyin.');
        }
        // OAuth not available, continue with email/password only
      });
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      showError(t('auth.login.errors.emailRequired'));
      return;
    }
    if (!formData.password) {
      showError(t('auth.login.errors.passwordRequired'));
      return;
    }

    setLoading(true);
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      showSuccess(t('auth.login.success') || 'Giriş başarılı! Yönlendiriliyorsunuz...');
      navigate("/dashboard");
    } catch (err: any) {
      const errorMessage = err.message || t('auth.login.errors.invalidCredentials');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    setOAuthLoading(provider);
    
    if (provider === "google") {
      initiateGoogleOAuth();
    } else if (provider === "github") {
      initiateGitHubOAuth();
    }
  };

  const isGoogleEnabled = oauthProviders?.providers?.google?.enabled ?? false;
  const isGitHubEnabled = oauthProviders?.providers?.github?.enabled ?? false;

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
        {/* Logo */}
        <Box 
          component={RouterLink}
          to="/"
          sx={{ 
            textAlign: "center", 
            mb: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <Box
            component="img"
            src={getAssetPath('assets/images/subcio-logo.png')}
            alt="Subcio"
            sx={{
              width: 64,
              height: 64,
              mb: 1.5,
              borderRadius: 2,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Subcio
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(20px)",
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t('auth.login.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.login.subtitle')}
          </Typography>

          {/* Social Login Buttons */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={oauthLoading === "google" ? <CircularProgress size={20} /> : <GoogleIcon />}
              onClick={() => handleSocialLogin("google")}
              disabled={!isGoogleEnabled || oauthLoading !== null}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.3),
                color: "text.primary",
                "&:hover": {
                  borderColor: theme.palette.divider,
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                },
                "&.Mui-disabled": {
                  borderColor: alpha(theme.palette.divider, 0.1),
                },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={oauthLoading === "github" ? <CircularProgress size={20} /> : <GitHubIcon />}
              onClick={() => handleSocialLogin("github")}
              disabled={!isGitHubEnabled || oauthLoading !== null}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.3),
                color: "text.primary",
                "&:hover": {
                  borderColor: theme.palette.divider,
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                },
                "&.Mui-disabled": {
                  borderColor: alpha(theme.palette.divider, 0.1),
                },
              }}
            >
              GitHub
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.login.orWith')}
            </Typography>
          </Divider>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('auth.login.email')}
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label={t('auth.login.password')}
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange("password")}
              sx={{ mb: 2 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={handleChange("rememberMe")}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">{t('auth.login.rememberMe')}</Typography>
                }
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                color="primary"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            {t('auth.login.noAccount')}{" "}
            <Link
              component={RouterLink}
              to="/register"
              color="primary"
              fontWeight={600}
            >
              {t('auth.login.signUp')}
            </Link>
          </Typography>
        </Paper>

        {/* Security Notice */}
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
          sx={{ mt: 3 }}
        >
          🔒 Bağlantınız güvenli SSL şifreleme ile korunmaktadır
        </Typography>
      </Container>
    </Box>
  );
}
