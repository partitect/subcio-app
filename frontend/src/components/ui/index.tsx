// ============================================================
// Subcio UI Components Library
// Reusable, standardized UI components for consistent design
// ============================================================

import React from "react";
import {
  Box,
  BoxProps,
  Paper,
  PaperProps,
  Typography,
  TypographyProps,
  Button,
  ButtonProps,
  Chip,
  ChipProps,
  Stack,
  alpha,
  styled,
  keyframes,
  useTheme,
} from "@mui/material";

// ============================================================
// Animations
// ============================================================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.5); }
`;

// ============================================================
// Glass Card - Glassmorphism styled container
// ============================================================

export interface GlassCardProps extends PaperProps {
  glowEffect?: boolean;
  hoverLift?: boolean;
  gradient?: boolean;
}

export const GlassCard = styled(Paper, {
  shouldForwardProp: (prop) => !["glowEffect", "hoverLift", "gradient"].includes(prop as string),
})<GlassCardProps>(({ theme, glowEffect, hoverLift, gradient }) => {
  const isDark = theme.palette.mode === "dark";
  
  return {
    background: gradient 
      ? isDark 
        ? "linear-gradient(145deg, rgba(30,32,38,0.95) 0%, rgba(24,26,32,0.9) 100%)"
        : "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)"
      : isDark 
        ? "rgba(26,28,35,0.85)"
        : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    borderRadius: theme.shape.borderRadius * 1.5,
    border: `1px solid ${theme.palette.divider}`,
    transition: "all 0.2s ease-in-out",
    position: "relative",
    overflow: "hidden",
    ...(glowEffect && {
      "&::before": {
        content: '""',
        position: "absolute",
        inset: -1,
        borderRadius: theme.shape.borderRadius * 1.5,
        padding: 1,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        opacity: 0,
        transition: "all 0.2s ease-in-out",
      },
      "&:hover::before": {
        opacity: 1,
      },
    }),
    ...(hoverLift && {
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: isDark 
          ? "0 20px 40px rgba(0,0,0,0.3)" 
          : "0 12px 32px rgba(0,0,0,0.08)",
        borderColor: theme.palette.primary.main,
      },
    }),
  };
});

// ============================================================
// Gradient Button - Button with gradient background
// ============================================================

export interface GradientButtonProps extends ButtonProps {
  gradientType?: "primary" | "secondary" | "accent";
}

export const GradientButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "gradientType",
})<GradientButtonProps>(({ theme, gradientType = "primary" }) => {
  const gradients = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    secondary: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    accent: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
  };

  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    accent: "#10b981",
  };

  return {
    background: gradients[gradientType],
    color: "#ffffff",
    fontWeight: 600,
    padding: "12px 24px",
    borderRadius: theme.shape.borderRadius,
    boxShadow: `0 4px 20px ${alpha(colors[gradientType], 0.35)}`,
    transition: "all 0.2s ease-in-out",
    position: "relative",
    overflow: "hidden",
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "-100%",
      width: "200%",
      height: "100%",
      background: `linear-gradient(90deg, transparent, ${alpha("#fff", 0.2)}, transparent)`,
      transition: "all 0.4s ease-in-out",
    },
    "&:hover": {
      boxShadow: `0 6px 28px ${alpha(colors[gradientType], 0.45)}`,
      transform: "translateY(-2px)",
      "&::after": {
        left: "100%",
      },
    },
    "&:active": {
      transform: "translateY(0)",
    },
    "&:disabled": {
      background: theme.palette.action.disabledBackground,
      boxShadow: "none",
    },
  };
});

// ============================================================
// Section Header - Consistent section titles
// ============================================================

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  centered?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  centered = false,
}) => {
  const theme = useTheme();
  
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: centered ? "center" : "flex-start", sm: centered ? "center" : "flex-end" }}
      justifyContent={centered ? "center" : "space-between"}
      spacing={1}
      sx={{ mb: 3 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ textAlign: centered ? "center" : "left" }}
      >
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
  );
};

// ============================================================
// Status Badge - Status indicators with colors
// ============================================================

export interface StatusBadgeProps extends Omit<ChipProps, "color"> {
  status: "success" | "warning" | "error" | "info" | "default";
  pulse?: boolean;
}

export const StatusBadge = styled(Chip, {
  shouldForwardProp: (prop) => !["status", "pulse"].includes(prop as string),
})<StatusBadgeProps>(({ theme, status, pulse: shouldPulse }) => {
  const statusColors = {
    success: theme.palette.success,
    warning: theme.palette.warning,
    error: theme.palette.error,
    info: theme.palette.info,
    default: { main: theme.palette.grey[500], light: theme.palette.grey[400] },
  };

  const color = statusColors[status];

  return {
    backgroundColor: alpha(color.main, 0.16),
    color: color.light || color.main,
    fontWeight: 600,
    fontSize: "0.75rem",
    borderRadius: 20,
    height: 24,
    "& .MuiChip-icon": {
      color: color.light || color.main,
    },
    ...(shouldPulse && {
      animation: `${pulse} 2s ease-in-out infinite`,
    }),
  };
});

// ============================================================
// Animated Container - Container with entrance animation
// ============================================================

export interface AnimatedContainerProps extends BoxProps {
  delay?: number;
  animation?: "fadeIn" | "float";
}

export const AnimatedContainer = styled(Box, {
  shouldForwardProp: (prop) => !["delay", "animation"].includes(prop as string),
})<AnimatedContainerProps>(({ delay = 0, animation = "fadeIn" }) => ({
  animation: `${animation === "fadeIn" ? fadeIn : float} 0.5s ease-out ${delay}s both`,
}));

// ============================================================
// Feature Card - Card for highlighting features
// ============================================================

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient = false,
}) => {
  const theme = useTheme();
  
  return (
    <GlassCard
      hoverLift
      glowEffect={gradient}
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          background: gradient 
            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
            : alpha(theme.palette.primary.main, 0.16),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: gradient ? "white" : theme.palette.primary.main,
          boxShadow: gradient ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` : "none",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {description}
        </Typography>
      </Box>
    </GlassCard>
  );
};

// ============================================================
// Shimmer Skeleton - Loading placeholder with shimmer
// ============================================================

export const ShimmerSkeleton = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, ${theme.palette.action.hover} 25%, ${theme.palette.action.selected} 50%, ${theme.palette.action.hover} 75%)`,
  backgroundSize: "200% 100%",
  animation: `${shimmer} 1.5s ease-in-out infinite`,
  borderRadius: theme.shape.borderRadius,
}));

// ============================================================
// Glow Box - Container with animated glow effect
// ============================================================

export const GlowBox = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius * 1.5,
  animation: `${glow} 3s ease-in-out infinite`,
}));

// ============================================================
// Gradient Text - Text with gradient color
// ============================================================

export interface GradientTextProps extends TypographyProps {
  gradientType?: "primary" | "secondary" | "accent";
}

export const GradientText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "gradientType",
})<GradientTextProps>(({ theme, gradientType = "primary" }) => {
  const gradients = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    secondary: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
    accent: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
  };

  return {
    background: gradients[gradientType],
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };
});

// ============================================================
// Stat Card - Card for displaying statistics
// ============================================================

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  size?: "small" | "medium" | "large";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  size = "medium",
}) => {
  const theme = useTheme();
  const sizeStyles = {
    small: { p: 2, valueFontSize: "1.25rem" },
    medium: { p: 2.5, valueFontSize: "1.75rem" },
    large: { p: 3, valueFontSize: "2.25rem" },
  };

  return (
    <GlassCard sx={{ p: sizeStyles[size].p }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
            {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            color="text.primary"
            sx={{ fontSize: sizeStyles[size].valueFontSize }}
          >
            {value}
          </Typography>
          {trend && (
            <Typography
              variant="caption"
              sx={{
                color: trend.positive ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 600,
              }}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.palette.primary.main,
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
    </GlassCard>
  );
};

// ============================================================
// Empty State - Placeholder for empty content
// ============================================================

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        px: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: alpha(theme.palette.primary.main, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.text.disabled,
          mx: "auto",
          mb: 3,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto", mb: 3 }} fontWeight={500}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
};

// ============================================================
// Divider with Label - Divider with centered text
// ============================================================

export interface DividerWithLabelProps {
  label: string;
}

export const DividerWithLabel: React.FC<DividerWithLabelProps> = ({ label }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      my: 3,
    }}
  >
    <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
  </Box>
);

// ============================================================
// Icon Button with Tooltip wrapper
// ============================================================

export interface IconWrapperProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "default";
  children: React.ReactNode;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  size = "medium",
  color = "primary",
  children,
}) => {
  const theme = useTheme();
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 48,
  };

  const colorMap = {
    primary: { bg: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main },
    secondary: { bg: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.main },
    default: { bg: alpha(theme.palette.text.primary, 0.08), color: theme.palette.text.secondary },
  };

  return (
    <Box
      sx={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: 1,
        background: colorMap[color].bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colorMap[color].color,
        transition: "all 0.15s ease",
        "&:hover": {
          background: alpha(colorMap[color].bg, 1.5),
        },
      }}
    >
      {children}
    </Box>
  );
};

// ============================================================
// Page Container - Consistent page wrapper
// ============================================================

export interface PageContainerProps extends Omit<BoxProps, 'maxWidth'> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | false;
  withBackground?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = "lg",
  withBackground = true,
  children,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        position: "relative",
        overflow: "hidden",
        ...sx,
      }}
      {...props}
    >
      {withBackground && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: isDark 
              ? "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.08), transparent 50%)"
              : "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.04), transparent 50%)",
            pointerEvents: "none",
          }}
        />
      )}
      <Box
        sx={{
          position: "relative",
          maxWidth: maxWidth ? { sm: 600, md: 900, lg: 1200, xl: 1536 }[maxWidth] : "none",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, md: 6 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// ============================================================
// Touch Controls (Re-exports)
// ============================================================

export { TouchSlider } from "./TouchSlider";
export { TouchButton, SwipeableArea, TouchProgressBar } from "./TouchControls";

// Export all components
export default {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatusBadge,
  AnimatedContainer,
  FeatureCard,
  ShimmerSkeleton,
  GlowBox,
  GradientText,
  StatCard,
  EmptyState,
  DividerWithLabel,
  IconWrapper,
  PageContainer,
};
