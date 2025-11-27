/**
 * Settings Page
 * 
 * User profile settings, account management, preferences
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Switch,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Chip,
  alpha,
  useTheme,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  Palette,
  CreditCard,
  Shield,
  Trash2,
  LogOut,
  Camera,
  Check,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Clock,
  Download,
  History,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme as useAppTheme } from "../ThemeContext";
import { changePassword, getUsageStats, UsageStats } from "../services/authService";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout, updateProfile, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Usage stats
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
    fetchUsageStats();
  }, [user]);

  const fetchUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error("Failed to load usage stats", err);
    }
  };

  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      await updateProfile({ name, email });
      setProfileSuccess(true);
      setSnackbar({ open: true, message: t('settings.profile.updateSuccess'), severity: "success" });
    } catch (err: any) {
      setProfileError(err.message || t('settings.profile.updateError'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(t('settings.security.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.security.passwordMismatch'));
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSnackbar({ open: true, message: t('settings.security.passwordChanged'), severity: "success" });
    } catch (err: any) {
      setPasswordError(err.message || t('settings.security.passwordError'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      return;
    }
    // TODO: Implement account deletion API
    setSnackbar({ open: true, message: "Account deletion is not yet implemented", severity: "error" });
    setDeleteDialogOpen(false);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('pycaps_language', lang);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return theme.palette.warning.main;
      case 'creator': return theme.palette.secondary.main;
      case 'starter': return theme.palette.primary.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('settings.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('settings.subtitle')}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
          {/* Sidebar */}
          <Paper
            elevation={0}
            sx={{
              width: { xs: "100%", md: 280 },
              flexShrink: 0,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: "hidden",
            }}
          >
            {/* User Card */}
            <Box sx={{ p: 3, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Avatar
                src={user?.avatar_url || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  fontSize: "1.5rem",
                  bgcolor: theme.palette.primary.main,
                }}
              >
                {getInitials(user?.name)}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {user?.name || t('settings.profile.unnamed')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip
                label={user?.plan?.toUpperCase() || "FREE"}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: alpha(getPlanColor(user?.plan || "free"), 0.1),
                  color: getPlanColor(user?.plan || "free"),
                  fontWeight: 600,
                }}
              />
              {user?.oauth_provider && (
                <Chip
                  label={`via ${user.oauth_provider}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1, ml: 1 }}
                />
              )}
            </Box>

            <Divider />

            {/* Navigation */}
            <List sx={{ p: 1 }}>
              <ListItemButton
                selected={activeTab === 0}
                onClick={() => setActiveTab(0)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon><User size={20} /></ListItemIcon>
                <ListItemText primary={t('settings.tabs.profile')} />
              </ListItemButton>
              <ListItemButton
                selected={activeTab === 1}
                onClick={() => setActiveTab(1)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon><Lock size={20} /></ListItemIcon>
                <ListItemText primary={t('settings.tabs.security')} />
              </ListItemButton>
              <ListItemButton
                selected={activeTab === 2}
                onClick={() => setActiveTab(2)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon><Palette size={20} /></ListItemIcon>
                <ListItemText primary={t('settings.tabs.preferences')} />
              </ListItemButton>
              <ListItemButton
                selected={activeTab === 3}
                onClick={() => setActiveTab(3)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon><CreditCard size={20} /></ListItemIcon>
                <ListItemText primary={t('settings.tabs.billing')} />
              </ListItemButton>
              <ListItemButton
                selected={activeTab === 4}
                onClick={() => setActiveTab(4)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon><History size={20} /></ListItemIcon>
                <ListItemText primary={t('settings.tabs.usage')} />
              </ListItemButton>
            </List>

            <Divider />

            {/* Logout */}
            <List sx={{ p: 1 }}>
              <ListItemButton
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                sx={{
                  borderRadius: 2,
                  color: theme.palette.error.main,
                  "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
                }}
              >
                <ListItemIcon><LogOut size={20} color={theme.palette.error.main} /></ListItemIcon>
                <ListItemText primary={t('nav.logout')} />
              </ListItemButton>
            </List>
          </Paper>

          {/* Content */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: 3,
            }}
          >
            {/* Profile Tab */}
            <TabPanel value={activeTab} index={0}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.profile.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('settings.profile.description')}
              </Typography>

              {profileError && (
                <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label={t('settings.profile.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={18} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={t('settings.profile.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={18} />
                      </InputAdornment>
                    ),
                  }}
                  helperText={user?.is_verified ? t('settings.profile.emailVerified') : t('settings.profile.emailNotVerified')}
                />

                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    disabled={profileLoading}
                    startIcon={profileLoading ? <CircularProgress size={18} /> : <Check size={18} />}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    }}
                  >
                    {t('settings.profile.save')}
                  </Button>
                </Box>
              </Box>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={activeTab} index={1}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.security.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('settings.security.description')}
              </Typography>

              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>
              )}
              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>{t('settings.security.passwordChanged')}</Alert>
              )}

              {user?.oauth_provider && !user?.password_hash ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('settings.security.oauthNoPassword', { provider: user.oauth_provider })}
                </Alert>
              ) : null}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {!user?.oauth_provider && (
                  <TextField
                    label={t('settings.security.currentPassword')}
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                            size="small"
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                <TextField
                  label={t('settings.security.newPassword')}
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={t('settings.security.passwordHint')}
                />
                <TextField
                  label={t('settings.security.confirmPassword')}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !newPassword || !confirmPassword}
                    startIcon={passwordLoading ? <CircularProgress size={18} /> : <Check size={18} />}
                  >
                    {t('settings.security.changePassword')}
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Danger Zone */}
              <Typography variant="h6" fontWeight={600} color="error" gutterBottom>
                {t('settings.security.dangerZone')}
              </Typography>
              <Paper
                sx={{
                  p: 3,
                  mt: 2,
                  border: `1px solid ${theme.palette.error.main}`,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography fontWeight={600}>{t('settings.security.deleteAccount')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.security.deleteAccountDesc')}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 size={18} />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    {t('settings.security.deleteButton')}
                  </Button>
                </Box>
              </Paper>
            </TabPanel>

            {/* Preferences Tab */}
            <TabPanel value={activeTab} index={2}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.preferences.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('settings.preferences.description')}
              </Typography>

              <List>
                {/* Theme */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <Palette size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('settings.preferences.theme')}
                    secondary={isDark ? t('settings.preferences.dark') : t('settings.preferences.light')}
                  />
                  <Switch
                    checked={isDark}
                    onChange={toggleTheme}
                    color="primary"
                  />
                </ListItem>

                {/* Language */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <Globe size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('settings.preferences.language')}
                    secondary={languages.find(l => l.code === i18n.language)?.name || 'English'}
                  />
                </ListItem>
                <Box sx={{ display: "flex", gap: 1, ml: 7, mb: 2 }}>
                  {languages.map((lang) => (
                    <Chip
                      key={lang.code}
                      label={`${lang.flag} ${lang.name}`}
                      onClick={() => handleLanguageChange(lang.code)}
                      variant={i18n.language === lang.code ? "filled" : "outlined"}
                      color={i18n.language === lang.code ? "primary" : "default"}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>

                {/* Notifications */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <Bell size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('settings.preferences.notifications')}
                    secondary={t('settings.preferences.notificationsDesc')}
                  />
                  <Switch defaultChecked color="primary" />
                </ListItem>
              </List>
            </TabPanel>

            {/* Billing Tab */}
            <TabPanel value={activeTab} index={3}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.billing.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('settings.billing.description')}
              </Typography>

              {/* Current Plan */}
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      {t('settings.billing.currentPlan')}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {user?.plan?.toUpperCase() || "FREE"}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/pricing")}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    }}
                  >
                    {t('settings.billing.upgrade')}
                  </Button>
                </Box>
              </Paper>

              {/* Plan Features */}
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('settings.billing.features')}
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><Clock size={18} /></ListItemIcon>
                  <ListItemText
                    primary={`${usageStats?.usage?.minutes_limit || 30} ${t('settings.billing.minutesPerMonth')}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Download size={18} /></ListItemIcon>
                  <ListItemText
                    primary={`${usageStats?.usage?.exports_limit || 10} ${t('settings.billing.exportsPerMonth')}`}
                  />
                </ListItem>
              </List>
            </TabPanel>

            {/* Usage Tab */}
            <TabPanel value={activeTab} index={4}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.usage.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('settings.usage.description')}
              </Typography>

              {usageStats && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Minutes Usage */}
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography fontWeight={600}>{t('settings.usage.minutes')}</Typography>
                      <Typography color="text.secondary">
                        {usageStats.usage.minutes_used.toFixed(1)} / {usageStats.usage.minutes_limit} min
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (usageStats.usage.minutes_used / usageStats.usage.minutes_limit) * 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      {usageStats.usage.minutes_remaining.toFixed(1)} {t('settings.usage.remaining')}
                    </Typography>
                  </Paper>

                  {/* Exports Usage */}
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography fontWeight={600}>{t('settings.usage.exports')}</Typography>
                      <Typography color="text.secondary">
                        {usageStats.usage.exports_used} / {usageStats.usage.exports_limit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (usageStats.usage.exports_used / usageStats.usage.exports_limit) * 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      {usageStats.usage.exports_remaining} {t('settings.usage.remaining')}
                    </Typography>
                  </Paper>

                  {/* Storage Usage */}
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography fontWeight={600}>{t('settings.usage.storage')}</Typography>
                      <Typography color="text.secondary">
                        {usageStats.usage.storage_used_mb.toFixed(1)} / {usageStats.usage.storage_limit_mb} MB
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (usageStats.usage.storage_used_mb / usageStats.usage.storage_limit_mb) * 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      {usageStats.usage.storage_remaining_mb.toFixed(1)} MB {t('settings.usage.remaining')}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Box>
      </Container>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: "error.main" }}>
          {t('settings.security.deleteAccount')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t('settings.security.deleteWarning')}
          </DialogContentText>
          <TextField
            fullWidth
            label={t('settings.security.typeDelete')}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== "DELETE"}
          >
            {t('settings.security.deleteButton')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
