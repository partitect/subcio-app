// ============================================================
// PyCaps UI Components Library
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
  StackProps,
  alpha,
  styled,
  keyframes,
} from "@mui/material";
import { designTokens } from "../../theme";

const { colors, radii, transitions, spacing } = designTokens;

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
  0%, 100% { box-shadow: 0 0 20px rgba(123, 142, 244, 0.3); }
  50% { box-shadow: 0 0 40px rgba(123, 142, 244, 0.5); }
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
})<GlassCardProps>(({ glowEffect, hoverLift, gradient }) => ({
  background: gradient ? colors.gradients.glass : colors.bg.glass,
  backdropFilter: "blur(12px)",
  borderRadius: radii.lg,
  border: `1px solid ${colors.border.default}`,
  transition: transitions.normal,
  position: "relative",
  overflow: "hidden",
  ...(glowEffect && {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: radii.lg,
      padding: 1,
      background: colors.gradients.primary,
      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      opacity: 0,
      transition: transitions.normal,
    },
    "&:hover::before": {
      opacity: 1,
    },
  }),
  ...(hoverLift && {
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: colors.shadows.lg,
      borderColor: colors.border.light,
    },
  }),
}));

// ============================================================
// Gradient Button - Button with gradient background
// ============================================================

export interface GradientButtonProps extends ButtonProps {
  gradientType?: "primary" | "secondary" | "accent";
}

export const GradientButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "gradientType",
})<GradientButtonProps>(({ gradientType = "primary" }) => {
  const gradientMap = {
    primary: colors.gradients.primary,
    secondary: colors.gradients.secondary,
    accent: colors.gradients.accent,
  };

  const colorMap = {
    primary: colors.brand.primary,
    secondary: colors.brand.secondary,
    accent: colors.brand.accent,
  };

  return {
    background: gradientMap[gradientType],
    color: gradientType === "accent" ? colors.text.inverse : colors.text.primary,
    fontWeight: 600,
    padding: "12px 24px",
    borderRadius: radii.md,
    boxShadow: `0 4px 20px ${alpha(colorMap[gradientType], 0.35)}`,
    transition: transitions.normal,
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
      transition: transitions.slow,
    },
    "&:hover": {
      boxShadow: `0 6px 28px ${alpha(colorMap[gradientType], 0.45)}`,
      transform: "translateY(-2px)",
      "&::after": {
        left: "100%",
      },
    },
    "&:active": {
      transform: "translateY(0)",
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
}) => (
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
            borderRadius: radii.sm,
            background: colors.gradients.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: colors.shadows.primary,
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    {action}
  </Stack>
);

// ============================================================
// Status Badge - Status indicators with colors
// ============================================================

export interface StatusBadgeProps extends Omit<ChipProps, "color"> {
  status: "success" | "warning" | "error" | "info" | "default";
  pulse?: boolean;
}

export const StatusBadge = styled(Chip, {
  shouldForwardProp: (prop) => !["status", "pulse"].includes(prop as string),
})<StatusBadgeProps>(({ status, pulse: shouldPulse }) => {
  const statusColors = {
    success: { bg: colors.status.success, light: colors.status.successLight },
    warning: { bg: colors.status.warning, light: colors.status.warningLight },
    error: { bg: colors.status.error, light: colors.status.errorLight },
    info: { bg: colors.status.info, light: colors.status.infoLight },
    default: { bg: colors.bg.hover, light: colors.text.secondary },
  };

  const color = statusColors[status];

  return {
    backgroundColor: alpha(color.bg, 0.16),
    color: color.light,
    fontWeight: 600,
    fontSize: "0.75rem",
    borderRadius: radii.full,
    height: 24,
    "& .MuiChip-icon": {
      color: color.light,
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
}) => (
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
        borderRadius: radii.md,
        background: gradient ? colors.gradients.primary : alpha(colors.brand.primary, 0.16),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: gradient ? "white" : colors.brand.primaryLight,
        boxShadow: gradient ? colors.shadows.primary : "none",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  </GlassCard>
);

// ============================================================
// Shimmer Skeleton - Loading placeholder with shimmer
// ============================================================

export const ShimmerSkeleton = styled(Box)({
  background: `linear-gradient(90deg, ${colors.bg.hover} 25%, ${colors.bg.active} 50%, ${colors.bg.hover} 75%)`,
  backgroundSize: "200% 100%",
  animation: `${shimmer} 1.5s ease-in-out infinite`,
  borderRadius: radii.sm,
});

// ============================================================
// Glow Box - Container with animated glow effect
// ============================================================

export const GlowBox = styled(Box)({
  position: "relative",
  borderRadius: radii.lg,
  animation: `${glow} 3s ease-in-out infinite`,
});

// ============================================================
// Gradient Text - Text with gradient color
// ============================================================

export interface GradientTextProps extends TypographyProps {
  gradientType?: "primary" | "secondary" | "accent";
}

export const GradientText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "gradientType",
})<GradientTextProps>(({ gradientType = "primary" }) => {
  const gradientMap = {
    primary: colors.gradients.primary,
    secondary: colors.gradients.secondary,
    accent: colors.gradients.accent,
  };

  return {
    background: gradientMap[gradientType],
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
  const sizeStyles = {
    small: { p: 2, valueFontSize: "1.25rem" },
    medium: { p: 2.5, valueFontSize: "1.75rem" },
    large: { p: 3, valueFontSize: "2.25rem" },
  };

  return (
    <GlassCard sx={{ p: sizeStyles[size].p }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: sizeStyles[size].valueFontSize }}
          >
            {value}
          </Typography>
          {trend && (
            <Typography
              variant="caption"
              sx={{
                color: trend.positive ? colors.status.success : colors.status.error,
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
              borderRadius: radii.md,
              background: alpha(colors.brand.primary, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.brand.primaryLight,
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
}) => (
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
        background: alpha(colors.brand.primary, 0.1),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.text.muted,
        mx: "auto",
        mb: 3,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto", mb: 3 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

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
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
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
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 48,
  };

  const colorMap = {
    primary: { bg: alpha(colors.brand.primary, 0.12), color: colors.brand.primaryLight },
    secondary: { bg: alpha(colors.brand.secondary, 0.12), color: colors.brand.secondaryLight },
    default: { bg: alpha(colors.text.primary, 0.08), color: colors.text.secondary },
  };

  return (
    <Box
      sx={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: radii.sm,
        background: colorMap[color].bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colorMap[color].color,
        transition: transitions.fast,
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
}) => (
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
          background: colors.gradients.hero,
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
