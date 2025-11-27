/**
 * Admin Settings Page - System configuration
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Stack,
  Alert,
  Chip,
  alpha,
  useTheme,
  Skeleton,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Save,
  RefreshCw,
  Server,
  Mail,
  Shield,
  Database,
  Globe,
  Key,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import * as adminService from '../../services/adminService';
import { SystemSettings } from '../../types/admin';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  const theme = useTheme();
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      {children}
    </Paper>
  );
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local form state
  const [formData, setFormData] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    email_verification_required: false,
    max_file_size_mb: 500,
    allowed_file_types: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSystemSettings();
        setSettings(data);
        setFormData({
          maintenance_mode: data.maintenance_mode,
          registration_enabled: data.registration_enabled,
          email_verification_required: data.email_verification_required,
          max_file_size_mb: data.max_file_size_mb,
          allowed_file_types: data.allowed_file_types,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save settings would go here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated save
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} />
        </Box>
        {[1, 2, 3].map((i) => (
          <Paper key={i} sx={{ p: 3, mb: 3 }}>
            <Skeleton variant="rectangular" height={200} />
          </Paper>
        ))}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('admin.settings.title', 'System Settings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('admin.settings.subtitle', 'Configure system-wide settings and preferences')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save size={18} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* General Settings */}
      <SettingsSection
        title={t('admin.settings.general', 'General Settings')}
        description="Basic application settings"
        icon={<Server size={22} />}
      >
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.maintenance_mode}
                onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
                color="warning"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {t('admin.settings.maintenanceMode', 'Maintenance Mode')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When enabled, only admins can access the application
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', ml: 0 }}
          />
          
          <Divider />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.registration_enabled}
                onChange={(e) => setFormData({ ...formData, registration_enabled: e.target.checked })}
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {t('admin.settings.registration', 'User Registration')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Allow new users to register accounts
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', ml: 0 }}
          />
          
          <Divider />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.email_verification_required}
                onChange={(e) => setFormData({ ...formData, email_verification_required: e.target.checked })}
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {t('admin.settings.emailVerification', 'Email Verification')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require users to verify their email address
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', ml: 0 }}
          />
        </Stack>
      </SettingsSection>

      {/* Upload Settings */}
      <SettingsSection
        title={t('admin.settings.uploads', 'Upload Settings')}
        description="File upload limits and allowed formats"
        icon={<Database size={22} />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label={t('admin.settings.maxFileSize', 'Maximum File Size')}
              type="number"
              value={formData.max_file_size_mb}
              onChange={(e) => setFormData({ ...formData, max_file_size_mb: parseInt(e.target.value) })}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">MB</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('admin.settings.allowedFormats', 'Allowed File Formats')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formData.allowed_file_types.map((type) => (
                <Chip
                  key={type}
                  label={`.${type}`}
                  onDelete={() => {
                    setFormData({
                      ...formData,
                      allowed_file_types: formData.allowed_file_types.filter((t) => t !== type),
                    });
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </SettingsSection>

      {/* Subscription Plans */}
      <SettingsSection
        title={t('admin.settings.plans', 'Subscription Plans')}
        description="Configure pricing and limits for each plan"
        icon={<Shield size={22} />}
      >
        <Grid container spacing={3}>
          {settings?.plans && Object.entries(settings.plans).map(([plan, config]) => (
            <Grid item xs={12} sm={6} md={3} key={plan}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  textTransform="capitalize"
                  gutterBottom
                >
                  {plan}
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  ${config.price}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /mo
                  </Typography>
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {config.videos === -1 ? 'Unlimited' : config.videos} videos/month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max {config.max_length === -1 ? 'Unlimited' : `${config.max_length} min`} per video
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SettingsSection>

      {/* API Keys */}
      <SettingsSection
        title={t('admin.settings.apiKeys', 'API Keys')}
        description="External service integrations"
        icon={<Key size={22} />}
      >
        <Stack spacing={3}>
          <TextField
            label="Stripe Secret Key"
            type="password"
            placeholder="sk_live_..."
            fullWidth
            helperText="Used for payment processing"
          />
          <TextField
            label="OpenAI API Key"
            type="password"
            placeholder="sk-..."
            fullWidth
            helperText="Used for AI transcription (optional)"
          />
          <TextField
            label="SMTP Host"
            placeholder="smtp.example.com"
            fullWidth
            helperText="Email server for notifications"
          />
        </Stack>
      </SettingsSection>

      {/* Danger Zone */}
      <Paper
        sx={{
          p: 3,
          border: 2,
          borderColor: 'error.main',
          bgcolor: alpha(theme.palette.error.main, 0.02),
        }}
      >
        <Typography variant="h6" fontWeight={600} color="error.main" gutterBottom>
          {t('admin.settings.dangerZone', 'Danger Zone')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Irreversible actions that affect the entire system
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RefreshCw size={18} />}
          >
            {t('admin.settings.resetAllUsage', 'Reset All User Usage')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Database size={18} />}
          >
            {t('admin.settings.clearCache', 'Clear System Cache')}
          </Button>
        </Stack>
      </Paper>
    </AdminLayout>
  );
}
