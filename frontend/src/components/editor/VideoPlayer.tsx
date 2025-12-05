import { memo, RefObject, VideoHTMLAttributes, AudioHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, alpha, Chip, CircularProgress } from "@mui/material";
import { Pause, Play, Zap } from "lucide-react";
import JSOOverlay from "../JSOOverlay";

interface VideoPlayerProps {
  mediaType: "video" | "audio";
  videoRef: RefObject<HTMLVideoElement>;
  audioRef: RefObject<HTMLAudioElement>;
  bgVideoRef: RefObject<HTMLVideoElement>;
  overlayRef: RefObject<HTMLDivElement>;
  resolvedVideoUrl: string;
  resolvedAudioUrl: string;
  bgVideoUrl: string;
  assContent: string;
  isPlaying: boolean;
  assLoading?: boolean;
  assCacheHit?: boolean;
  onTogglePlay: () => void;
  getVideoProps: () => VideoHTMLAttributes<HTMLVideoElement>;
  getAudioProps: () => AudioHTMLAttributes<HTMLAudioElement>;
  getBgVideoProps: () => VideoHTMLAttributes<HTMLVideoElement>;
}

/**
 * Video Player Component
 * Unified player for video and audio with subtitle overlay
 */
function VideoPlayerComponent({
  mediaType,
  videoRef,
  audioRef,
  bgVideoRef,
  overlayRef,
  resolvedVideoUrl,
  resolvedAudioUrl,
  bgVideoUrl,
  assContent,
  isPlaying,
  assLoading = false,
  assCacheHit = false,
  onTogglePlay,
  getVideoProps,
  getAudioProps,
  getBgVideoProps,
}: VideoPlayerProps) {
  const { t } = useTranslation();

  return (
    <Box
      ref={overlayRef}
      role="region"
      aria-label={t('a11y.videoPlayer')}
      sx={{
        position: "relative",
        width: "100%",
        bgcolor: "black",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: "16 / 9",
      }}
    >
      {/* Video Mode - Native HTML5 Video */}
      {mediaType === "video" && resolvedVideoUrl && (
        <Box
          component="video"
          ref={videoRef}
          src={resolvedVideoUrl}
          crossOrigin="anonymous"
          playsInline
          preload="auto"
          {...getVideoProps()}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      )}

      {/* Audio Mode - Background Video + Hidden Audio */}
      {mediaType === "audio" && resolvedAudioUrl && (
        <>
          {/* Background video (loops, muted) */}
          <Box
            component="video"
            ref={bgVideoRef}
            src={bgVideoUrl}
            loop
            muted
            playsInline
            preload="auto"
            {...getBgVideoProps()}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Hidden audio element - main audio source */}
          <Box
            component="audio"
            ref={audioRef}
            src={resolvedAudioUrl}
            {...getAudioProps()}
            sx={{ display: "none" }}
          />
        </>
      )}

      {/* No media loaded */}
      {!resolvedVideoUrl && !resolvedAudioUrl && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            position: "absolute",
            inset: 0,
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">{t('editor.video.loadProject')}</Typography>
        </Stack>
      )}

      {/* Click overlay for play/pause */}
      {(resolvedVideoUrl || resolvedAudioUrl) && (
        <Box
          onClick={onTogglePlay}
          role="button"
          tabIndex={0}
          aria-label={isPlaying ? t('a11y.pauseVideo') : t('a11y.playVideo')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTogglePlay();
            }
          }}
          sx={{
            position: "absolute",
            inset: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "transparent",
            transition: "background-color 0.2s ease",
            zIndex: 5,
            "&:hover": {
              bgcolor: alpha("#000", 0.1),
            },
            "&:hover .play-indicator": {
              opacity: 1,
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: -2,
            },
          }}
        >
          <Box
            className="play-indicator"
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: alpha("#000", 0.6),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.2s ease",
              color: "#fff",
            }}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </Box>
        </Box>
      )}

      {/* ASS Loading/Cache indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          display: "flex",
          gap: 1,
        }}
      >
        {assLoading && (
          <Chip
            size="small"
            icon={<CircularProgress size={12} sx={{ color: "inherit" }} />}
            label={t('editor.video.updating')}
            sx={{
              bgcolor: alpha("#000", 0.6),
              color: "#fff",
              fontSize: "0.7rem",
              height: 24,
            }}
          />
        )}
        {assCacheHit && !assLoading && (
          <Chip
            size="small"
            icon={<Zap size={12} />}
            label={t('editor.video.cached')}
            sx={{
              bgcolor: alpha("#4caf50", 0.8),
              color: "#fff",
              fontSize: "0.7rem",
              height: 24,
            }}
          />
        )}
      </Box>

      {/* Subtitle overlay - JSOOverlay uses video element */}
      {/* For audio mode, we use bgVideoRef since JASSUB needs a video element */}
      {/* JSOOverlay now loads fonts dynamically from /api/fonts */}
      {assContent && (
        <JSOOverlay
          videoRef={mediaType === "video" ? videoRef : bgVideoRef}
          assContent={assContent}
        />
      )}
    </Box>
  );
}

export const VideoPlayer = memo(VideoPlayerComponent);
export default VideoPlayer;
