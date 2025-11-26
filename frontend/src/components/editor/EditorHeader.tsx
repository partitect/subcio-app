import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { ArrowLeft, Download, Settings, Sparkles } from "lucide-react";
import { designTokens } from "../../theme";

const { colors } = designTokens;

interface EditorHeaderProps {
  exporting: boolean;
  onExportClick: () => void;
}

/**
 * Editor Header Component
 * Contains logo, navigation, and export button
 */
function EditorHeaderComponent({ exporting, onExportClick }: EditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      square
      sx={{
        px: { xs: 1.5, md: 2.5 },
        py: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        borderBottom: `1px solid ${alpha(colors.border.default, 0.5)}`,
        bgcolor: alpha(colors.bg.paper, 0.8),
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left Section: Logo & Navigation */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {/* Back Button */}
        <Tooltip title="Ana Sayfa" arrow>
          <IconButton
            onClick={() => navigate("/")}
            size="small"
            sx={{
              color: colors.text.secondary,
              bgcolor: alpha(colors.bg.elevated, 0.5),
              border: `1px solid ${alpha(colors.border.default, 0.3)}`,
              "&:hover": {
                bgcolor: alpha(colors.brand.primary, 0.1),
                borderColor: alpha(colors.brand.primary, 0.3),
                color: colors.brand.primary,
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
            height: 24,
            bgcolor: alpha(colors.border.default, 0.3),
          }}
        />

        {/* Logo/Brand */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.accent} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 8px ${alpha(colors.brand.primary, 0.3)}`,
            }}
          >
            <Sparkles size={18} color="#fff" />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.accent} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
              display: { xs: "none", sm: "block" },
            }}
          >
            PyCaps
          </Typography>
        </Stack>
      </Stack>

      {/* Right Section: Actions */}
      <Stack direction="row" alignItems="center" spacing={1}>
        {/* Settings Button */}
        <Tooltip title="Ayarlar" arrow>
          <IconButton
            size="small"
            sx={{
              color: colors.text.secondary,
              "&:hover": {
                color: colors.text.primary,
                bgcolor: alpha(colors.bg.elevated, 0.8),
              },
            }}
          >
            <Settings size={18} />
          </IconButton>
        </Tooltip>

        {/* Export Button */}
        <Button
          variant="contained"
          size="small"
          onClick={onExportClick}
          disabled={exporting}
          startIcon={exporting ? undefined : <Download size={16} />}
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: "0.8rem",
            textTransform: "none",
            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.accent} 100%)`,
            boxShadow: `0 2px 12px ${alpha(colors.brand.primary, 0.4)}`,
            transition: "all 0.2s ease",
            "&:hover": {
              boxShadow: `0 4px 20px ${alpha(colors.brand.primary, 0.5)}`,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&.Mui-disabled": {
              background: alpha(colors.bg.elevated, 0.5),
            },
          }}
        >
          {exporting ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
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
              <span>Rendering...</span>
            </Stack>
          ) : (
            "Export"
          )}
        </Button>
      </Stack>
    </Paper>
  );
}

export const EditorHeader = memo(EditorHeaderComponent);
export default EditorHeader;
