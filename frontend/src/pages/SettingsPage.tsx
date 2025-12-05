
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Chip,
  alpha,
  useTheme,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Palette,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { useTheme as useAppTheme } from "../ThemeContext";

export default function SettingsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useAppTheme();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('subcio_language', lang);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "grey.900" : "grey.50",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {t('settings.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('settings.subtitle')}
            </Typography>
          </Box>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <List sx={{ p: 2 }}>
            {/* Theme */}
            <ListItem
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                mb: 2,
                p: 2,
              }}
            >
              <ListItemIcon>
                <Palette size={24} />
              </ListItemIcon>
              <ListItemText
                primary={t('settings.preferences.theme')}
                secondary={isDark ? t('settings.preferences.dark') : t('settings.preferences.light')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Switch
                checked={isDark}
                onChange={toggleTheme}
                color="primary"
              />
            </ListItem>

            {/* Language */}
            <ListItem
              alignItems="flex-start"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                p: 2,
                flexDirection: "column",
                gap: 2
              }}
            >
              <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                <ListItemIcon>
                  <Globe size={24} />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.preferences.language')}
                  secondary={languages.find(l => l.code === i18n.language)?.name || 'English'}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ml: { xs: 0, sm: 7 } }}>
                {languages.map((lang) => (
                  <Chip
                    key={lang.code}
                    label={`${lang.flag} ${lang.name}`}
                    onClick={() => handleLanguageChange(lang.code)}
                    variant={i18n.language === lang.code ? "filled" : "outlined"}
                    color={i18n.language === lang.code ? "primary" : "default"}
                    sx={{ cursor: "pointer", borderRadius: 1 }}
                  />
                ))}
              </Box>
            </ListItem>

          </List>
        </Paper>
      </Container>
    </Box>
  );
}
