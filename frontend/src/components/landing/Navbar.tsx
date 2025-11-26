/**
 * Navbar Component
 * 
 * Top navigation bar with auth buttons
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  alpha,
  useScrollTrigger,
  useTheme,
} from "@mui/material";
import { Menu, X, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme as useAppTheme } from "../../ThemeContext";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const location = useLocation();

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: trigger
            ? alpha(theme.palette.background.default, 0.8)
            : "transparent",
          backdropFilter: trigger ? "blur(20px)" : "none",
          borderBottom: trigger
            ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
            : "none",
          transition: "all 0.3s ease",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0 }, py: 1 }}>
            {/* Logo */}
            <Stack
              component={Link}
              to="/"
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} color="white" />
              </Box>
              <Typography variant="h6" fontWeight={800}>
                PyCaps
              </Typography>
            </Stack>

            {/* Desktop Nav Links */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                ml: 6,
                display: { xs: "none", md: "flex" },
              }}
            >
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.label}
                  component={Link}
                  to={link.href}
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    px: 2,
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>

            <Box sx={{ flex: 1 }} />

            {/* Desktop Auth Buttons */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <Button
                component={Link}
                to="/login"
                sx={{
                  color: "text.primary",
                  fontWeight: 600,
                }}
              >
                Log in
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                }}
              >
                Start Free
              </Button>
            </Stack>

            {/* Mobile Menu Button */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "flex", md: "none" } }}
            >
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <IconButton
                onClick={handleDrawerToggle}
                sx={{ color: "text.primary" }}
              >
                <Menu size={24} />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: "background.paper",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Menu
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton
                component={Link}
                to={link.href}
                onClick={handleDrawerToggle}
              >
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 2, mt: "auto" }}>
          <Stack spacing={1.5}>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              fullWidth
              sx={{ fontWeight: 600 }}
              onClick={handleDrawerToggle}
            >
              Log in
            </Button>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              fullWidth
              sx={{ fontWeight: 600 }}
              onClick={handleDrawerToggle}
            >
              Start Free
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  );
}

export default Navbar;
