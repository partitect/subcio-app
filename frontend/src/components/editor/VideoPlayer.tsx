import { memo, RefObject, VideoHTMLAttributes, AudioHTMLAttributes } from "react";
import { Box, Stack, Typography, alpha } from "@mui/material";
import { Pause, Play } from "lucide-react";
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
  overlayFonts: string[];
  isPlaying: boolean;
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
  overlayFonts,
  isPlaying,
  onTogglePlay,
  getVideoProps,
  getAudioProps,
  getBgVideoProps,
}: VideoPlayerProps) {
  return (
    <Box
      ref={overlayRef}
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
          <Typography variant="body2">Load a project to preview</Typography>
        </Stack>
      )}

      {/* Click overlay for play/pause */}
      {(resolvedVideoUrl || resolvedAudioUrl) && (
        <Box
          onClick={onTogglePlay}
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

      {/* Subtitle overlay - JSOOverlay uses video element */}
      {/* For audio mode, we use bgVideoRef since JASSUB needs a video element */}
      {assContent && (
        <JSOOverlay
          videoRef={mediaType === "video" ? videoRef : bgVideoRef}
          assContent={assContent}
          fonts={overlayFonts}
        />
      )}
    </Box>
  );
}

export const VideoPlayer = memo(VideoPlayerComponent);
export default VideoPlayer;
