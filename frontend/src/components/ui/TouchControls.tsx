/**
 * Touch-Friendly Control Components
 * 
 * Enhanced buttons and controls for mobile touch interaction.
 * Features:
 * - Minimum 44x44px touch targets (WCAG 2.1 AAA)
 * - Visual feedback on touch
 * - Haptic feedback support
 * - Swipe gesture support
 */

import { forwardRef, useCallback, useRef, useState } from "react";
import {
  IconButton,
  IconButtonProps,
  Box,
  Typography,
  alpha,
  styled,
  useTheme,
} from "@mui/material";

// Touch-friendly icon button with larger hit area
const StyledTouchButton = styled(IconButton)(({ theme }) => ({
  // Minimum touch target size (44x44 for WCAG AAA, 48x48 for comfort)
  minWidth: 48,
  minHeight: 48,
  position: "relative",

  // Visual feedback
  transition: "transform 0.15s, background-color 0.2s",

  "&:active": {
    transform: "scale(0.92)",
  },

  // Ripple effect enhancement
  "& .MuiTouchRipple-root": {
    color: alpha(theme.palette.primary.main, 0.3),
  },

  // Focus visible for accessibility
  "&.Mui-focusVisible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },

  // Mobile adjustments
  [theme.breakpoints.down("sm")]: {
    minWidth: 52,
    minHeight: 52,
  },
}));

export interface TouchButtonProps extends IconButtonProps {
  /** Enable haptic feedback on touch */
  hapticFeedback?: boolean;
  /** Show label below icon */
  label?: string;
  /** Haptic pattern in ms */
  hapticPattern?: number | number[];
}

/**
 * TouchButton Component
 * 
 * A touch-optimized icon button with haptic feedback support.
 */
export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ hapticFeedback = true, hapticPattern = 10, label, onClick, children, ...props }, ref) => {
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Trigger haptic feedback
        if (hapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(hapticPattern);
        }
        onClick?.(e);
      },
      [hapticFeedback, hapticPattern, onClick]
    );

    if (label) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
          <StyledTouchButton ref={ref} onClick={handleClick} {...props}>
            {children}
          </StyledTouchButton>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
            {label}
          </Typography>
        </Box>
      );
    }

    return (
      <StyledTouchButton ref={ref} onClick={handleClick} {...props}>
        {children}
      </StyledTouchButton>
    );
  }
);

TouchButton.displayName = "TouchButton";

// Swipe direction type
type SwipeDirection = "left" | "right" | "up" | "down";

export interface SwipeableAreaProps {
  children: React.ReactNode;
  /** Callback when swiped left */
  onSwipeLeft?: () => void;
  /** Callback when swiped right */
  onSwipeRight?: () => void;
  /** Callback when swiped up */
  onSwipeUp?: () => void;
  /** Callback when swiped down */
  onSwipeDown?: () => void;
  /** Minimum swipe distance in px */
  minSwipeDistance?: number;
  /** Enable haptic on swipe */
  hapticFeedback?: boolean;
  /** Additional styles */
  sx?: object;
}

/**
 * SwipeableArea Component
 * 
 * A container that detects swipe gestures.
 */
export const SwipeableArea = forwardRef<HTMLDivElement, SwipeableAreaProps>(
  (
    {
      children,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      minSwipeDistance = 50,
      hapticFeedback = true,
      sx,
    },
    ref
  ) => {
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const [swiping, setSwiping] = useState(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setSwiping(true);
    }, []);

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        let direction: SwipeDirection | null = null;

        // Determine swipe direction
        if (absX > absY && absX > minSwipeDistance) {
          direction = deltaX > 0 ? "right" : "left";
        } else if (absY > absX && absY > minSwipeDistance) {
          direction = deltaY > 0 ? "down" : "up";
        }

        // Trigger callback
        if (direction) {
          if (hapticFeedback && "vibrate" in navigator) {
            navigator.vibrate(15);
          }

          switch (direction) {
            case "left":
              onSwipeLeft?.();
              break;
            case "right":
              onSwipeRight?.();
              break;
            case "up":
              onSwipeUp?.();
              break;
            case "down":
              onSwipeDown?.();
              break;
          }
        }

        touchStartRef.current = null;
        setSwiping(false);
      },
      [minSwipeDistance, hapticFeedback, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
    );

    const handleTouchCancel = useCallback(() => {
      touchStartRef.current = null;
      setSwiping(false);
    }, []);

    return (
      <Box
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        sx={{
          touchAction: "pan-y", // Allow vertical scroll, detect horizontal swipe
          userSelect: "none",
          ...sx,
        }}
      >
        {children}
      </Box>
    );
  }
);

SwipeableArea.displayName = "SwipeableArea";

export interface TouchProgressBarProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  height?: number;
  showThumb?: boolean;
  color?: "primary" | "secondary";
}

/**
 * TouchProgressBar Component
 * 
 * A touch-friendly progress bar that can be dragged.
 */
export const TouchProgressBar = forwardRef<HTMLDivElement, TouchProgressBarProps>(
  ({ value, max = 100, onChange, height = 8, showThumb = true, color = "primary" }, ref) => {
    const theme = useTheme();
    const barRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const handleInteraction = useCallback(
      (clientX: number) => {
        if (!barRef.current || !onChange) return;

        const rect = barRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const newValue = (newPercentage / 100) * max;

        onChange(newValue);
      },
      [max, onChange]
    );

    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
        handleInteraction(e.touches[0].clientX);

        if ("vibrate" in navigator) {
          navigator.vibrate(5);
        }
      },
      [handleInteraction]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (isDragging) {
          handleInteraction(e.touches[0].clientX);
        }
      },
      [isDragging, handleInteraction]
    );

    const handleTouchEnd = useCallback(() => {
      setIsDragging(false);
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    }, []);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteraction(e.clientX);
      },
      [handleInteraction]
    );

    return (
      <Box
        ref={(node: HTMLDivElement | null) => {
          barRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        sx={{
          position: "relative",
          height: height + 32, // Extra padding for touch
          py: 2,
          cursor: onChange ? "pointer" : "default",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {/* Track */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height,
            transform: "translateY(-50%)",
            borderRadius: height / 2,
            bgcolor: alpha(theme.palette[color].main, 0.2),
            overflow: "hidden",
          }}
        >
          {/* Progress */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${percentage}%`,
              bgcolor: theme.palette[color].main,
              borderRadius: height / 2,
              transition: isDragging ? "none" : "width 0.1s",
            }}
          />
        </Box>

        {/* Thumb */}
        {showThumb && onChange && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: `${percentage}%`,
              transform: "translate(-50%, -50%)",
              width: isDragging ? 24 : 20,
              height: isDragging ? 24 : 20,
              borderRadius: "50%",
              bgcolor: theme.palette[color].main,
              boxShadow: isDragging
                ? `0 0 0 8px ${alpha(theme.palette[color].main, 0.2)}`
                : `0 2px 4px ${alpha("#000", 0.2)}`,
              transition: isDragging ? "none" : "all 0.15s",

              // Touch target
              "&::before": {
                content: '""',
                position: "absolute",
                width: 48,
                height: 48,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
              },
            }}
          />
        )}
      </Box>
    );
  }
);

TouchProgressBar.displayName = "TouchProgressBar";

export default { TouchButton, SwipeableArea, TouchProgressBar };
