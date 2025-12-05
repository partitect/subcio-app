/**
 * Navbar Component
 * 
 * Top navigation bar with auth buttons and language selector
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAssetPath } from "../../utils/assetPath";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  alpha,
  useScrollTrigger,
  useTheme,
} from "@mui/material";
import { Menu as MenuIcon, X, Sparkles, Sun, Moon, Settings, LogOut, LayoutDashboard, CreditCard } from "lucide-react";
import { useTheme as useAppTheme } from "../../ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import LanguageSelector from "../LanguageSelector";

const NAV_LINKS = [
  { label: "nav.features", href: "/#features" },
  { label: "nav.pricing", href: "/pricing" },
  { label: "nav.docs", href: "/docs" },
  { label: "nav.blog", href: "/blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    setUserMenuAnchor(null);
    navigate("/");
  };

  const userName = user?.name || user?.email?.split("@")[0] || "User";

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
              spacing={1.5}
              alignItems="center"
              sx={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                component="img"
                src={getAssetPath('assets/images/subcio-logo.png')}
                alt="Subcio"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                }}
              />
              <Typography variant="h6" fontWeight={800}>
                Subcio
              </Typography>
            </Stack>

            {/* Desktop Nav Links */}
            <Stack
              direction="row"
              spacing={0.5}
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
                    minWidth: 100,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  {t(link.label)}
                </Button>
              ))}
            </Stack>

            <Box sx={{ flex: 1 }} />

            {/* Desktop Auth Buttons */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ 
                display: { xs: "none", md: "flex" },
                minWidth: 320,
                justifyContent: "flex-end",
              }}
            >
              <LanguageSelector variant="full" size="small" />
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              
              {isAuthenticated ? (
                <>
                  <Button
                    component={Link}
                    to="/dashboard"
                    sx={{
                      color: "text.primary",
                      fontWeight: 600,
                      minWidth: 100,
                    }}
                  >
                    {t('nav.dashboard')}
                  </Button>
                  <IconButton 
                    size="small"
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.primary.main,
                        fontSize: 14,
                      }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    sx={{
                      color: "text.primary",
                      fontWeight: 600,
                      minWidth: 80,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2.5,
                      minWidth: 140,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t('nav.startFree')}
                  </Button>
                </>
              )}
            </Stack>

            {/* User Menu */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                sx: { minWidth: 200, mt: 1 }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} to="/dashboard" onClick={() => setUserMenuAnchor(null)}>
                <LayoutDashboard size={16} style={{ marginRight: 8 }} />
                {t('nav.dashboard')}
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={() => setUserMenuAnchor(null)}>
                <Settings size={16} style={{ marginRight: 8 }} />
                {t('nav.settings')}
              </MenuItem>
              <MenuItem component={Link} to="/pricing" onClick={() => setUserMenuAnchor(null)}>
                <CreditCard size={16} style={{ marginRight: 8 }} />
                {t('nav.upgradePlan')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                <LogOut size={16} style={{ marginRight: 8 }} />
                {t('nav.logout')}
              </MenuItem>
            </Menu>

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
                <MenuIcon size={24} />
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
              {t('nav.menu')}
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
                  primary={t(link.label)}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ px: 2, py: 1 }}>
          <LanguageSelector variant="full" />
        </Box>
        <Box sx={{ p: 2, mt: "auto" }}>
          <Stack spacing={1.5}>
            {isAuthenticated ? (
              <>
                <Button
                  component={Link}
                  to="/dashboard"
                  variant="contained"
                  fullWidth
                  sx={{ fontWeight: 600 }}
                  onClick={handleDrawerToggle}
                >
                  {t('nav.dashboard')}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ fontWeight: 600, color: "error.main", borderColor: "error.main" }}
                  onClick={() => {
                    handleLogout();
                    handleDrawerToggle();
                  }}
                >
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  fullWidth
                  sx={{ fontWeight: 600 }}
                  onClick={handleDrawerToggle}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  fullWidth
                  sx={{ fontWeight: 600 }}
                  onClick={handleDrawerToggle}
                >
                  {t('nav.startFree')}
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  );
}

export default Navbar;
