import { memo } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { StyleConfig } from "../../types";

type Preset = StyleConfig & { label?: string };

interface PresetGalleryProps {
  presets: Preset[];
  selectedPresetId?: string;
  onPresetSelect: (preset: Preset) => void;
}

/**
 * Preset Gallery Component
 * Displays a grid of available presets with preview images
 */
function PresetGalleryComponent({
  presets,
  selectedPresetId,
  onPresetSelect,
}: PresetGalleryProps) {
  /**
   * Format preset ID to display name
   * Converts "fire-storm" to "Fire Storm"
   */
  const formatPresetName = (id: string): string => {
    return id
      .replace(/-/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <Grid
      container
      spacing={0.75}
      sx={{
        maxHeight: { xs: "unset", md: "80vh" },
        overflowY: { md: "auto" },
        pr: 0.5,
      }}
    >
      {presets.map((preset) => {
        const selected = selectedPresetId === preset.id;

        return (
          <Grid item xs={3} key={preset.id}>
            <Paper
              variant="outlined"
              onClick={() => onPresetSelect(preset)}
              sx={{
                p: 0.75,
                borderRadius: 1,
                cursor: "pointer",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected ? "action.selected" : "background.paper",
                transition: "border-color 120ms ease, transform 120ms ease",
                "&:hover": {
                  borderColor: "primary.main",
                  transform: "translateY(-1px)",
                },
              }}
            >
              {/* Preset Preview Image */}
              <Box
                sx={{
                  height: 55,
                  borderRadius: 0.75,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "grey.900",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`/sspresets/${preset.id}.png`}
                  alt={preset.id}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </Box>

              {/* Preset Name */}
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: 500,
                  display: "block",
                  mt: 0.5,
                  fontSize: "0.65rem",
                  textAlign: "center",
                  opacity: 0.85,
                }}
              >
                {formatPresetName(preset.id)}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

export const PresetGallery = memo(PresetGalleryComponent);
export default PresetGallery;
