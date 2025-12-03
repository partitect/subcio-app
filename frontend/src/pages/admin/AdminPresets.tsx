import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Slider,
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
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  KeyboardArrowUp as MoveUpIcon,
  KeyboardArrowDown as MoveDownIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { StyleConfig } from '../../types';
import { assToHex, styleToAssColors } from '../../utils/colorConvert';
import AdminLayout from '../../components/admin/AdminLayout';
import StaticPresetPreview, { StaticPresetPreviewRef } from '../../components/admin/StaticPresetPreview';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Preset extends StyleConfig {
  label?: string;
  category?: string;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
  usage_count?: number;
}

interface PresetCategory {
  id: string;
  label: string;
  order?: number;
}

export default function AdminPresets() {
  const { t } = useTranslation();
  
  // State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetCategories, setPresetCategories] = useState<PresetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEffectType, setSelectedEffectType] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [saving, setSaving] = useState(false);
  const [screenshotting, setScreenshotting] = useState<string | null>(null);
  const [fontOptions, setFontOptions] = useState<{ name: string; file: string }[]>([]);
  const [effectTypes, setEffectTypes] = useState<{ 
    id: string; 
    name: string; 
    category: string;
    description?: string;
    config_schema?: Record<string, {
      type: string;
      min?: number;
      max?: number;
      default?: any;
      description?: string;
    }>;
  }[]>([]);
  const [effectCategories, setEffectCategories] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const previewRef = useRef<StaticPresetPreviewRef>(null);

  // Load presets, fonts, and effect types
  useEffect(() => {
    loadPresets();
    loadFonts();
    loadEffectTypes();
    loadPresetCategories();
  }, []);

  const loadEffectTypes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/effect-types`);
      if (data?.effects) {
        setEffectTypes(data.effects);
        setEffectCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load effect types', err);
    }
  };

  const loadPresetCategories = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/preset-categories`);
      if (Array.isArray(data)) {
        setPresetCategories(data);
      }
    } catch (err) {
      console.error('Failed to load preset categories', err);
      // Fallback to default categories
      setPresetCategories([
        { id: 'tiktok', label: 'TikTok' },
        { id: 'karaoke', label: 'Karaoke' },
        { id: 'fire', label: 'Fire' },
        { id: 'neon', label: 'Neon' },
        { id: 'glitch', label: 'Glitch' },
        { id: 'nature', label: 'Nature' },
        { id: 'cinema', label: 'Cinema' },
        { id: 'horror', label: 'Horror' },
        { id: 'bounce', label: 'Bounce' },
        { id: 'text', label: 'Text' },
      ]);
    }
  };

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
    const matchesEffectType =
      selectedEffectType === 'all' || (preset as any).effect_type === selectedEffectType;
    return matchesSearch && matchesCategory && matchesEffectType;
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

  const handleMovePreset = async (presetId: string, direction: 'up' | 'down') => {
    const currentIndex = filteredPresets.findIndex(p => p.id === presetId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredPresets.length) return;
    
    // Swap sort_order values
    const currentPreset = filteredPresets[currentIndex];
    const targetPreset = filteredPresets[targetIndex];
    
    const currentOrder = currentPreset.sort_order ?? currentIndex;
    const targetOrder = targetPreset.sort_order ?? targetIndex;
    
    try {
      await axios.post(`${API_BASE}/presets/reorder`, {
        orders: [
          { id: currentPreset.id, sort_order: targetOrder },
          { id: targetPreset.id, sort_order: currentOrder },
        ]
      });
      loadPresets();
    } catch (err) {
      console.error('Failed to reorder preset', err);
      setToast({ open: true, message: t('admin.presets.reorderError') || 'Failed to reorder', severity: 'error' });
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
      // Use StaticPresetPreview's captureAsImage method
      if (!previewRef.current) {
        throw new Error('Preview component not ready');
      }
      
      const imageData = await previewRef.current.captureAsImage();
      
      if (!imageData) {
        throw new Error('Failed to capture preview');
      }
      
      // Send to backend
      await axios.post(`${API_BASE}/presets/screenshot`, {
        id: presetId,
        image: imageData,
      });
      
      setToast({ open: true, message: t('admin.presets.screenshotTaken'), severity: 'success' });
      loadPresets();
    } catch (err) {
      console.error('Failed to take screenshot', err);
      setToast({ open: true, message: t('admin.presets.screenshotError'), severity: 'error' });
    } finally {
      setScreenshotting(null);
    }
  };

  const handleExportPresets = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/presets/export`);
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presets_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setToast({ open: true, message: t('admin.presets.exportSuccess') || 'Presets exported successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to export presets', err);
      setToast({ open: true, message: t('admin.presets.exportError') || 'Failed to export presets', severity: 'error' });
    }
  };

  const handleImportPresets = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const { data: result } = await axios.post(`${API_BASE}/presets/import`, {
        ...data,
        overwrite: false, // Don't overwrite existing presets by default
      });
      
      setToast({ 
        open: true, 
        message: t('admin.presets.importSuccess', { imported: result.imported, skipped: result.skipped }) || 
                 `Imported ${result.imported} presets, skipped ${result.skipped} existing`, 
        severity: 'success' 
      });
      loadPresets();
    } catch (err) {
      console.error('Failed to import presets', err);
      setToast({ open: true, message: t('admin.presets.importError') || 'Failed to import presets', severity: 'error' });
    }
    
    // Reset file input
    event.target.value = '';
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

  const updateEditingPreset = useCallback((updates: Partial<Preset>) => {
    setEditingPreset(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Format preset ID to readable name (e.g., "tiktok_bounce" -> "Tiktok Bounce")
  const formatPresetName = useCallback((id: string | undefined) => {
    if (!id) return 'Preview';
    return id
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

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
          {/* Import Button */}
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            component="label"
          >
            {t('admin.presets.import') || 'Import'}
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleImportPresets}
            />
          </Button>
          {/* Export Button */}
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportPresets}
          >
            {t('admin.presets.export') || 'Export'}
          </Button>
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label={t('admin.presets.filterByEffect') || 'Effect Type'}
              value={selectedEffectType}
              onChange={(e) => setSelectedEffectType(e.target.value)}
            >
              <MenuItem value="all">{t('common.all') || 'All Effects'}</MenuItem>
              {effectTypes.map((effect) => (
                <MenuItem key={effect.id} value={effect.id}>
                  {effect.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                key="all"
                label={t('common.all') || 'All'}
                onClick={() => setSelectedCategory('all')}
                color={selectedCategory === 'all' ? 'primary' : 'default'}
                variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                size="small"
              />
              {presetCategories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label || t(`editor.preset.category.${cat.id}`)}
                  onClick={() => setSelectedCategory(cat.id)}
                  color={selectedCategory === cat.id ? 'primary' : 'default'}
                  variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
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
                <Box
                  data-preset-id={preset.id}
                  sx={{
                    height: 80,
                    bgcolor: '#1a1a2e',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Static CSS-based preview like ClipMagic */}
                  <StaticPresetPreview 
                    preset={preset} 
                    height={80} 
                    sampleText={preset.label || formatPresetName(preset.id)} 
                    showMultipleWords={false}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium" noWrap>
                    {preset.label || preset.id}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ID: {preset.id}
                    </Typography>
                    {(preset.usage_count ?? 0) > 0 && (
                      <Chip 
                        label={`${preset.usage_count} ${t('admin.presets.uses') || 'uses'}`} 
                        size="small" 
                        color="info"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                  
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
                    <Tooltip title={t('admin.presets.duplicate')}>
                      <IconButton size="small" onClick={() => handleDuplicate(preset)}>
                        <DuplicateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.presets.moveUp') || 'Move Up'}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMovePreset(preset.id!, 'up')}
                        disabled={filteredPresets.findIndex(p => p.id === preset.id) === 0}
                      >
                        <MoveUpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.presets.moveDown') || 'Move Down'}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMovePreset(preset.id!, 'down')}
                        disabled={filteredPresets.findIndex(p => p.id === preset.id) === filteredPresets.length - 1}
                      >
                        <MoveDownIcon fontSize="small" />
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
                      ref={previewRef}
                      sx={{
                        height: 120,
                        bgcolor: 'grey.900',
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 1,
                        position: 'relative',
                      }}
                    >
                      <StaticPresetPreview ref={previewRef} preset={editingPreset} height={120} sampleText={editingPreset.label || formatPresetName(editingPreset.id)} />
                      {/* Screenshot button on preview */}
                      <Tooltip title={t('admin.presets.takeScreenshot') || 'Take Screenshot'}>
                        <IconButton
                          size="small"
                          onClick={() => editingPreset && handleTakeScreenshot(editingPreset.id!)}
                          disabled={screenshotting === editingPreset?.id}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                            zIndex: 10,
                          }}
                        >
                          {screenshotting === editingPreset?.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <ScreenshotIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
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
                        {presetCategories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.label || t(`editor.preset.category.${cat.id}`)}
                          </MenuItem>
                        ))}
                      </TextField>

                      {/* Effect Type Dropdown */}
                      <TextField
                        select
                        label={t('admin.presets.effectType') || 'Effect Type'}
                        fullWidth
                        size="small"
                        value={editingPreset.effect_type || ''}
                        onChange={(e) => updateEditingPreset({ effect_type: e.target.value })}
                      >
                        <MenuItem value="">
                          <em>{t('admin.presets.noEffect') || 'No Effect (Static)'}</em>
                        </MenuItem>
                        {effectTypes.map((effect) => (
                          <MenuItem key={effect.id} value={effect.id}>
                            {effect.name} <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({effect.category})</Typography>
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
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">{t('editor.style.fontSize')}</Typography>
                          <Typography variant="body2" fontWeight={500}>{editingPreset.font_size || 56}px</Typography>
                        </Stack>
                        <Slider
                          min={12}
                          max={300}
                          value={editingPreset.font_size || 56}
                          onChange={(_, val) => updateEditingPreset({ font_size: val as number })}
                          size="small"
                        />
                      </Box>
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

                      {/* Letter Spacing */}
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">{t('admin.presets.letterSpacing') || 'Letter Spacing'}</Typography>
                          <Typography variant="body2" fontWeight={500}>{(editingPreset as any).letter_spacing || 0}px</Typography>
                        </Stack>
                        <Slider
                          min={0}
                          max={50}
                          value={(editingPreset as any).letter_spacing || 0}
                          onChange={(_, val) => updateEditingPreset({ letter_spacing: val } as any)}
                          size="small"
                        />
                      </Box>
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
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{t('editor.style.border')}</Typography>
                      <Typography variant="body2" fontWeight={500}>{editingPreset.border || 0}</Typography>
                    </Stack>
                    <Slider
                      min={0}
                      max={8}
                      value={editingPreset.border || 0}
                      onChange={(_, val) => updateEditingPreset({ border: val as number })}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{t('editor.style.shadowOffset')}</Typography>
                      <Typography variant="body2" fontWeight={500}>{editingPreset.shadow ?? 0}</Typography>
                    </Stack>
                    <Slider
                      min={0}
                      max={40}
                      value={editingPreset.shadow ?? 0}
                      onChange={(_, val) => updateEditingPreset({ shadow: val as number })}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{t('editor.style.shadowBlur')}</Typography>
                      <Typography variant="body2" fontWeight={500}>{editingPreset.shadow_blur || 0}</Typography>
                    </Stack>
                    <Slider
                      min={0}
                      max={20}
                      value={editingPreset.shadow_blur || 0}
                      onChange={(_, val) => updateEditingPreset({ shadow_blur: val as number })}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{t('editor.style.blur')}</Typography>
                      <Typography variant="body2" fontWeight={500}>{editingPreset.blur ?? 0}</Typography>
                    </Stack>
                    <Slider
                      min={0}
                      max={40}
                      value={editingPreset.blur ?? 0}
                      onChange={(_, val) => updateEditingPreset({ blur: val as number })}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Grid>

              {/* Position */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {t('editor.style.verticalPosition')}
                </Typography>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{t('editor.style.verticalPosition')}</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {(editingPreset.margin_v ?? 0) <= -34 
                        ? t('editor.style.position.bottom') 
                        : (editingPreset.margin_v ?? 0) >= 34 
                          ? t('editor.style.position.top') 
                          : t('editor.style.position.middle')}
                    </Typography>
                  </Stack>
                  <Slider
                    min={-100}
                    max={100}
                    value={editingPreset.margin_v ?? 0}
                    onChange={(_, val) => updateEditingPreset({ margin_v: val as number })}
                    size="small"
                  />
                </Box>
              </Grid>

              {/* Advanced: Opacity, Rotation, Scale */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {t('admin.presets.advanced') || 'Advanced Settings'}
                </Typography>
                <Grid container spacing={2}>
                  {/* Opacity */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{t('admin.presets.opacity') || 'Opacity'}</Typography>
                        <Typography variant="body2" fontWeight={500}>{(editingPreset as any).opacity ?? 100}%</Typography>
                      </Stack>
                      <Slider
                        min={0}
                        max={100}
                        value={(editingPreset as any).opacity ?? 100}
                        onChange={(_, val) => updateEditingPreset({ opacity: val } as any)}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  {/* Rotation */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{t('admin.presets.rotation') || 'Rotation'}</Typography>
                        <Typography variant="body2" fontWeight={500}>{(editingPreset as any).rotation ?? 0}°</Typography>
                      </Stack>
                      <Slider
                        min={-180}
                        max={180}
                        value={(editingPreset as any).rotation ?? 0}
                        onChange={(_, val) => updateEditingPreset({ rotation: val } as any)}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  {/* Scale X */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{t('admin.presets.scaleX') || 'Scale X'}</Typography>
                        <Typography variant="body2" fontWeight={500}>{(editingPreset as any).scale_x ?? 100}%</Typography>
                      </Stack>
                      <Slider
                        min={50}
                        max={200}
                        value={(editingPreset as any).scale_x ?? 100}
                        onChange={(_, val) => updateEditingPreset({ scale_x: val } as any)}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  {/* Scale Y */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{t('admin.presets.scaleY') || 'Scale Y'}</Typography>
                        <Typography variant="body2" fontWeight={500}>{(editingPreset as any).scale_y ?? 100}%</Typography>
                      </Stack>
                      <Slider
                        min={50}
                        max={200}
                        value={(editingPreset as any).scale_y ?? 100}
                        onChange={(_, val) => updateEditingPreset({ scale_y: val } as any)}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  {/* Shear */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{t('admin.presets.shear') || 'Shear'}</Typography>
                        <Typography variant="body2" fontWeight={500}>{(editingPreset as any).shear ?? 0}</Typography>
                      </Stack>
                      <Slider
                        min={-50}
                        max={50}
                        value={(editingPreset as any).shear ?? 0}
                        onChange={(_, val) => updateEditingPreset({ shear: val } as any)}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Text Decorations */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {t('admin.presets.textDecorations') || 'Text Decorations'}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    select
                    label={t('admin.presets.italic') || 'Italic'}
                    size="small"
                    value={(editingPreset as any).italic ?? 0}
                    onChange={(e) => updateEditingPreset({ italic: Number(e.target.value) } as any)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value={0}>{t('common.no') || 'No'}</MenuItem>
                    <MenuItem value={1}>{t('common.yes') || 'Yes'}</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label={t('admin.presets.underline') || 'Underline'}
                    size="small"
                    value={(editingPreset as any).underline ?? 0}
                    onChange={(e) => updateEditingPreset({ underline: Number(e.target.value) } as any)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value={0}>{t('common.no') || 'No'}</MenuItem>
                    <MenuItem value={1}>{t('common.yes') || 'Yes'}</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label={t('admin.presets.strikeout') || 'Strikeout'}
                    size="small"
                    value={(editingPreset as any).strikeout ?? 0}
                    onChange={(e) => updateEditingPreset({ strikeout: Number(e.target.value) } as any)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value={0}>{t('common.no') || 'No'}</MenuItem>
                    <MenuItem value={1}>{t('common.yes') || 'Yes'}</MenuItem>
                  </TextField>
                </Stack>
              </Grid>

              {/* Dynamic Effect Config Editor */}
              {editingPreset.effect_type && (() => {
                const selectedEffect = effectTypes.find(e => e.id === editingPreset.effect_type);
                const configSchema = selectedEffect?.config_schema || {};
                const hasConfigFields = Object.keys(configSchema).length > 0;
                const effectConfig = (editingPreset as any).effect_config || {};
                
                const updateEffectConfig = (key: string, value: any) => {
                  updateEditingPreset({ 
                    effect_config: { 
                      ...effectConfig, 
                      [key]: value 
                    } 
                  } as any);
                };
                
                return (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      {t('admin.presets.effectConfig') || 'Effect Configuration'}
                      {selectedEffect?.description && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {selectedEffect.description}
                        </Typography>
                      )}
                    </Typography>
                    
                    {hasConfigFields ? (
                      <Grid container spacing={2}>
                        {Object.entries(configSchema).map(([key, schema]) => {
                          const currentValue = effectConfig[key] ?? schema.default;
                          
                          if (schema.type === 'number') {
                            return (
                              <Grid item xs={12} sm={6} md={4} key={key}>
                                <Box>
                                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>{currentValue ?? schema.default ?? 0}</Typography>
                                  </Stack>
                                  <Slider
                                    min={schema.min ?? 0}
                                    max={schema.max ?? 100}
                                    step={schema.max && schema.max <= 5 ? 0.1 : 1}
                                    value={currentValue ?? schema.default ?? 0}
                                    onChange={(_, val) => updateEffectConfig(key, val)}
                                    size="small"
                                  />
                                </Box>
                                {schema.description && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {schema.description}
                                  </Typography>
                                )}
                              </Grid>
                            );
                          }
                          
                          if (schema.type === 'array') {
                            // Color array - show as comma-separated text field
                            const arrayValue = Array.isArray(currentValue) ? currentValue : (schema.default || []);
                            return (
                              <Grid item xs={12} sm={6} key={key}>
                                <TextField
                                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  fullWidth
                                  size="small"
                                  value={arrayValue.join(', ')}
                                  onChange={(e) => {
                                    const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                                    updateEffectConfig(key, values);
                                  }}
                                  helperText={schema.description || 'Comma-separated values (e.g., &H00FF00&, &H0000FF&)'}
                                />
                              </Grid>
                            );
                          }
                          
                          // Default: text field
                          return (
                            <Grid item xs={12} sm={6} key={key}>
                              <TextField
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                fullWidth
                                size="small"
                                value={currentValue ?? ''}
                                onChange={(e) => updateEffectConfig(key, e.target.value)}
                                helperText={schema.description}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        {t('admin.presets.noConfigParams') || 'This effect has no configurable parameters.'}
                      </Alert>
                    )}
                    
                    {/* Advanced: JSON Editor (collapsible) */}
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        label={t('admin.presets.effectConfigJson') || 'Advanced: Raw JSON Config'}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        value={JSON.stringify(effectConfig, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateEditingPreset({ effect_config: parsed } as any);
                          } catch {
                            // Invalid JSON, don't update
                          }
                        }}
                        helperText={t('admin.presets.effectConfigJsonHelp') || 'Edit raw JSON for advanced configuration'}
                        sx={{ 
                          fontFamily: 'monospace',
                          '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' }
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })()}
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
