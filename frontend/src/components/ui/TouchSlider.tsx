/**
 * Touch-Friendly Slider Component
 * 
 * Enhanced MUI Slider with better touch targets and mobile support.
 * Features:
 * - Larger touch targets for mobile (48x48 minimum)
 * - Touch event handling with haptic feedback support
 * - Visual feedback on touch
 * - Accessible with ARIA labels
 */

import { forwardRef, useCallback, useState } from "react";
import { Slider, SliderProps, Box, Typography, alpha, styled } from "@mui/material";

// Enhanced slider with larger touch targets
const StyledSlider = styled(Slider)(({ theme }) => ({
  // Base styles
  height: 8,
  padding: "15px 0",
  
  // Track
  "& .MuiSlider-track": {
    border: "none",
    borderRadius: 4,
  },
  
  // Rail
  "& .MuiSlider-rail": {
    opacity: 0.3,
    borderRadius: 4,
  },
  
  // Thumb - larger touch target
  "& .MuiSlider-thumb": {
    height: 24,
    width: 24,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    transition: "box-shadow 0.2s, transform 0.15s",
    
    // Touch target wrapper (invisible but catchable)
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
    
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
      transform: "scale(1.1)",
    },
    
    // Active state for touch
    "&.Mui-active": {
      transform: "scale(1.2)",
      boxShadow: `0 0 0 14px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  
  // Value label
  "& .MuiSlider-valueLabel": {
    lineHeight: 1.2,
    fontSize: 12,
    background: "unset",
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: "50% 50% 50% 0",
    backgroundColor: theme.palette.primary.main,
    transformOrigin: "bottom left",
    transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
    "&::before": { display: "none" },
    "&.MuiSlider-valueLabelOpen": {
      transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
    },
    "& > *": {
      transform: "rotate(45deg)",
    },
  },
  
  // Mobile-specific adjustments
  [theme.breakpoints.down("sm")]: {
    height: 10,
    padding: "20px 0",
    
    "& .MuiSlider-thumb": {
      height: 28,
      width: 28,
      
      "&::before": {
        width: 56,
        height: 56,
      },
    },
  },
}));

export interface TouchSliderProps extends Omit<SliderProps, "onChange"> {
  /** Label text shown above the slider */
  label?: string;
  /** Show current value next to slider */
  showValue?: boolean;
  /** Unit suffix for value display (e.g., "px", "%") */
  valueSuffix?: string;
  /** Format value for display */
  formatValue?: (value: number) => string;
  /** Callback when value changes */
  onChange?: (value: number) => void;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * TouchSlider Component
 * 
 * A touch-friendly slider with enhanced mobile support.
 */
export const TouchSlider = forwardRef<HTMLSpanElement, TouchSliderProps>(
  (
    {
      label,
      showValue = true,
      valueSuffix = "",
      formatValue,
      onChange,
      value,
      min = 0,
      max = 100,
      step = 1,
      ariaLabel,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isActive, setIsActive] = useState(false);
    
    const handleChange = useCallback(
      (_event: Event, newValue: number | number[]) => {
        const val = Array.isArray(newValue) ? newValue[0] : newValue;
        onChange?.(val);
        
        // Trigger haptic feedback on mobile if available
        if ("vibrate" in navigator && isActive) {
          navigator.vibrate(5);
        }
      },
      [onChange, isActive]
    );
    
    const handleChangeCommitted = useCallback(() => {
      setIsActive(false);
      
      // Stronger haptic on release
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    }, []);
    
    const handleTouchStart = useCallback(() => {
      setIsActive(true);
    }, []);
    
    const displayValue = typeof value === "number" 
      ? formatValue 
        ? formatValue(value) 
        : `${value}${valueSuffix}`
      : "";
    
    return (
      <Box sx={{ width: "100%" }}>
        {label && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              component="label"
              id={`${props.id || 'slider'}-label`}
            >
              {label}
            </Typography>
            {showValue && (
              <Typography 
                variant="body2" 
                color="text.primary"
                sx={{ minWidth: 50, textAlign: "right", fontWeight: 500 }}
              >
                {displayValue}
              </Typography>
            )}
          </Box>
        )}
        <StyledSlider
          ref={ref}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          onTouchStart={handleTouchStart}
          onMouseDown={() => setIsActive(true)}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-labelledby={label ? `${props.id || 'slider'}-label` : undefined}
          valueLabelDisplay={isActive ? "on" : "auto"}
          {...props}
        />
      </Box>
    );
  }
);

TouchSlider.displayName = "TouchSlider";

export default TouchSlider;
