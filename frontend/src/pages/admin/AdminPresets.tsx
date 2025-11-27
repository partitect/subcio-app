import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Alert,
  Snackbar,
  MenuItem,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CameraAlt as ScreenshotIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ContentCopy as DuplicateIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { StyleConfig } from '../../types';
import { TouchSlider } from '../../components/ui/TouchSlider';
import { assToHex, styleToAssColors } from '../../utils/colorConvert';
import AdminLayout from '../../components/admin/AdminLayout';
import PresetPreview from '../../components/admin/PresetPreview';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

interface Preset extends StyleConfig {
  label?: string;
  category?: string;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

const PRESET_CATEGORIES = [
  'all',
  'tiktok',
  'karaoke',
  'fire',
  'neon',
  'glitch',
  'nature',
  'cinema',
  'horror',
  'bounce',
  'text',
];

export default function AdminPresets() {
  const { t } = useTranslation();
  
  // State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [saving, setSaving] = useState(false);
  const [screenshotting, setScreenshotting] = useState<string | null>(null);
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const previewRef = useRef<HTMLDivElement>(null);

  // Load presets and fonts
  useEffect(() => {
    loadPresets();
    loadFonts();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/presets`);
      setPresets(data || []);
    } catch (err) {
      console.error('Failed to load presets', err);
      setToast({ open: true, message: t('admin.presets.loadError'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadFonts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/fonts`);
      if (Array.isArray(data?.fonts)) {
        const parsed = data.fonts.map((f: any) =>
          typeof f === 'string' ? { name: f, file: `${f}.ttf` } : { name: f.name, file: f.file }
        );
        setFontOptions(parsed);
      }
    } catch (err) {
      console.error('Failed to load fonts', err);
    }
  };

  // Filter presets
  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      !searchQuery ||
      preset.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.label?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleEdit = (preset: Preset) => {
    setEditingPreset({
      ...preset,
      primary_color: assToHex(preset.primary_color as string),
      secondary_color: assToHex(preset.secondary_color as string),
      outline_color: assToHex(preset.outline_color as string),
      shadow_color: assToHex(preset.shadow_color as string),
      back_color: assToHex((preset as any).back_color as string),
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (preset: Preset) => {
    setSelectedPreset(preset);
    setDeleteDialogOpen(true);
  };

  const handlePreview = (preset: Preset) => {
    setSelectedPreset(preset);
    setPreviewDialogOpen(true);
  };

  const handleDuplicate = async (preset: Preset) => {
    const newPreset: Preset = {
      ...preset,
      id: `${preset.id}_copy_${Date.now()}`,
      label: `${preset.label || preset.id} (Copy)`,
    };
    
    try {
      await axios.post(`${API_BASE}/presets/create`, styleToAssColors(newPreset));
      setToast({ open: true, message: t('admin.presets.duplicated'), severity: 'success' });
      loadPresets();
    } catch (err) {
      console.error('Failed to duplicate preset', err);
      setToast({ open: true, message: t('admin.presets.duplicateError'), severity: 'error' });
    }
  };

  const handleSavePreset = async () => {
    if (!editingPreset) return;
    
    setSaving(true);
    try {
      const payload = styleToAssColors(editingPreset);
      
      if (presets.find(p => p.id === editingPreset.id)) {
        await axios.post(`${API_BASE}/presets/update`, payload);
      } else {
        await axios.post(`${API_BASE}/presets/create`, payload);
      }
      
      setToast({ open: true, message: t('admin.presets.saved'), severity: 'success' });
      setEditDialogOpen(false);
      loadPresets();
    } catch (err: any) {
      console.error('Failed to save preset', err);
      const msg = err?.response?.data?.detail || t('admin.presets.saveError');
      setToast({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPreset) return;
    
    try {
      await axios.delete(`${API_BASE}/presets/${selectedPreset.id}`);
      setToast({ open: true, message: t('admin.presets.deleted'), severity: 'success' });
      setDeleteDialogOpen(false);
      loadPresets();
    } catch (err) {
      console.error('Failed to delete preset', err);
      setToast({ open: true, message: t('admin.presets.deleteError'), severity: 'error' });
    }
  };

  const handleTakeScreenshot = async (presetId: string) => {
    setScreenshotting(presetId);
    try {
      // Call backend to generate screenshot
      await axios.post(`${API_BASE}/presets/${presetId}/screenshot`);
      setToast({ open: true, message: t('admin.presets.screenshotTaken'), severity: 'success' });
      loadPresets();
    } catch (err) {
      console.error('Failed to take screenshot', err);
      setToast({ open: true, message: t('admin.presets.screenshotError'), severity: 'error' });
    } finally {
      setScreenshotting(null);
    }
  };

  const handleCreateNew = () => {
    setEditingPreset({
      id: `preset_${Date.now()}`,
      label: 'New Preset',
      font: fontOptions[0]?.name || 'Arial',
      font_size: 56,
      primary_color: '#ffffff',
      secondary_color: '#00ffff',
      outline_color: '#000000',
      shadow_color: '#000000',
      back_color: '#00000000',
      bold: 0,
      italic: 0,
      border: 2,
      shadow: 2,
      blur: 0,
      alignment: 5,
      margin_v: 0,
      margin_l: 10,
      margin_r: 10,
      category: 'text',
    });
    setEditDialogOpen(true);
  };

  const updateEditingPreset = (updates: Partial<Preset>) => {
    if (!editingPreset) return;
    setEditingPreset({ ...editingPreset, ...updates });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {t('admin.presets.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.presets.subtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPresets}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            {t('admin.presets.addNew')}
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('admin.presets.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PRESET_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={t(`editor.preset.category.${cat}`)}
                  onClick={() => setSelectedCategory(cat)}
                  color={selectedCategory === cat ? 'primary' : 'default'}
                  variant={selectedCategory === cat ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('admin.presets.found', { count: filteredPresets.length })}
        </Typography>
      </Box>

      {/* Presets Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredPresets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('admin.presets.noPresets')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredPresets.map((preset) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={preset.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: 'grey.900',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* CSS Preview */}
                  <Typography
                    sx={{
                      fontFamily: preset.font || 'Arial',
                      fontSize: Math.min((preset.font_size || 56) * 0.5, 36),
                      color: assToHex(preset.primary_color as string) || '#fff',
                      textShadow: `${(preset.shadow || 0) * 0.5}px ${(preset.shadow || 0) * 0.5}px ${(preset.shadow_blur || 0) * 0.5}px ${assToHex(preset.shadow_color as string) || '#000'}`,
                      WebkitTextStroke: `${Math.min((preset.border || 0), 3)}px ${assToHex(preset.outline_color as string) || '#000'}`,
                      fontWeight: preset.bold ? 'bold' : 'normal',
                      fontStyle: preset.italic ? 'italic' : 'normal',
                      textAlign: 'center',
                      px: 1,
                    }}
                  >
                    Subcio
                  </Typography>
                  
                  {/* Screenshot button overlay */}
                  <IconButton
                    size="small"
                    onClick={() => handleTakeScreenshot(preset.id!)}
                    disabled={screenshotting === preset.id}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      zIndex: 10,
                    }}
                  >
                    {screenshotting === preset.id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <ScreenshotIcon fontSize="small" />
                    )}
                  </IconButton>
                </CardMedia>
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium" noWrap>
                    {preset.label || preset.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    ID: {preset.id}
                  </Typography>
                  
                  {/* Style Info */}
                  <Stack spacing={0.5} sx={{ mb: 1 }}>
                    {/* Font */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                        Font:
                      </Typography>
                      <Typography variant="caption" noWrap sx={{ fontFamily: preset.font || 'Arial' }}>
                        {preset.font || 'Arial'} ({preset.font_size || 56}px)
                      </Typography>
                    </Stack>
                    
                    {/* Colors */}
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                        Colors:
                      </Typography>
                      <Tooltip title="Primary">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 0.5,
                            bgcolor: assToHex(preset.primary_color as string) || '#fff',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Secondary">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 0.5,
                            bgcolor: assToHex(preset.secondary_color as string) || '#0ff',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Outline">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 0.5,
                            bgcolor: assToHex(preset.outline_color as string) || '#000',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Shadow">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 0.5,
                            bgcolor: assToHex(preset.shadow_color as string) || '#000',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      </Tooltip>
                    </Stack>
                    
                    {/* Effects */}
                    <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                      {preset.bold === 1 && (
                        <Chip label="Bold" size="small" sx={{ height: 18, fontSize: 10 }} />
                      )}
                      {(preset.border ?? 0) > 0 && (
                        <Chip label={`Border: ${preset.border}`} size="small" sx={{ height: 18, fontSize: 10 }} />
                      )}
                      {(preset.shadow ?? 0) > 0 && (
                        <Chip label={`Shadow: ${preset.shadow}`} size="small" sx={{ height: 18, fontSize: 10 }} />
                      )}
                      {preset.effect_type && (
                        <Chip 
                          label={preset.effect_type} 
                          size="small" 
                          color="primary"
                          sx={{ height: 18, fontSize: 10 }} 
                        />
                      )}
                    </Stack>
                  </Stack>
                  
                  {preset.category && (
                    <Chip
                      label={t(`editor.preset.category.${preset.category}`)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={t('admin.presets.preview')}>
                      <IconButton size="small" onClick={() => handlePreview(preset)}>
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.presets.duplicate')}>
                      <IconButton size="small" onClick={() => handleDuplicate(preset)}>
                        <DuplicateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(preset)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => handleDelete(preset)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPreset && presets.find(p => p.id === editingPreset.id)
            ? t('admin.presets.editPreset')
            : t('admin.presets.createPreset')}
        </DialogTitle>
        <DialogContent dividers>
          {editingPreset && (
                <Grid container spacing={3}>
                  {/* Left: Live Preview (8) */}
                  <Grid item xs={12} md={8}>
                    <Box
                      sx={{
                        height: 320,
                        bgcolor: 'grey.900',
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 1,
                      }}
                    >
                      <PresetPreview preset={editingPreset} height={320} />
                    </Box>
                  </Grid>

                  {/* Right: Basic Info + Font Settings (4) */}
                  <Grid item xs={12} md={4}>
                    <Stack spacing={2}>
                      <TextField
                        label={t('admin.presets.presetId')}
                        fullWidth
                        size="small"
                        value={editingPreset.id || ''}
                        onChange={(e) => updateEditingPreset({ id: e.target.value })}
                        disabled={!!presets.find(p => p.id === editingPreset.id)}
                      />
                      <TextField
                        label={t('admin.presets.presetLabel')}
                        fullWidth
                        size="small"
                        value={editingPreset.label || ''}
                        onChange={(e) => updateEditingPreset({ label: e.target.value })}
                      />
                      <TextField
                        select
                        label={t('admin.presets.category')}
                        fullWidth
                        size="small"
                        value={editingPreset.category || 'text'}
                        onChange={(e) => updateEditingPreset({ category: e.target.value })}
                      >
                        {PRESET_CATEGORIES.filter(c => c !== 'all').map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {t(`editor.preset.category.${cat}`)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        select
                        label={t('editor.style.font')}
                        fullWidth
                        size="small"
                        value={editingPreset.font || ''}
                        onChange={(e) => updateEditingPreset({ font: e.target.value })}
                      >
                        {fontOptions.map((f) => (
                          <MenuItem key={f.name} value={f.name}>
                            {f.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TouchSlider
                        label={t('editor.style.fontSize')}
                        min={12}
                        max={300}
                        value={editingPreset.font_size || 56}
                        onChange={(val) => updateEditingPreset({ font_size: val })}
                        valueSuffix="px"
                      />
                      <TextField
                        select
                        label={t('editor.style.fontWeight')}
                        fullWidth
                        size="small"
                        value={editingPreset.bold ? 1 : 0}
                        onChange={(e) => updateEditingPreset({ bold: Number(e.target.value) })}
                      >
                        <MenuItem value={0}>{t('editor.style.regular')}</MenuItem>
                        <MenuItem value={1}>{t('editor.style.bold')}</MenuItem>
                      </TextField>
                    </Stack>
                  </Grid>

                  {/* Colors */}
                  <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {t('admin.presets.colors')}
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { key: 'primary_color', label: 'primary' },
                    { key: 'secondary_color', label: 'secondary' },
                    { key: 'outline_color', label: 'outline' },
                    { key: 'shadow_color', label: 'shadow' },
                    { key: 'back_color', label: 'background' },
                  ].map((c) => (
                    <Grid item xs={6} sm={4} md={2.4} key={c.key}>
                      <TextField
                        label={t(`editor.style.colors.${c.label}`)}
                        type="color"
                        fullWidth
                        size="small"
                        value={(editingPreset as any)[c.key] || '#000000'}
                        onChange={(e) => updateEditingPreset({ [c.key]: e.target.value })}
                        InputProps={{ sx: { height: 48, p: 0.5 } }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Effects */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <TouchSlider
                    label={t('editor.style.border')}
                    min={0}
                    max={8}
                    value={editingPreset.border || 0}
                    onChange={(val) => updateEditingPreset({ border: val })}
                  />
                  <TouchSlider
                    label={t('editor.style.shadowOffset')}
                    min={0}
                    max={40}
                    value={editingPreset.shadow ?? 0}
                    onChange={(val) => updateEditingPreset({ shadow: val })}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <TouchSlider
                    label={t('editor.style.shadowBlur')}
                    min={0}
                    max={20}
                    value={editingPreset.shadow_blur || 0}
                    onChange={(val) => updateEditingPreset({ shadow_blur: val })}
                  />
                  <TouchSlider
                    label={t('editor.style.blur')}
                    min={0}
                    max={40}
                    value={editingPreset.blur ?? 0}
                    onChange={(val) => updateEditingPreset({ blur: val })}
                  />
                </Stack>
              </Grid>

              {/* Position */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {t('editor.style.verticalPosition')}
                </Typography>
                <TouchSlider
                  label=""
                  min={-100}
                  max={100}
                  value={editingPreset.margin_v ?? 0}
                  onChange={(val) => updateEditingPreset({ margin_v: val })}
                  formatValue={(val) => {
                    if (val <= -34) return t('editor.style.position.bottom');
                    if (val >= 34) return t('editor.style.position.top');
                    return t('editor.style.position.middle');
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePreset}
            disabled={saving}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('admin.presets.deletePreset')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.presets.deleteConfirm', { name: selectedPreset?.label || selectedPreset?.id })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{selectedPreset?.label || selectedPreset?.id}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box
                ref={previewRef}
                sx={{
                  height: 420,
                  bgcolor: 'grey.900',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                {selectedPreset && (
                  <PresetPreview preset={selectedPreset} height={420} />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 1 }}>
                <Typography variant="h6">{selectedPreset?.label}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {selectedPreset?.id}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Font</Typography>
                  <Typography sx={{ fontFamily: selectedPreset?.font || 'Arial' }}>{selectedPreset?.font}</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Preview Controls</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" onClick={() => { if (selectedPreset) handleEdit(selectedPreset); }} startIcon={<EditIcon />}>Edit</Button>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            {t('common.close')}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setPreviewDialogOpen(false);
              if (selectedPreset) handleEdit(selectedPreset);
            }}
          >
            {t('common.edit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
