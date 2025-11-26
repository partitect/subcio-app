/**
 * Login Page
 * 
 * User login/authentication page
 */

import { useState } from "react";
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
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError(t('auth.login.errors.emailRequired'));
      return;
    }
    if (!formData.password) {
      setError(t('auth.login.errors.passwordRequired'));
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || t('auth.login.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement OAuth
    console.log(`Login with ${provider}`);
  };

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
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h4"
            sx={{
              fontWeight: 800,
              textDecoration: "none",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SubGen AI
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Social Login Buttons */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => handleSocialLogin("google")}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.3),
                color: "text.primary",
                "&:hover": {
                  borderColor: theme.palette.divider,
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => handleSocialLogin("github")}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.3),
                color: "text.primary",
                "&:hover": {
                  borderColor: theme.palette.divider,
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
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
