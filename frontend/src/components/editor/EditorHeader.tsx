import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme as useMuiTheme,
} from "@mui/material";
import { ArrowLeft, Download, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "../../ThemeContext";

interface EditorHeaderProps {
  exporting: boolean;
  onExportClick: () => void;
}

/**
 * Editor Header Component
 * Contains logo, navigation, theme toggle, and export button
 */
function EditorHeaderComponent({ exporting, onExportClick }: EditorHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const isDark = mode === "dark";

  return (
    <Paper
      elevation={0}
      square
      sx={{
        px: { xs: 2, md: 3 },
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left Section: Logo & Navigation */}
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Back Button */}
        <Tooltip title={t('editor.header.backToHome')} arrow>
          <IconButton
            onClick={() => navigate("/")}
            size="small"
            sx={{
              color: "text.secondary",
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              "&:hover": {
                bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                borderColor: "primary.main",
                color: "primary.main",
              },
            }}
          >
            <ArrowLeft size={18} />
          </IconButton>
        </Tooltip>

        {/* Divider */}
        <Box
          sx={{
            width: 1,
            height: 28,
            bgcolor: "divider",
          }}
        />

        {/* Logo/Brand */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            component="img"
            src="/assets/images/subcio-logo.png"
            alt="Subcio"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.secondary.main} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
              display: { xs: "none", sm: "block" },
              fontSize: "1.1rem",
            }}
          >
            Subcio
          </Typography>
        </Stack>
      </Stack>

      {/* Right Section: Actions */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {/* Theme Toggle Button */}
        <Tooltip title={isDark ? t('editor.header.lightTheme') : t('editor.header.darkTheme')} arrow>
          <IconButton
            size="small"
            onClick={toggleTheme}
            sx={{
              color: "text.secondary",
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                color: isDark ? "warning.main" : "primary.main",
                bgcolor: isDark ? "rgba(251, 191, 36, 0.1)" : "rgba(99, 102, 241, 0.1)",
                transform: "rotate(15deg)",
              },
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Tooltip>

        {/* Settings Button */}
        <Tooltip title={t('editor.header.settings')} arrow>
          <IconButton
            size="small"
            sx={{
              color: "text.secondary",
              borderRadius: 2,
              "&:hover": {
                color: "text.primary",
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              },
            }}
          >
            <Settings size={20} />
          </IconButton>
        </Tooltip>

        {/* Export Button */}
        <Button
          variant="contained"
          size="medium"
          onClick={onExportClick}
          disabled={exporting}
          startIcon={exporting ? undefined : <Download size={18} />}
          sx={{
            px: 2.5,
            py: 1,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: "0.875rem",
            textTransform: "none",
            background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.secondary.main} 100%)`,
            boxShadow: `0 4px 14px ${isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)"}`,
            transition: "all 0.2s ease",
            "&:hover": {
              boxShadow: `0 6px 20px ${isDark ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.4)"}`,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&.Mui-disabled": {
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.26)",
            },
          }}
        >
          {exporting ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: "2px solid",
                  borderColor: "currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <span>{t('editor.header.exporting')}</span>
            </Stack>
          ) : (
            t('editor.header.export')
          )}
        </Button>
      </Stack>
    </Paper>
  );
}

export const EditorHeader = memo(EditorHeaderComponent);
export default EditorHeader;
