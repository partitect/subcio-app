import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Paper, Stack, Tooltip, Typography, useTheme as useMuiTheme } from "@mui/material";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { formatTime, generateTimelineTicks, TimelineTick } from "../../utils/timeFormat";
import { useTheme } from "../../ThemeContext";

interface TimelineCue {
  key: string;
  left: string;
  width: string;
  text: string;
  start: number;
  end: number;
  isActive: boolean;
}

interface TimelineProps {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  muted: boolean;
  volume: number;
  timelineCues: TimelineCue[];
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSkipBackward: (seconds: number) => void;
  onSkipForward: (seconds: number) => void;
}

/**
 * Timeline Component
 * Professional timeline with playhead, cue blocks, and playback controls
 */
function TimelineComponent({
  currentTime,
  totalDuration,
  isPlaying,
  muted,
  volume,
  timelineCues,
  onSeek,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSkipBackward,
  onSkipForward,
}: TimelineProps) {
  const { t } = useTranslation();
  const muiTheme = useMuiTheme();
  const { isDark } = useTheme();

  /**
   * Handle timeline click/drag for seeking (mouse)
   */
  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const seekTime = percentage * totalDuration;
      onSeek(Math.max(0, Math.min(totalDuration, seekTime)));

      // Enable dragging
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const moveX = moveEvent.clientX - rect.left;
        const movePercentage = moveX / rect.width;
        const moveSeekTime = movePercentage * totalDuration;
        onSeek(Math.max(0, Math.min(totalDuration, moveSeekTime)));
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [totalDuration, onSeek]
  );

  /**
   * Handle timeline touch for seeking (mobile)
   */
  const handleTimelineTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const percentage = x / rect.width;
      const seekTime = percentage * totalDuration;
      onSeek(Math.max(0, Math.min(totalDuration, seekTime)));
      
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(5);
      }

      // Store rect for move handler
      const handleTouchMove = (moveEvent: TouchEvent) => {
        const moveTouch = moveEvent.touches[0];
        const moveX = moveTouch.clientX - rect.left;
        const movePercentage = moveX / rect.width;
        const moveSeekTime = movePercentage * totalDuration;
        onSeek(Math.max(0, Math.min(totalDuration, moveSeekTime)));
      };

      const handleTouchEnd = () => {
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove, { passive: true });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [totalDuration, onSeek]
  );

  /**
   * Handle volume bar click
   */
  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, x / rect.width));
      onVolumeChange(newVolume);
    },
    [onVolumeChange]
  );

  const ticks = generateTimelineTicks(totalDuration);
  const playheadPosition = (currentTime / totalDuration) * 100;

  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.5,
        py: 2,
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Timeline Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 1.5, sm: 2 }}
        mb={2}
      >
        {/* Mobile: Playback Controls on top */}
        <Stack 
          direction="row" 
          spacing={1.5} 
          alignItems="center" 
          justifyContent="center"
          sx={{ display: { xs: "flex", sm: "none" }, order: 0 }}
        >
          <IconButton
            size="medium"
            onClick={() => onSkipBackward(5)}
            sx={{
              color: "text.secondary",
              borderRadius: 2,
              minWidth: 48,
              minHeight: 48,
              "&:hover, &:active": {
                color: "text.primary",
                bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <SkipBack size={22} />
          </IconButton>

          <IconButton
            size="large"
            onClick={onTogglePlay}
            sx={{
              color: "#fff",
              bgcolor: "primary.main",
              "&:hover, &:active": { bgcolor: "secondary.main" },
              width: 56,
              height: 56,
              borderRadius: 3,
              boxShadow: `0 4px 12px ${isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)"}`,
              transition: "all 0.2s ease",
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 3 }} />}
          </IconButton>

          <IconButton
            size="medium"
            onClick={() => onSkipForward(5)}
            sx={{
              color: "text.secondary",
              borderRadius: 2,
              minWidth: 48,
              minHeight: 48,
              "&:hover, &:active": {
                color: "text.primary",
                bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <SkipForward size={22} />
          </IconButton>
        </Stack>

        {/* Left: Time Display */}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 0.75,
            borderRadius: 2,
            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: 1,
            borderColor: "divider",
            minWidth: { xs: "auto", sm: 150 },
            textAlign: "center",
            order: { xs: 1, sm: 0 },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "primary.main",
              letterSpacing: "0.5px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(currentTime)}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontSize: "0.8rem",
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {" / "}
            {formatTime(totalDuration)}
          </Typography>
        </Box>

        {/* Center: Playback Controls (Desktop only) */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", sm: "flex" } }}>
          <Tooltip title={t('editor.timeline.skipBack')} arrow>
            <IconButton
              size="small"
              onClick={() => onSkipBackward(5)}
              sx={{
                color: "text.secondary",
                borderRadius: 2,
                "&:hover": {
                  color: "text.primary",
                  bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                },
              }}
            >
              <SkipBack size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title={isPlaying ? t('editor.timeline.pause') : t('editor.timeline.play')} arrow>
            <IconButton
              size="medium"
              onClick={onTogglePlay}
              sx={{
                color: "#fff",
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "secondary.main" },
                width: 44,
                height: 44,
                borderRadius: 2.5,
                boxShadow: `0 4px 12px ${isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)"}`,
                transition: "all 0.2s ease",
              }}
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editor.timeline.skipForward')} arrow>
            <IconButton
              size="small"
              onClick={() => onSkipForward(5)}
              sx={{
                color: "text.secondary",
                borderRadius: 2,
                "&:hover": {
                  color: "text.primary",
                  bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                },
              }}
            >
              <SkipForward size={18} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Right: Volume Control (hidden on mobile) */}
        <Stack 
          direction="row" 
          spacing={1.5} 
          alignItems="center" 
          sx={{ 
            minWidth: { xs: "auto", sm: 130 },
            display: { xs: "none", sm: "flex" },
            order: { xs: 2, sm: 0 },
          }}
        >
          <Tooltip title={muted ? t('editor.timeline.unmute') : t('editor.timeline.mute')} arrow>
            <IconButton
              size="small"
              onClick={onToggleMute}
              sx={{
                color: muted ? "secondary.main" : "text.secondary",
                borderRadius: 2,
                "&:hover": { color: "text.primary" },
              }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconButton>
          </Tooltip>

          <Box
            onClick={handleVolumeClick}
            sx={{
              width: 70,
              height: 6,
              borderRadius: 3,
              bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              position: "relative",
              cursor: "pointer",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(muted ? 0 : volume) * 100}%`,
                borderRadius: 3,
                bgcolor: "primary.main",
              }}
            />
          </Box>
        </Stack>
      </Stack>

      {/* Timeline Track Container */}
      <Box sx={{ position: "relative" }}>
        {/* Time Ruler */}
        <Box
          sx={{
            position: "relative",
            height: 24,
            mb: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {ticks.map((tick: TimelineTick, idx: number) => (
            <Box
              key={idx}
              sx={{
                position: "absolute",
                left: `${tick.position}%`,
                bottom: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {tick.label && (
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "text.secondary",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                    mb: 0.5,
                    userSelect: "none",
                  }}
                >
                  {tick.label}
                </Typography>
              )}
              <Box
                sx={{
                  width: 1,
                  height: tick.isMajor ? 10 : 5,
                  bgcolor: isDark 
                    ? tick.isMajor ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)" 
                    : tick.isMajor ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)",
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Main Timeline Track */}
        <Box
          onMouseDown={handleTimelineMouseDown}
          onTouchStart={handleTimelineTouchStart}
          sx={{
            position: "relative",
            height: { xs: 80, sm: 64 },
            borderRadius: 2,
            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            cursor: "pointer",
            userSelect: "none",
            touchAction: "none",
            transition: "border-color 0.15s ease",
            "&:hover": {
              borderColor: "primary.main",
            },
            // Larger touch target on mobile
            "&::before": {
              content: '""',
              position: "absolute",
              top: { xs: -12, sm: 0 },
              bottom: { xs: -12, sm: 0 },
              left: 0,
              right: 0,
            },
          }}
        >
          {/* Background Grid Pattern */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: isDark
                ? `repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10%)`
                : `repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 10%)`,
              pointerEvents: "none",
            }}
          />

          {/* Progress Fill */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: `${playheadPosition}%`,
              background: isDark
                ? `linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)`
                : `linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)`,
              pointerEvents: "none",
            }}
          />

          {/* Cue Blocks */}
          {timelineCues.map((cue) => (
            <Tooltip
              key={cue.key}
              title={
                <Box>
                  <Typography variant="caption" fontWeight={600}>
                    {cue.text}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                    {formatTime(cue.start)} → {formatTime(cue.end)}
                  </Typography>
                </Box>
              }
              placement="top"
              arrow
            >
              <Box
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSeek(cue.start);
                }}
                sx={{
                  position: "absolute",
                  top: 12,
                  bottom: 12,
                  left: cue.left,
                  width: cue.width,
                  minWidth: 8,
                  borderRadius: 1.5,
                  bgcolor: cue.isActive ? "secondary.main" : "primary.main",
                  opacity: cue.isActive ? 1 : 0.75,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: 1,
                  borderColor: cue.isActive 
                    ? "secondary.light" 
                    : isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)",
                  "&:hover": {
                    opacity: 1,
                    transform: "scaleY(1.08)",
                    zIndex: 5,
                  },
                  ...(cue.isActive && {
                    boxShadow: `0 0 16px ${isDark ? "rgba(236, 72, 153, 0.5)" : "rgba(236, 72, 153, 0.4)"}`,
                  }),
                }}
              />
            </Tooltip>
          ))}

          {/* Playhead */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${playheadPosition}%`,
              transform: "translateX(-50%)",
              width: 3,
              bgcolor: isDark ? "#fff" : muiTheme.palette.primary.main,
              boxShadow: isDark 
                ? `0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(99, 102, 241, 0.4)`
                : `0 0 8px rgba(99, 102, 241, 0.5)`,
              zIndex: 10,
              pointerEvents: "none",
              borderRadius: 1,
              "&::before": {
                content: '""',
                position: "absolute",
                top: -3,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: `9px solid ${muiTheme.palette.primary.main}`,
              },
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -3,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderBottom: `9px solid ${muiTheme.palette.primary.main}`,
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}

export const Timeline = memo(TimelineComponent);
export default Timeline;
