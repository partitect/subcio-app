import { createTheme, alpha, ThemeOptions } from "@mui/material";
import { Components, Theme } from "@mui/material/styles";

// ============================================================
// PyCaps Design System - Theme Configuration
// ============================================================

// Color Palette
const colors = {
  // Brand Colors
  brand: {
    primary: "#7b8ef4",
    primaryLight: "#a5b4fc",
    primaryDark: "#5e6ed9",
    secondary: "#f6a6b2",
    secondaryLight: "#fbd5db",
    secondaryDark: "#d27d89",
    accent: "#66e3c4",
    accentLight: "#a8f0dc",
    accentDark: "#3eb89c",
  },
  // Status Colors
  status: {
    success: "#72c59e",
    successLight: "#a8dcc2",
    successDark: "#4a9c75",
    warning: "#f6c177",
    warningLight: "#fad9a8",
    warningDark: "#d9a055",
    error: "#f46e7b",
    errorLight: "#f9a5ac",
    errorDark: "#d14854",
    info: "#64b5f6",
    infoLight: "#90caf9",
    infoDark: "#42a5f5",
  },
  // Background Colors
  bg: {
    default: "#0f1118",
    paper: "#171b25",
    elevated: "#1e2433",
    card: "#1a1f2e",
    hover: "#252b3d",
    active: "#2d3548",
    overlay: "rgba(15, 17, 24, 0.85)",
    glass: "rgba(23, 27, 37, 0.7)",
  },
  // Text Colors
  text: {
    primary: "#ffffff",
    secondary: "#a0aec0",
    tertiary: "#718096",
    disabled: "#4a5568",
    muted: "#6b7280",
    inverse: "#0f1118",
  },
  // Border & Divider
  border: {
    default: "rgba(255, 255, 255, 0.08)",
    light: "rgba(255, 255, 255, 0.12)",
    medium: "rgba(255, 255, 255, 0.16)",
    focus: "rgba(123, 142, 244, 0.5)",
  },
  // Gradient Presets
  gradients: {
    primary: "linear-gradient(135deg, #7b8ef4 0%, #5e6ed9 100%)",
    secondary: "linear-gradient(135deg, #f6a6b2 0%, #d27d89 100%)",
    accent: "linear-gradient(135deg, #66e3c4 0%, #3eb89c 100%)",
    dark: "linear-gradient(180deg, #171b25 0%, #0f1118 100%)",
    glass: "linear-gradient(135deg, rgba(123, 142, 244, 0.1) 0%, rgba(246, 166, 178, 0.05) 100%)",
    hero: "radial-gradient(circle at 20% 20%, rgba(123,142,244,0.14), transparent 30%), radial-gradient(circle at 80% 10%, rgba(246,166,178,0.12), transparent 28%), radial-gradient(circle at 70% 80%, rgba(114,197,158,0.1), transparent 25%)",
    mesh: "radial-gradient(at 40% 20%, rgba(123,142,244,0.2) 0px, transparent 50%), radial-gradient(at 80% 60%, rgba(246,166,178,0.15) 0px, transparent 50%), radial-gradient(at 20% 80%, rgba(102,227,196,0.1) 0px, transparent 50%)",
  },
  // Shadow Presets
  shadows: {
    sm: "0 2px 8px rgba(0, 0, 0, 0.15)",
    md: "0 4px 16px rgba(0, 0, 0, 0.2)",
    lg: "0 8px 32px rgba(0, 0, 0, 0.25)",
    xl: "0 12px 48px rgba(0, 0, 0, 0.3)",
    primary: "0 4px 20px rgba(123, 142, 244, 0.3)",
    accent: "0 4px 20px rgba(102, 227, 196, 0.25)",
    glow: "0 0 40px rgba(123, 142, 244, 0.2)",
    inset: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
};

// Spacing Scale (consistent multipliers)
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius Scale
const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Typography Scale
const typographyTokens = {
  fontFamily: {
    body: "'Manrope', 'Inter', 'Helvetica', 'Arial', sans-serif",
    heading: "'Space Grotesk', 'Manrope', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    md: "1rem",       // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem",// 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem",    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.02em",
    wider: "0.05em",
    widest: "0.1em",
  },
};

// Animation Presets
const transitions = {
  fast: "all 0.15s ease",
  normal: "all 0.2s ease",
  slow: "all 0.3s ease",
  bounce: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
};

// Component Styles
const componentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      "*": {
        boxSizing: "border-box",
      },
      html: {
        scrollBehavior: "smooth",
      },
      body: {
        overflowX: "hidden",
      },
      "::-webkit-scrollbar": { 
        width: 8,
        height: 8,
      },
      "::-webkit-scrollbar-track": { 
        background: colors.bg.default,
        borderRadius: 4,
      },
      "::-webkit-scrollbar-thumb": { 
        background: colors.bg.hover,
        borderRadius: 4,
        border: `2px solid ${colors.bg.default}`,
      },
      "::selection": {
        background: alpha(colors.brand.primary, 0.3),
        color: colors.text.primary,
      },
    },
  },
  MuiButton: {
    defaultProps: { 
      disableElevation: true,
      disableRipple: false,
    },
    styleOverrides: {
      root: {
        borderRadius: radii.sm,
        padding: "10px 20px",
        fontWeight: typographyTokens.fontWeight.semibold,
        fontSize: typographyTokens.fontSize.sm,
        textTransform: "none" as const,
        transition: transitions.normal,
        position: "relative",
        overflow: "hidden",
      },
      containedPrimary: {
        background: colors.gradients.primary,
        boxShadow: colors.shadows.primary,
        "&:hover": {
          background: `linear-gradient(135deg, ${colors.brand.primaryLight} 0%, ${colors.brand.primary} 100%)`,
          boxShadow: `0 6px 24px ${alpha(colors.brand.primary, 0.4)}`,
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      },
      containedSecondary: {
        background: colors.gradients.accent,
        color: colors.text.inverse,
        boxShadow: colors.shadows.accent,
        "&:hover": {
          background: `linear-gradient(135deg, ${colors.brand.accentLight} 0%, ${colors.brand.accent} 100%)`,
        },
      },
      outlinedPrimary: {
        borderColor: alpha(colors.brand.primary, 0.5),
        borderWidth: 1.5,
        "&:hover": {
          borderColor: colors.brand.primary,
          borderWidth: 1.5,
          background: alpha(colors.brand.primary, 0.08),
        },
      },
      outlinedInherit: {
        borderColor: colors.border.light,
        "&:hover": {
          borderColor: colors.border.medium,
          background: alpha(colors.text.primary, 0.04),
        },
      },
      textPrimary: {
        "&:hover": {
          background: alpha(colors.brand.primary, 0.08),
        },
      },
      sizeLarge: {
        padding: "12px 28px",
        fontSize: typographyTokens.fontSize.md,
        borderRadius: radii.md,
      },
      sizeSmall: {
        padding: "6px 14px",
        fontSize: typographyTokens.fontSize.xs,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: radii.sm,
        transition: transitions.fast,
        "&:hover": {
          background: alpha(colors.text.primary, 0.08),
        },
      },
      colorPrimary: {
        "&:hover": {
          background: alpha(colors.brand.primary, 0.12),
        },
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundImage: "none",
        backgroundColor: colors.bg.paper,
        transition: transitions.normal,
      },
      outlined: {
        borderColor: colors.border.default,
        "&:hover": {
          borderColor: colors.border.light,
        },
      },
      elevation1: {
        boxShadow: colors.shadows.sm,
      },
      elevation2: {
        boxShadow: colors.shadows.md,
      },
      elevation3: {
        boxShadow: colors.shadows.lg,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: radii.lg,
        backgroundColor: colors.bg.card,
        border: `1px solid ${colors.border.default}`,
        transition: transitions.normal,
        "&:hover": {
          borderColor: colors.border.light,
          boxShadow: colors.shadows.md,
        },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: spacing.lg,
        "&:last-child": {
          paddingBottom: spacing.lg,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: typographyTokens.fontWeight.semibold,
        fontSize: typographyTokens.fontSize.xs,
        borderRadius: radii.sm,
        transition: transitions.fast,
      },
      colorPrimary: {
        background: alpha(colors.brand.primary, 0.16),
        color: colors.brand.primaryLight,
        "&:hover": {
          background: alpha(colors.brand.primary, 0.24),
        },
      },
      colorSuccess: {
        background: alpha(colors.status.success, 0.16),
        color: colors.status.successLight,
      },
      colorWarning: {
        background: alpha(colors.status.warning, 0.16),
        color: colors.status.warning,
      },
      colorError: {
        background: alpha(colors.status.error, 0.16),
        color: colors.status.errorLight,
      },
      colorInfo: {
        background: alpha(colors.status.info, 0.16),
        color: colors.status.infoLight,
      },
      outlined: {
        borderColor: colors.border.light,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 44,
      },
      indicator: {
        height: 3,
        borderRadius: "3px 3px 0 0",
        background: colors.gradients.primary,
      },
      flexContainer: {
        gap: spacing.xs,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none" as const,
        fontWeight: typographyTokens.fontWeight.semibold,
        fontSize: typographyTokens.fontSize.sm,
        minHeight: 44,
        padding: `${spacing.sm}px ${spacing.md}px`,
        borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
        transition: transitions.fast,
        "&:hover": {
          background: alpha(colors.text.primary, 0.04),
        },
        "&.Mui-selected": {
          color: colors.brand.primaryLight,
        },
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: "outlined",
      size: "small",
    },
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: radii.sm,
          backgroundColor: alpha(colors.bg.elevated, 0.5),
          transition: transitions.fast,
          "& fieldset": {
            borderColor: colors.border.default,
            borderWidth: 1,
            transition: transitions.fast,
          },
          "&:hover fieldset": {
            borderColor: colors.border.light,
          },
          "&.Mui-focused fieldset": {
            borderColor: colors.brand.primary,
            borderWidth: 2,
          },
          "&.Mui-focused": {
            backgroundColor: colors.bg.elevated,
            boxShadow: `0 0 0 3px ${alpha(colors.brand.primary, 0.15)}`,
          },
        },
        "& .MuiInputLabel-root": {
          color: colors.text.secondary,
          "&.Mui-focused": {
            color: colors.brand.primaryLight,
          },
        },
        "& .MuiInputBase-input": {
          fontSize: typographyTokens.fontSize.sm,
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: radii.sm,
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        height: 6,
        padding: "13px 0",
      },
      track: {
        border: "none",
        background: colors.gradients.primary,
      },
      rail: {
        backgroundColor: colors.bg.hover,
        opacity: 1,
      },
      thumb: {
        width: 16,
        height: 16,
        backgroundColor: colors.text.primary,
        border: `2px solid ${colors.brand.primary}`,
        boxShadow: colors.shadows.sm,
        "&:before": { 
          boxShadow: "none",
        },
        "&:hover, &.Mui-focusVisible": {
          boxShadow: `0 0 0 6px ${alpha(colors.brand.primary, 0.2)}`,
        },
        "&.Mui-active": {
          boxShadow: `0 0 0 8px ${alpha(colors.brand.primary, 0.3)}`,
        },
      },
      valueLabel: {
        backgroundColor: colors.bg.elevated,
        borderRadius: radii.xs,
        padding: "4px 8px",
        fontSize: typographyTokens.fontSize.xs,
        fontWeight: typographyTokens.fontWeight.semibold,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: radii.lg,
        border: `1px solid ${colors.border.default}`,
        backgroundColor: colors.bg.paper,
        backgroundImage: "none",
        boxShadow: colors.shadows.xl,
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: typographyTokens.fontSize.lg,
        fontWeight: typographyTokens.fontWeight.bold,
        fontFamily: typographyTokens.fontFamily.heading,
        padding: `${spacing.lg}px ${spacing.lg}px ${spacing.md}px`,
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: spacing.lg,
      },
      dividers: {
        borderColor: colors.border.default,
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: `${spacing.md}px ${spacing.lg}px ${spacing.lg}px`,
        gap: spacing.sm,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: colors.bg.elevated,
        color: colors.text.primary,
        fontSize: typographyTokens.fontSize.xs,
        fontWeight: typographyTokens.fontWeight.medium,
        padding: `${spacing.xs}px ${spacing.sm}px`,
        borderRadius: radii.xs,
        boxShadow: colors.shadows.md,
        border: `1px solid ${colors.border.default}`,
      },
      arrow: {
        color: colors.bg.elevated,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: radii.md,
        fontSize: typographyTokens.fontSize.sm,
        fontWeight: typographyTokens.fontWeight.medium,
      },
      filled: {
        boxShadow: colors.shadows.md,
      },
      filledSuccess: {
        background: colors.gradients.accent,
      },
      filledError: {
        background: colors.gradients.secondary,
      },
      standardSuccess: {
        backgroundColor: alpha(colors.status.success, 0.12),
        color: colors.status.successLight,
      },
      standardError: {
        backgroundColor: alpha(colors.status.error, 0.12),
        color: colors.status.errorLight,
      },
      standardWarning: {
        backgroundColor: alpha(colors.status.warning, 0.12),
        color: colors.status.warning,
      },
      standardInfo: {
        backgroundColor: alpha(colors.status.info, 0.12),
        color: colors.status.infoLight,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: colors.border.default,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        height: 6,
        borderRadius: radii.full,
        backgroundColor: alpha(colors.brand.primary, 0.16),
      },
      bar: {
        borderRadius: radii.full,
        background: colors.gradients.primary,
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: colors.brand.primary,
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: colors.bg.hover,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        backgroundColor: colors.bg.elevated,
        borderRadius: radii.md,
        border: `1px solid ${colors.border.default}`,
        boxShadow: colors.shadows.lg,
        marginTop: spacing.xs,
      },
      list: {
        padding: spacing.xs,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: radii.xs,
        margin: 2,
        padding: `${spacing.sm}px ${spacing.md}px`,
        fontSize: typographyTokens.fontSize.sm,
        transition: transitions.fast,
        "&:hover": {
          backgroundColor: alpha(colors.brand.primary, 0.08),
        },
        "&.Mui-selected": {
          backgroundColor: alpha(colors.brand.primary, 0.12),
          "&:hover": {
            backgroundColor: alpha(colors.brand.primary, 0.16),
          },
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: radii.sm,
        transition: transitions.fast,
        "&:hover": {
          backgroundColor: alpha(colors.brand.primary, 0.08),
        },
        "&.Mui-selected": {
          backgroundColor: alpha(colors.brand.primary, 0.12),
          borderLeft: `3px solid ${colors.brand.primary}`,
          "&:hover": {
            backgroundColor: alpha(colors.brand.primary, 0.16),
          },
        },
      },
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      root: {
        marginLeft: 0,
      },
      label: {
        fontSize: typographyTokens.fontSize.sm,
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        color: colors.border.light,
        borderRadius: radii.xs,
        "&.Mui-checked": {
          color: colors.brand.primary,
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        width: 44,
        height: 24,
        padding: 0,
      },
      switchBase: {
        padding: 2,
        "&.Mui-checked": {
          transform: "translateX(20px)",
          color: colors.text.primary,
          "& + .MuiSwitch-track": {
            backgroundColor: colors.brand.primary,
            opacity: 1,
          },
        },
      },
      thumb: {
        width: 20,
        height: 20,
        boxShadow: colors.shadows.sm,
      },
      track: {
        borderRadius: radii.full,
        backgroundColor: colors.bg.hover,
        opacity: 1,
      },
    },
  },
  MuiBreadcrumbs: {
    styleOverrides: {
      separator: {
        color: colors.text.muted,
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(colors.brand.primary, 0.2),
        color: colors.brand.primaryLight,
        fontWeight: typographyTokens.fontWeight.semibold,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: typographyTokens.fontWeight.bold,
        fontSize: typographyTokens.fontSize.xs,
      },
      colorPrimary: {
        background: colors.gradients.primary,
        boxShadow: `0 2px 8px ${alpha(colors.brand.primary, 0.4)}`,
      },
    },
  },
};

// Theme Configuration
const themeOptions: ThemeOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: colors.brand.primary,
      light: colors.brand.primaryLight,
      dark: colors.brand.primaryDark,
      contrastText: colors.text.primary,
    },
    secondary: {
      main: colors.brand.secondary,
      light: colors.brand.secondaryLight,
      dark: colors.brand.secondaryDark,
      contrastText: colors.text.inverse,
    },
    success: {
      main: colors.status.success,
      light: colors.status.successLight,
      dark: colors.status.successDark,
    },
    warning: {
      main: colors.status.warning,
      light: colors.status.warningLight,
      dark: colors.status.warningDark,
    },
    error: {
      main: colors.status.error,
      light: colors.status.errorLight,
      dark: colors.status.errorDark,
    },
    info: {
      main: colors.status.info,
      light: colors.status.infoLight,
      dark: colors.status.infoDark,
    },
    background: {
      default: colors.bg.default,
      paper: colors.bg.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.border.default,
  },
  shape: {
    borderRadius: radii.xs,
  },
  typography: {
    fontFamily: typographyTokens.fontFamily.body,
    h1: { 
      fontFamily: typographyTokens.fontFamily.heading,
      fontWeight: typographyTokens.fontWeight.extrabold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
    h2: { 
      fontFamily: typographyTokens.fontFamily.heading,
      fontWeight: typographyTokens.fontWeight.bold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
    h3: { 
      fontFamily: typographyTokens.fontFamily.heading,
      fontWeight: typographyTokens.fontWeight.bold,
    },
    h4: { 
      fontFamily: typographyTokens.fontFamily.heading,
      fontWeight: typographyTokens.fontWeight.semibold,
    },
    h5: { 
      fontFamily: typographyTokens.fontFamily.heading,
      fontWeight: typographyTokens.fontWeight.semibold,
    },
    h6: { 
      fontFamily: typographyTokens.fontFamily.heading,
      fontWeight: typographyTokens.fontWeight.semibold,
    },
    subtitle1: {
      fontWeight: typographyTokens.fontWeight.medium,
      lineHeight: typographyTokens.lineHeight.snug,
    },
    subtitle2: {
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: typographyTokens.lineHeight.snug,
    },
    body1: {
      lineHeight: typographyTokens.lineHeight.normal,
    },
    body2: {
      lineHeight: typographyTokens.lineHeight.normal,
      color: colors.text.secondary,
    },
    button: {
      fontWeight: typographyTokens.fontWeight.semibold,
      textTransform: "none" as const,
    },
    caption: {
      fontSize: typographyTokens.fontSize.xs,
      color: colors.text.secondary,
    },
    overline: {
      fontSize: typographyTokens.fontSize.xs,
      fontWeight: typographyTokens.fontWeight.semibold,
      letterSpacing: typographyTokens.letterSpacing.wider,
      textTransform: "uppercase" as const,
    },
  },
  components: componentOverrides,
};

const theme = createTheme(themeOptions);

// Export design tokens for use in styled components
export const designTokens = {
  colors,
  spacing,
  radii,
  typography: typographyTokens,
  transitions,
};

export default theme;
