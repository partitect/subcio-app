/**
 * Forgot Password Page
 * 
 * Password reset request page
 */

import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import { ArrowBack, CheckCircle, Email } from "@mui/icons-material";
import { forgotPassword } from "../services/authService";

export default function ForgotPasswordPage() {
  const theme = useTheme();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Lütfen e-posta adresinizi girin");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
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
          {success ? (
            /* Success State */
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <CheckCircle sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                E-posta Gönderildi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
                Gelen kutunuzu kontrol edin.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                E-posta birkaç dakika içinde gelmezse, spam klasörünü kontrol edin.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              >
                Giriş Sayfasına Dön
              </Button>
            </Box>
          ) : (
            /* Reset Form */
            <>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <Email sx={{ fontSize: 32, color: "primary.main" }} />
              </Box>
              
              <Typography variant="h5" fontWeight={700} gutterBottom align="center">
                Şifrenizi mi Unuttunuz?
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Endişelenmeyin! E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="E-posta Adresi"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  sx={{ mb: 3 }}
                  autoComplete="email"
                  autoFocus
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
                  {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
                </Button>
              </form>
            </>
          )}

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Link
              component={RouterLink}
              to="/login"
              color="text.secondary"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                textDecoration: "none",
                "&:hover": { color: "primary.main" },
              }}
            >
              <ArrowBack fontSize="small" />
              <Typography variant="body2">Giriş sayfasına dön</Typography>
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
