/**
 * Footer Component
 * 
 * Site footer with links and branding
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Github, Twitter, Youtube, Linkedin, Mail, Sparkles } from "lucide-react";

const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Tutorials", href: "/tutorials" },
    { label: "Blog", href: "/blog" },
    { label: "API Reference", href: "/api" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter, href: "https://twitter.com/pycaps", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com/@pycaps", label: "YouTube" },
  { icon: Github, href: "https://github.com/pycaps", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/company/pycaps", label: "LinkedIn" },
];

export function Footer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: isDark ? "grey.900" : "grey.50",
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer */}
        <Grid container spacing={4} sx={{ py: 8 }}>
          {/* Brand Column */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={20} color="white" />
                </Box>
                <Typography variant="h5" fontWeight={800}>
                  PyCaps
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
                AI-powered styled subtitle generator. Create beautiful, animated
                captions for your videos in seconds.
              </Typography>
              <Stack direction="row" spacing={1}>
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <IconButton
                      key={social.label}
                      component="a"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <Icon size={18} />
                    </IconButton>
                  );
                })}
              </Stack>
            </Stack>
          </Grid>

          {/* Links Columns */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Product
            </Typography>
            <Stack spacing={1.5}>
              {FOOTER_LINKS.product.map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Resources
            </Typography>
            <Stack spacing={1.5}>
              {FOOTER_LINKS.resources.map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Company
            </Typography>
            <Stack spacing={1.5}>
              {FOOTER_LINKS.company.map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Legal
            </Typography>
            <Stack spacing={1.5}>
              {FOOTER_LINKS.legal.map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Bar */}
        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ py: 3 }}
        >
          <Typography variant="caption" color="text.secondary">
            {t('footer.copyright', { year: currentYear })}
          </Typography>
          <Stack direction="row" spacing={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Mail size={14} />
              <Typography variant="caption" color="text.secondary">
                support@pycaps.com
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;
