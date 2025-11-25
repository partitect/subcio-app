import { createTheme } from "@mui/material/styles";

const palette = {
  mode: "dark" as const,
  primary: {
    main: "#7b8ef4",
    light: "#a2b0f8",
    dark: "#5466c1",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#f6a6b2",
    light: "#ffc3cc",
    dark: "#c37682",
    contrastText: "#1f2430",
  },
  background: {
    default: "#0f1118",
    paper: "#171b25",
  },
  text: {
    primary: "#e8ecf6",
    secondary: "#c0c6d9",
  },
  divider: "#2b3143",
  success: { main: "#72c59e" },
  warning: { main: "#f7c266" },
  error: { main: "#ef6f79" },
};

const typography = {
  fontFamily: '"Manrope", "Inter", system-ui, -apple-system, sans-serif',
  h1: { fontFamily: '"Space Grotesk", "Manrope", system-ui, sans-serif', fontWeight: 600, fontSize: "2rem" },
  h2: { fontFamily: '"Space Grotesk", "Manrope", system-ui, sans-serif', fontWeight: 600, fontSize: "1.6rem" },
  h3: { fontFamily: '"Space Grotesk", "Manrope", system-ui, sans-serif', fontWeight: 600, fontSize: "1.3rem" },
  button: { textTransform: "none", fontWeight: 600 },
};

const shape = { borderRadius: 4 };

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
    },
  },
};

export const theme = createTheme({
  palette,
  typography,
  shape,
  components,
});

export default theme;
