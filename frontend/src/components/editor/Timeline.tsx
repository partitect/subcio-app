import { memo, useCallback } from "react";
import { Box, IconButton, Paper, Stack, Tooltip, Typography, alpha } from "@mui/material";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { designTokens } from "../../theme";
import { formatTime, generateTimelineTicks, TimelineTick } from "../../utils/timeFormat";

const { colors } = designTokens;

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
  /**
   * Handle timeline click/drag for seeking
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
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        borderColor: alpha(colors.border.default, 0.5),
        bgcolor: alpha(colors.bg.paper, 0.95),
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Timeline Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        mb={1.5}
      >
        {/* Left: Time Display */}
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: alpha(colors.bg.elevated, 0.8),
            border: `1px solid ${alpha(colors.border.default, 0.3)}`,
            minWidth: 140,
            textAlign: "center",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: colors.brand.primary,
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
              fontSize: "0.75rem",
              color: alpha(colors.text.secondary, 0.6),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {" / "}
            {formatTime(totalDuration)}
          </Typography>
        </Box>

        {/* Center: Playback Controls */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="5s Geri (←)" arrow>
            <IconButton
              size="small"
              onClick={() => onSkipBackward(5)}
              sx={{
                color: colors.text.secondary,
                "&:hover": {
                  color: colors.text.primary,
                  bgcolor: alpha(colors.brand.primary, 0.1),
                },
              }}
            >
              <SkipBack size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title={isPlaying ? "Duraklat (Space)" : "Oynat (Space)"} arrow>
            <IconButton
              size="small"
              onClick={onTogglePlay}
              sx={{
                color: "#fff",
                bgcolor: colors.brand.primary,
                "&:hover": { bgcolor: colors.brand.accent },
                width: 40,
                height: 40,
                boxShadow: `0 2px 8px ${alpha(colors.brand.primary, 0.4)}`,
                transition: "all 0.2s ease",
              }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="5s İleri (→)" arrow>
            <IconButton
              size="small"
              onClick={() => onSkipForward(5)}
              sx={{
                color: colors.text.secondary,
                "&:hover": {
                  color: colors.text.primary,
                  bgcolor: alpha(colors.brand.primary, 0.1),
                },
              }}
            >
              <SkipForward size={16} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Right: Volume Control */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 120 }}>
          <Tooltip title={muted ? "Sesi Aç (M)" : "Sessize Al (M)"} arrow>
            <IconButton
              size="small"
              onClick={onToggleMute}
              sx={{
                color: muted ? colors.brand.accent : colors.text.secondary,
                "&:hover": { color: colors.text.primary },
              }}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </IconButton>
          </Tooltip>

          <Box
            onClick={handleVolumeClick}
            sx={{
              width: 60,
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(colors.border.default, 0.3),
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
                borderRadius: 2,
                bgcolor: colors.brand.primary,
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
            height: 20,
            mb: 0.5,
            borderBottom: `1px solid ${alpha(colors.border.default, 0.2)}`,
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
                    fontSize: "0.65rem",
                    color: alpha(colors.text.secondary, 0.6),
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                    mb: 0.25,
                    userSelect: "none",
                  }}
                >
                  {tick.label}
                </Typography>
              )}
              <Box
                sx={{
                  width: 1,
                  height: tick.isMajor ? 8 : 4,
                  bgcolor: alpha(colors.border.default, tick.isMajor ? 0.5 : 0.3),
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Main Timeline Track */}
        <Box
          onMouseDown={handleTimelineMouseDown}
          sx={{
            position: "relative",
            height: 56,
            borderRadius: 1.5,
            bgcolor: alpha(colors.bg.elevated, 0.6),
            overflow: "hidden",
            border: `1px solid ${alpha(colors.border.default, 0.3)}`,
            cursor: "pointer",
            userSelect: "none",
            transition: "border-color 0.15s ease",
            "&:hover": {
              borderColor: alpha(colors.brand.primary, 0.4),
            },
          }}
        >
          {/* Background Grid Pattern */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `repeating-linear-gradient(90deg, ${alpha(colors.border.default, 0.1)} 0, ${alpha(colors.border.default, 0.1)} 1px, transparent 1px, transparent 10%)`,
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
              background: `linear-gradient(90deg, ${alpha(colors.brand.primary, 0.15)} 0%, ${alpha(colors.brand.accent, 0.08)} 100%)`,
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
                  top: 10,
                  bottom: 10,
                  left: cue.left,
                  width: cue.width,
                  minWidth: 6,
                  borderRadius: 1,
                  bgcolor: cue.isActive ? colors.brand.accent : colors.brand.primary,
                  opacity: cue.isActive ? 1 : 0.7,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: `1px solid ${alpha(cue.isActive ? colors.brand.accent : colors.brand.primary, 0.3)}`,
                  "&:hover": {
                    opacity: 1,
                    transform: "scaleY(1.05)",
                    zIndex: 5,
                  },
                  ...(cue.isActive && {
                    boxShadow: `0 0 12px ${alpha(colors.brand.accent, 0.5)}, inset 0 0 20px ${alpha("#fff", 0.1)}`,
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
              width: 2,
              bgcolor: "#fff",
              boxShadow: `0 0 10px ${alpha("#fff", 0.6)}, 0 0 20px ${alpha(colors.brand.primary, 0.4)}`,
              zIndex: 10,
              pointerEvents: "none",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -2,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `8px solid ${colors.brand.primary}`,
              },
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -2,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: `8px solid ${colors.brand.primary}`,
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
