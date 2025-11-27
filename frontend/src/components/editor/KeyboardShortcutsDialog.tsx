import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import { X, Keyboard, Play, Edit3, Navigation, Layout } from "lucide-react";
import { EDITOR_SHORTCUTS, formatShortcut } from "../../hooks/useKeyboardShortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

// Shortcut group definitions
const SHORTCUT_GROUPS = [
  {
    icon: Play,
    titleKey: "shortcuts.playback",
    shortcuts: [
      { ...EDITOR_SHORTCUTS.PLAY_PAUSE, labelKey: "shortcuts.playPause" },
      { ...EDITOR_SHORTCUTS.SEEK_FORWARD, labelKey: "shortcuts.seekForward" },
      { ...EDITOR_SHORTCUTS.SEEK_BACKWARD, labelKey: "shortcuts.seekBackward" },
      { ...EDITOR_SHORTCUTS.SEEK_FORWARD_FRAME, labelKey: "shortcuts.seekForwardFrame" },
      { ...EDITOR_SHORTCUTS.SEEK_BACKWARD_FRAME, labelKey: "shortcuts.seekBackwardFrame" },
      { ...EDITOR_SHORTCUTS.VOLUME_UP, labelKey: "shortcuts.volumeUp" },
      { ...EDITOR_SHORTCUTS.VOLUME_DOWN, labelKey: "shortcuts.volumeDown" },
      { ...EDITOR_SHORTCUTS.MUTE, labelKey: "shortcuts.mute" },
      { ...EDITOR_SHORTCUTS.FULLSCREEN, labelKey: "shortcuts.fullscreen" },
    ],
  },
  {
    icon: Edit3,
    titleKey: "shortcuts.editing",
    shortcuts: [
      { ...EDITOR_SHORTCUTS.SAVE, labelKey: "shortcuts.save" },
      { ...EDITOR_SHORTCUTS.UNDO, labelKey: "shortcuts.undo" },
      { ...EDITOR_SHORTCUTS.REDO, labelKey: "shortcuts.redo" },
      { ...EDITOR_SHORTCUTS.SELECT_ALL, labelKey: "shortcuts.selectAll" },
      { ...EDITOR_SHORTCUTS.DELETE, labelKey: "shortcuts.delete" },
      { ...EDITOR_SHORTCUTS.EXPORT, labelKey: "shortcuts.export" },
    ],
  },
  {
    icon: Navigation,
    titleKey: "shortcuts.navigation",
    shortcuts: [
      { ...EDITOR_SHORTCUTS.NEXT_WORD, labelKey: "shortcuts.nextWord" },
      { ...EDITOR_SHORTCUTS.PREV_WORD, labelKey: "shortcuts.prevWord" },
    ],
  },
  {
    icon: Layout,
    titleKey: "shortcuts.ui",
    shortcuts: [
      { ...EDITOR_SHORTCUTS.ESCAPE, labelKey: "shortcuts.escape" },
      { ...EDITOR_SHORTCUTS.HELP, labelKey: "shortcuts.help" },
    ],
  },
];

interface ShortcutItemProps {
  label: string;
  shortcut: string;
}

function ShortcutItem({ label, shortcut }: ShortcutItemProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        py: 0.75,
        px: 1,
        borderRadius: 1,
        "&:hover": {
          bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Chip
        label={shortcut}
        size="small"
        sx={{
          fontFamily: "monospace",
          fontWeight: 600,
          fontSize: "0.75rem",
          bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          color: "text.primary",
          borderRadius: 1,
          height: 24,
          "& .MuiChip-label": {
            px: 1,
          },
        }}
      />
    </Stack>
  );
}

function KeyboardShortcutsDialogComponent({
  open,
  onClose,
}: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? "grey.900" : "background.paper",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: isDark ? "primary.900" : "primary.50",
              display: "flex",
            }}
          >
            <Keyboard size={20} color={theme.palette.primary.main} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            {t("shortcuts.title")}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {SHORTCUT_GROUPS.map((group, index) => {
            const Icon = group.icon;
            return (
              <Grid item xs={12} md={6} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <Icon size={18} color={theme.palette.primary.main} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t(group.titleKey)}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5}>
                    {group.shortcuts.map((shortcut, idx) => (
                      <ShortcutItem
                        key={idx}
                        label={t(shortcut.labelKey)}
                        shortcut={formatShortcut(shortcut)}
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
            border: "1px solid",
            borderColor: "primary.main",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("shortcuts.tip")}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export const KeyboardShortcutsDialog = memo(KeyboardShortcutsDialogComponent);
export default KeyboardShortcutsDialog;
