import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, alpha, ThemeOptions } from '@mui/material';
import { designTokens } from './theme';

// Theme mode type
export type ThemeMode = 'light' | 'dark';

// Context type
interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key
const THEME_STORAGE_KEY = 'pycaps-theme-mode';

// Get initial theme from localStorage or system preference
const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }
  return 'dark';
};

// Light mode colors
const lightColors = {
  brand: {
    primary: "#6366f1",
    primaryLight: "#818cf8",
    primaryDark: "#4f46e5",
    secondary: "#ec4899",
    secondaryLight: "#f472b6",
    secondaryDark: "#db2777",
    accent: "#10b981",
    accentLight: "#34d399",
    accentDark: "#059669",
  },
  status: {
    success: "#22c55e",
    successLight: "#4ade80",
    successDark: "#16a34a",
    warning: "#f59e0b",
    warningLight: "#fbbf24",
    warningDark: "#d97706",
    error: "#ef4444",
    errorLight: "#f87171",
    errorDark: "#dc2626",
    info: "#3b82f6",
    infoLight: "#60a5fa",
    infoDark: "#2563eb",
  },
  bg: {
    default: "#f8fafc",
    paper: "#ffffff",
    elevated: "#f1f5f9",
    card: "#ffffff",
    hover: "#e2e8f0",
    active: "#cbd5e1",
    overlay: "rgba(248, 250, 252, 0.9)",
    glass: "rgba(255, 255, 255, 0.8)",
  },
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    tertiary: "#64748b",
    disabled: "#94a3b8",
    muted: "#64748b",
    inverse: "#ffffff",
  },
  border: {
    default: "rgba(0, 0, 0, 0.08)",
    light: "rgba(0, 0, 0, 0.12)",
    medium: "rgba(0, 0, 0, 0.16)",
    focus: "rgba(99, 102, 241, 0.5)",
  },
  gradients: {
    primary: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    secondary: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    accent: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    dark: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
    glass: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.03) 100%)",
    hero: "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08), transparent 30%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.06), transparent 28%), radial-gradient(circle at 70% 80%, rgba(16,185,129,0.05), transparent 25%)",
    mesh: "radial-gradient(at 40% 20%, rgba(99,102,241,0.1) 0px, transparent 50%), radial-gradient(at 80% 60%, rgba(236,72,153,0.08) 0px, transparent 50%), radial-gradient(at 20% 80%, rgba(16,185,129,0.06) 0px, transparent 50%)",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    primary: "0 4px 14px rgba(99, 102, 241, 0.25)",
    accent: "0 4px 14px rgba(16, 185, 129, 0.2)",
    glow: "0 0 30px rgba(99, 102, 241, 0.15)",
    inset: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
  },
};

// Create theme based on mode
const createAppTheme = (mode: ThemeMode) => {
  const colors = mode === 'dark' ? designTokens.colors : lightColors;
  const { radii, typography: typographyTokens, transitions } = designTokens;

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: colors.brand.primary,
        light: colors.brand.primaryLight,
        dark: colors.brand.primaryDark,
        contrastText: mode === 'dark' ? colors.text.primary : '#ffffff',
      },
      secondary: {
        main: colors.brand.secondary,
        light: colors.brand.secondaryLight,
        dark: colors.brand.secondaryDark,
        contrastText: mode === 'dark' ? colors.text.inverse : '#ffffff',
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
    components: {
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
            transition: "background-color 0.3s ease, color 0.3s ease",
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
        },
        styleOverrides: {
          root: {
            borderRadius: radii.sm,
            padding: "10px 20px",
            fontWeight: typographyTokens.fontWeight.semibold,
            fontSize: typographyTokens.fontSize.sm,
            textTransform: "none" as const,
            transition: transitions.normal,
          },
          containedPrimary: {
            background: colors.gradients.primary,
            boxShadow: colors.shadows.primary,
            "&:hover": {
              boxShadow: `0 6px 24px ${alpha(colors.brand.primary, 0.4)}`,
              transform: "translateY(-1px)",
            },
          },
          outlinedPrimary: {
            borderColor: alpha(colors.brand.primary, 0.5),
            "&:hover": {
              borderColor: colors.brand.primary,
              background: alpha(colors.brand.primary, 0.08),
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
            transition: "background-color 0.3s ease, border-color 0.3s ease",
          },
          outlined: {
            borderColor: colors.border.default,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radii.lg,
            backgroundColor: colors.bg.card,
            border: `1px solid ${colors.border.default}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: radii.sm,
              backgroundColor: alpha(colors.bg.elevated, 0.5),
              "& fieldset": {
                borderColor: colors.border.default,
              },
              "&:hover fieldset": {
                borderColor: colors.border.light,
              },
              "&.Mui-focused fieldset": {
                borderColor: colors.brand.primary,
              },
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            height: 6,
          },
          track: {
            background: colors.gradients.primary,
          },
          rail: {
            backgroundColor: colors.bg.hover,
          },
          thumb: {
            backgroundColor: mode === 'dark' ? '#ffffff' : colors.brand.primary,
            border: `2px solid ${colors.brand.primary}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: typographyTokens.fontWeight.semibold,
          },
          colorPrimary: {
            background: alpha(colors.brand.primary, 0.16),
            color: mode === 'dark' ? colors.brand.primaryLight : colors.brand.primary,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: colors.gradients.primary,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: typographyTokens.fontWeight.semibold,
            "&.Mui-selected": {
              color: colors.brand.primary,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radii.lg,
            border: `1px solid ${colors.border.default}`,
            backgroundColor: colors.bg.paper,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: colors.bg.elevated,
            color: colors.text.primary,
            border: `1px solid ${colors.border.default}`,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            "&.Mui-checked": {
              color: '#ffffff',
              "& + .MuiSwitch-track": {
                backgroundColor: colors.brand.primary,
              },
            },
          },
          track: {
            backgroundColor: colors.bg.hover,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.sm,
            "&:hover": {
              background: alpha(colors.text.primary, 0.08),
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: alpha(colors.brand.primary, 0.08),
            },
            "&.Mui-selected": {
              backgroundColor: alpha(colors.brand.primary, 0.12),
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Theme Provider Component
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      // Only update if user hasn't manually set a preference
      if (!stored) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save to localStorage when mode changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    // Update document class for potential CSS usage
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      isDark: mode === 'dark',
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export light colors for components that need them directly
export { lightColors };
