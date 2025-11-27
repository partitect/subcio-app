/**
 * Register Page
 * 
 * User registration/signup page with plan selection
 */

import { useState } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
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
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  CheckCircle,
  AutoAwesome,
} from "@mui/icons-material";
import { PRICING_PLANS } from "../config/pricing";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const [searchParams] = useSearchParams();
  const selectedPlanId = searchParams.get("plan") || "free";
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    newsletter: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[0];

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      showError(t('auth.register.errors.nameRequired'));
      return;
    }
    if (!formData.email.trim()) {
      showError(t('auth.register.errors.emailRequired'));
      return;
    }
    if (!formData.password) {
      showError(t('auth.register.errors.passwordRequired'));
      return;
    }
    if (formData.password.length < 8) {
      showError(t('auth.register.errors.passwordLength'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showError(t('auth.register.errors.passwordMismatch'));
      return;
    }
    if (!formData.agreeTerms) {
      showError(t('auth.register.errors.termsRequired'));
      return;
    }

    setLoading(true);
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
      });
      
      showSuccess(t('auth.register.success') || 'Kayıt başarılı! Yönlendiriliyorsunuz...');
      
      // If paid plan, redirect to checkout
      if (selectedPlan.price.monthly > 0) {
        navigate(`/checkout?plan=${selectedPlanId}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      showError(err.message || t('auth.register.errors.emailExists'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement OAuth
    console.log(`Register with ${provider}`);
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
            src="/assets/images/subcio-logo.png"
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
          {/* Selected Plan Badge */}
          {selectedPlan.price.monthly > 0 && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AutoAwesome sx={{ color: "primary.main" }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('auth.register.selectedPlan')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedPlan.name} - ${selectedPlan.price.monthly}/mo
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={t('auth.register.changePlan')}
                size="small"
                component={RouterLink}
                to="/pricing"
                clickable
              />
            </Box>
          )}

          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t('auth.register.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.register.subtitle')}
          </Typography>

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
              veya e-posta ile
            </Typography>
          </Divider>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('auth.register.name')}
              value={formData.fullName}
              onChange={handleChange("fullName")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('auth.register.email')}
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('auth.register.password')}
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange("password")}
              sx={{ mb: 2 }}
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
              helperText="En az 8 karakter"
            />
            <TextField
              fullWidth
              label={t('auth.register.confirmPassword')}
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreeTerms}
                  onChange={handleChange("agreeTerms")}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  <Link component={RouterLink} to="/terms" color="primary">
                    {t('auth.register.terms')}
                  </Link>
                  {' '}{t('auth.register.and')}{' '}
                  <Link component={RouterLink} to="/privacy" color="primary">
                    {t('auth.register.privacy')}
                  </Link>
                  {' '}{t('auth.register.agreeTerms')}
                </Typography>
              }
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.newsletter}
                  onChange={handleChange("newsletter")}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  {t('auth.register.newsletter')}
                </Typography>
              }
              sx={{ mb: 3 }}
            />

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
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>
          </form>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            {t('auth.register.hasAccount')}{" "}
            <Link
              component={RouterLink}
              to="/login"
              color="primary"
              fontWeight={600}
            >
              {t('auth.register.logIn')}
            </Link>
          </Typography>
        </Paper>

        {/* Features Preview */}
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 2 }}
          >
            {t('auth.register.freeFeatures')}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {[
              "10 dakika transkripsiyon",
              "Temel efektler",
              "ASS formatı",
              "Sınırsız düzenleme",
            ].map((feature) => (
              <Box
                key={feature}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <CheckCircle sx={{ fontSize: 16, color: "success.main" }} />
                <Typography variant="body2" color="text.secondary">
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
