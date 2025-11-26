/**
 * Register Page
 * 
 * User registration/signup page with plan selection
 */

import { useState } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
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

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();
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
  const [error, setError] = useState("");

  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[0];

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      setError("Lütfen adınızı girin");
      return;
    }
    if (!formData.email.trim()) {
      setError("Lütfen e-posta adresinizi girin");
      return;
    }
    if (!formData.password) {
      setError("Lütfen bir şifre belirleyin");
      return;
    }
    if (formData.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (!formData.agreeTerms) {
      setError("Devam etmek için kullanım koşullarını kabul etmelisiniz");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
      });
      
      // If paid plan, redirect to checkout
      if (selectedPlan.price.monthly > 0) {
        navigate(`/checkout?plan=${selectedPlanId}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Kayıt başarısız. Lütfen tekrar deneyin.");
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
                    Seçilen Plan
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedPlan.name} - ${selectedPlan.price.monthly}/mo
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Değiştir"
                size="small"
                component={RouterLink}
                to="/pricing"
                clickable
              />
            </Box>
          )}

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Hesap Oluştur
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            SubGen AI ile profesyonel altyazılar oluşturmaya başlayın
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
              veya e-posta ile
            </Typography>
          </Divider>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Ad Soyad"
              value={formData.fullName}
              onChange={handleChange("fullName")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Şifre"
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
              label="Şifre Tekrar"
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
                    Kullanım Koşulları
                  </Link>
                  'nı ve{" "}
                  <Link component={RouterLink} to="/privacy" color="primary">
                    Gizlilik Politikası
                  </Link>
                  'nı kabul ediyorum
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
                  Ürün güncellemeleri ve ipuçları hakkında e-posta almak istiyorum
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
              {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
            </Button>
          </form>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            Zaten hesabınız var mı?{" "}
            <Link
              component={RouterLink}
              to="/login"
              color="primary"
              fontWeight={600}
            >
              Giriş Yapın
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
            Ücretsiz planla bile şunları alırsınız:
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
