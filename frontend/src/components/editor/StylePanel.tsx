import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { StyleConfig } from "../../types";

interface StylePanelProps {
  style: StyleConfig;
  fontOptions: { name: string; file: string }[];
  savingPreset: boolean;
  onStyleChange: (style: StyleConfig) => void;
  onSavePreset: () => void;
}

/**
 * Style Panel Component
 * Handles font, colors, borders, shadows, and position settings
 */
function StylePanelComponent({
  style,
  fontOptions,
  savingPreset,
  onStyleChange,
  onSavePreset,
}: StylePanelProps) {
  const { t } = useTranslation();

  const updateStyle = (updates: Partial<StyleConfig>) => {
    onStyleChange({ ...style, ...updates });
  };

  // margin_v: -100 (bottom) → 0 (middle) → +100 (top)
  const marginValue = style.margin_v ?? 0;
  const activeButton = marginValue <= -34 ? 2 : marginValue >= 34 ? 8 : 5;

  return (
    <Stack
      spacing={2}
      sx={{
        overflowY: { md: "auto" },
        overflowX: "hidden",
        maxHeight: { xs: "none", md: "80vh" },
        pl: { xs: 1, md: 0 },
        pr: { xs: 2.5, md: 6 },
      }}
    >
      {/* Save Preset Button */}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          variant="contained"
          size="small"
          onClick={onSavePreset}
          disabled={savingPreset}
        >
          {savingPreset ? t('editor.style.saving') : t('editor.style.savePreset')}
        </Button>
      </Stack>

      {/* Font Settings */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            select
            label={t('editor.style.font')}
            fullWidth
            size="small"
            value={style.font || ""}
            onChange={(e) => updateStyle({ font: e.target.value })}
          >
            {fontOptions.map((f) => (
              <MenuItem key={f.name} value={f.name}>
                {f.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
              {t('editor.style.fontSize')}
            </Typography>
            <Slider
              min={12}
              max={300}
              value={style.font_size || 56}
              onChange={(_, val) => updateStyle({ font_size: val as number })}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" width={42} textAlign="right">
              {style.font_size || 56}px
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label={t('editor.style.fontWeight')}
            fullWidth
            size="small"
            value={style.bold ? 1 : 0}
            onChange={(e) => updateStyle({ bold: Number(e.target.value) })}
          >
            <MenuItem value={0}>{t('editor.style.regular')}</MenuItem>
            <MenuItem value={1}>{t('editor.style.bold')}</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            type="number"
            label={t('editor.style.letterSpacing')}
            fullWidth
            size="small"
            value={style.letter_spacing ?? 0}
            onChange={(e) => updateStyle({ letter_spacing: Number(e.target.value) })}
          />
        </Grid>
      </Grid>

      {/* Color Settings */}
      <Grid container spacing={2}>
        {[
          { key: "primary_color", labelKey: "primary", fallback: "#ffffff" },
          { key: "secondary_color", labelKey: "secondary", fallback: "#00ffff" },
          { key: "outline_color", labelKey: "outline", fallback: "#000000" },
          { key: "shadow_color", labelKey: "shadow", fallback: "#000000" },
          { key: "back_color", labelKey: "background", fallback: "#000000" },
        ].map((c) => (
          <Grid item xs={6} sm={4} md={3} key={c.key}>
            <TextField
              label={t(`editor.style.colors.${c.labelKey}`)}
              type="color"
              fullWidth
              size="small"
              value={(style as any)[c.key] || c.fallback}
              onChange={(e) => updateStyle({ [c.key]: e.target.value })}
              InputProps={{ sx: { height: 48, p: 0.5 } }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Border & Shadow Settings */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
              {t('editor.style.border')}
            </Typography>
            <Slider
              min={0}
              max={8}
              value={style.border || 0}
              onChange={(_, val) => updateStyle({ border: val as number })}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" width={30} textAlign="right">
              {style.border || 0}
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
              {t('editor.style.shadowBlur')}
            </Typography>
            <Slider
              min={0}
              max={20}
              value={style.shadow_blur || 0}
              onChange={(_, val) => updateStyle({ shadow_blur: val as number })}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" width={30} textAlign="right">
              {style.shadow_blur || 0}
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
              {t('editor.style.shadowOffset')}
            </Typography>
            <Slider
              min={0}
              max={40}
              value={style.shadow ?? 0}
              onChange={(_, val) => updateStyle({ shadow: val as number })}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" width={40} textAlign="right">
              {style.shadow ?? 0}
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
              {t('editor.style.blur')}
            </Typography>
            <Slider
              min={0}
              max={40}
              value={style.blur ?? 0}
              onChange={(_, val) => updateStyle({ blur: val as number })}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" width={40} textAlign="right">
              {style.blur ?? 0}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* Position Controls */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, mb: 1, display: "block" }}>
        {t('editor.style.verticalPosition')}
      </Typography>

      <Grid container spacing={1} alignItems="center">
        {[
          { align: 2, labelKey: "bottom", targetValue: -100 },
          { align: 5, labelKey: "middle", targetValue: 0 },
          { align: 8, labelKey: "top", targetValue: 100 },
        ].map(({ align, labelKey, targetValue }) => (
          <Grid item xs={4} key={align}>
            <Button
              fullWidth
              variant={activeButton === align ? "contained" : "outlined"}
              size="small"
              onClick={() => updateStyle({ margin_v: targetValue })}
              sx={{ transition: "all 0.15s ease" }}
            >
              {t(`editor.style.position.${labelKey}`)}
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* Vertical Position Slider */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
        <Slider
          min={-100}
          max={100}
          value={marginValue}
          onChange={(_, val) => updateStyle({ margin_v: val as number })}
          sx={{
            flex: 1,
            "& .MuiSlider-track": {
              background: "linear-gradient(90deg, rgba(99,102,241,0.8) 0%, rgba(139,92,246,0.8) 100%)",
            },
            "& .MuiSlider-thumb": {
              transition: "left 0.1s ease",
            },
          }}
          marks={[
            { value: -100, label: t('editor.style.position.bottom') },
            { value: 0, label: t('editor.style.position.middle') },
            { value: 100, label: t('editor.style.position.top') },
          ]}
        />
      </Stack>
    </Stack>
  );
}

export const StylePanel = memo(StylePanelComponent);
export default StylePanel;
