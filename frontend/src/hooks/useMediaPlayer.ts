/**
 * Professional Media Player Hook
 * Handles video and audio playback with unified API
 * Supports background video for audio-only mode
 */
import { useRef, useState, useCallback, useEffect } from 'react';

export interface MediaPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isReady: boolean;
  isSeeking: boolean;
  volume: number;
  muted: boolean;
}

export interface MediaPlayerControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

interface UseMediaPlayerOptions {
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onReady?: (duration: number) => void;
}

interface UseMediaPlayerReturn {
  // Refs to attach to elements
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  bgVideoRef: React.RefObject<HTMLVideoElement>;
  
  // State
  state: MediaPlayerState;
  
  // Controls
  controls: MediaPlayerControls;
  
  // Event handlers to spread on elements
  getVideoProps: () => React.VideoHTMLAttributes<HTMLVideoElement>;
  getAudioProps: () => React.AudioHTMLAttributes<HTMLAudioElement>;
  getBgVideoProps: () => React.VideoHTMLAttributes<HTMLVideoElement>;
}

export function useMediaPlayer(
  mediaType: 'video' | 'audio',
  options: UseMediaPlayerOptions = {}
): UseMediaPlayerReturn {
  const { onTimeUpdate, onEnded, onReady } = options;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  // Internal tracking refs (not causing re-renders)
  const seekingRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  // State
  const [state, setState] = useState<MediaPlayerState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isReady: false,
    isSeeking: false,
    volume: 1,
    muted: false,
  });

  // Get the active media element
  const getActiveMedia = useCallback((): HTMLMediaElement | null => {
    if (mediaType === 'audio') {
      return audioRef.current;
    }
    return videoRef.current;
  }, [mediaType]);

  // Sync background video with audio
  const syncBgVideo = useCallback((time: number, playing: boolean) => {
    if (mediaType === 'audio' && bgVideoRef.current) {
      const bgVideo = bgVideoRef.current;
      
      // Sync time if difference is significant
      if (Math.abs(bgVideo.currentTime - time) > 0.3) {
        bgVideo.currentTime = time % (bgVideo.duration || time);
      }
      
      // Sync play state
      if (playing && bgVideo.paused) {
        bgVideo.play().catch(() => {});
      } else if (!playing && !bgVideo.paused) {
        bgVideo.pause();
      }
    }
  }, [mediaType]);

  // Play
  const play = useCallback(() => {
    const media = getActiveMedia();
    if (media) {
      media.play().catch(console.error);
    }
  }, [getActiveMedia]);

  // Pause
  const pause = useCallback(() => {
    const media = getActiveMedia();
    if (media) {
      media.pause();
    }
  }, [getActiveMedia]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    const media = getActiveMedia();
    if (media) {
      if (media.paused) {
        media.play().catch(console.error);
      } else {
        media.pause();
      }
    }
  }, [getActiveMedia]);

  // Seek to time
  const seek = useCallback((time: number) => {
    const media = getActiveMedia();
    if (!media) {
      console.warn('[useMediaPlayer] No media element found');
      return;
    }

    // Use media duration if available, otherwise allow the seek (useful before metadata loaded)
    const duration = media.duration && isFinite(media.duration) ? media.duration : Infinity;
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    console.log('[useMediaPlayer] Seeking to:', clampedTime, 'duration:', duration);
    
    // Set seeking flag BEFORE changing currentTime
    seekingRef.current = true;
    pendingSeekRef.current = clampedTime;
    
    // Update state immediately for responsive UI
    setState(prev => ({
      ...prev,
      currentTime: clampedTime,
      isSeeking: true,
    }));

    // Set the actual media time
    try {
      console.log('[useMediaPlayer] Setting media.currentTime to:', clampedTime);
      media.currentTime = clampedTime;
      console.log('[useMediaPlayer] media.currentTime is now:', media.currentTime);
    } catch (e) {
      console.warn('[useMediaPlayer] Seek failed:', e);
      seekingRef.current = false;
      pendingSeekRef.current = null;
    }
    
    // Sync background video
    syncBgVideo(clampedTime, !media.paused);
  }, [getActiveMedia, syncBgVideo]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const media = getActiveMedia();
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (media) {
      media.volume = clampedVolume;
    }
    
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, [getActiveMedia]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const media = getActiveMedia();
    if (media) {
      media.muted = !media.muted;
      setState(prev => ({ ...prev, muted: media.muted }));
    }
  }, [getActiveMedia]);

  // Skip forward
  const skipForward = useCallback((seconds = 5) => {
    const media = getActiveMedia();
    if (media) {
      seek(media.currentTime + seconds);
    }
  }, [getActiveMedia, seek]);

  // Skip backward
  const skipBackward = useCallback((seconds = 5) => {
    const media = getActiveMedia();
    if (media) {
      seek(Math.max(0, media.currentTime - seconds));
    }
  }, [getActiveMedia, seek]);

  // Event handlers for media elements
  const handleLoadedMetadata = useCallback((e: Event) => {
    const media = e.target as HTMLMediaElement;
    const duration = media.duration;
    
    if (duration && isFinite(duration)) {
      setState(prev => ({
        ...prev,
        duration,
        isReady: true,
      }));
      onReady?.(duration);
    }
  }, [onReady]);

  const handleTimeUpdate = useCallback((e: Event) => {
    const media = e.target as HTMLMediaElement;
    const currentTime = media.currentTime;
    
    // Skip if we're in the middle of a seek operation
    if (seekingRef.current) {
      console.log('[useMediaPlayer] timeupdate BLOCKED (seeking):', currentTime);
      return;
    }
    
    // Skip if media is seeking
    if (media.seeking) {
      console.log('[useMediaPlayer] timeupdate BLOCKED (media.seeking):', currentTime);
      return;
    }
    
    // Skip stale events after seek
    if (pendingSeekRef.current !== null) {
      if (Math.abs(currentTime - pendingSeekRef.current) > 0.5) {
        console.log('[useMediaPlayer] timeupdate BLOCKED (stale):', currentTime, 'pending:', pendingSeekRef.current);
        return; // Stale event, ignore
      }
      pendingSeekRef.current = null;
    }
    
    setState(prev => {
      // Skip if time hasn't changed significantly
      if (Math.abs(prev.currentTime - currentTime) < 0.01) {
        return prev;
      }
      return { ...prev, currentTime };
    });
    
    onTimeUpdate?.(currentTime);
    syncBgVideo(currentTime, !media.paused);
  }, [onTimeUpdate, syncBgVideo]);

  const handleSeeking = useCallback(() => {
    seekingRef.current = true;
    setState(prev => ({ ...prev, isSeeking: true }));
  }, []);

  const handleSeeked = useCallback((e: Event) => {
    const media = e.target as HTMLMediaElement;
    const currentTime = media.currentTime;
    
    seekingRef.current = false;
    pendingSeekRef.current = null;
    
    setState(prev => ({
      ...prev,
      currentTime,
      isSeeking: false,
    }));
    
    onTimeUpdate?.(currentTime);
    syncBgVideo(currentTime, !media.paused);
  }, [onTimeUpdate, syncBgVideo]);

  const handlePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
    syncBgVideo(state.currentTime, true);
  }, [syncBgVideo, state.currentTime]);

  const handlePause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    syncBgVideo(state.currentTime, false);
  }, [syncBgVideo, state.currentTime]);

  const handleEnded = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
    }
    onEnded?.();
  }, [onEnded]);

  const handleVolumeChange = useCallback((e: Event) => {
    const media = e.target as HTMLMediaElement;
    setState(prev => ({
      ...prev,
      volume: media.volume,
      muted: media.muted,
    }));
  }, []);

  // Generate props for video element
  const getVideoProps = useCallback((): React.VideoHTMLAttributes<HTMLVideoElement> => ({
    onLoadedMetadata: handleLoadedMetadata as any,
    onTimeUpdate: handleTimeUpdate as any,
    onSeeking: handleSeeking as any,
    onSeeked: handleSeeked as any,
    onPlay: handlePlay as any,
    onPause: handlePause as any,
    onEnded: handleEnded as any,
    onVolumeChange: handleVolumeChange as any,
  }), [handleLoadedMetadata, handleTimeUpdate, handleSeeking, handleSeeked, handlePlay, handlePause, handleEnded, handleVolumeChange]);

  // Generate props for audio element
  const getAudioProps = useCallback((): React.AudioHTMLAttributes<HTMLAudioElement> => ({
    onLoadedMetadata: handleLoadedMetadata as any,
    onTimeUpdate: handleTimeUpdate as any,
    onSeeking: handleSeeking as any,
    onSeeked: handleSeeked as any,
    onPlay: handlePlay as any,
    onPause: handlePause as any,
    onEnded: handleEnded as any,
    onVolumeChange: handleVolumeChange as any,
  }), [handleLoadedMetadata, handleTimeUpdate, handleSeeking, handleSeeked, handlePlay, handlePause, handleEnded, handleVolumeChange]);

  // Generate props for background video
  const getBgVideoProps = useCallback((): React.VideoHTMLAttributes<HTMLVideoElement> => ({
    loop: true,
    muted: true,
    playsInline: true,
  }), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward(e.shiftKey ? 10 : 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward(e.shiftKey ? 10 : 5);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, skipBackward, skipForward, toggleMute]);

  return {
    videoRef,
    audioRef,
    bgVideoRef,
    state,
    controls: {
      play,
      pause,
      toggle,
      seek,
      setVolume,
      toggleMute,
      skipForward,
      skipBackward,
    },
    getVideoProps,
    getAudioProps,
    getBgVideoProps,
  };
}

export default useMediaPlayer;
