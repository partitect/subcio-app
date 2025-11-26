import { memo, useState, useMemo } from "react";
import { 
  Box, 
  Grid, 
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography, 
  TextField, 
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Tooltip,
  useTheme as useMuiTheme,
} from "@mui/material";
import { Search, Filter, X, ChevronDown, ChevronUp, ImageOff } from "lucide-react";
import { StyleConfig } from "../../types";
import { useTheme } from "../../ThemeContext";

type Preset = StyleConfig & { label?: string };

interface PresetGalleryProps {
  presets: Preset[];
  selectedPresetId?: string;
  onPresetSelect: (preset: Preset) => void;
}

// Preset kategorileri - effect_type bazlı otomatik kategorileme
const PRESET_CATEGORIES: Record<string, { label: string; keywords: string[] }> = {
  all: { label: "Tümü", keywords: [] },
  tiktok: { label: "TikTok", keywords: ["tiktok", "group", "box"] },
  karaoke: { label: "Karaoke", keywords: ["karaoke", "sentence"] },
  fire: { label: "Ateş/Alev", keywords: ["fire", "flame", "phoenix", "storm"] },
  neon: { label: "Neon/Glow", keywords: ["neon", "glow", "pulse", "electric"] },
  glitch: { label: "Glitch/Retro", keywords: ["glitch", "pixel", "retro", "arcade", "matrix"] },
  nature: { label: "Doğa", keywords: ["wave", "ocean", "ice", "sakura", "butterfly", "crystal"] },
  cinema: { label: "Sinematik", keywords: ["cinematic", "movie", "credits", "dramatic", "film", "blur"] },
  horror: { label: "Korku", keywords: ["horror", "creepy", "flicker", "ghost"] },
  bounce: { label: "Hareket", keywords: ["bounce", "shake", "pop", "zoom", "slide", "spin"] },
  text: { label: "Yazı Efekti", keywords: ["typewriter", "fade", "highlight", "reveal"] },
};

/**
 * Preset Gallery Component
 * Displays a searchable and filterable grid of available presets with preview images
 */
function PresetGalleryComponent({
  presets,
  selectedPresetId,
  onPresetSelect,
}: PresetGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const muiTheme = useMuiTheme();
  const { isDark } = useTheme();

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

  /**
   * Get category for a preset based on its effect_type or id
   */
  const getPresetCategory = (preset: Preset): string => {
    const searchText = `${preset.id} ${preset.effect_type || ""}`.toLowerCase();
    
    for (const [category, { keywords }] of Object.entries(PRESET_CATEGORIES)) {
      if (category === "all") continue;
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return category;
      }
    }
    return "other";
  };

  /**
   * Filter presets based on search query and selected category
   */
  const filteredPresets = useMemo(() => {
    return presets.filter((preset) => {
      // Search filter
      const searchText = `${preset.id} ${preset.label || ""} ${preset.effect_type || ""} ${preset.font || ""}`.toLowerCase();
      const matchesSearch = !searchQuery || searchText.includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === "all" || getPresetCategory(preset) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [presets, searchQuery, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: presets.length };
    
    presets.forEach((preset) => {
      const category = getPresetCategory(preset);
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }, [presets]);

  const handleImageError = (presetId: string) => {
    setImageErrors(prev => new Set(prev).add(presetId));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Preset ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchQuery("")}>
                <X size={16} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            fontSize: "0.875rem",
          },
        }}
      />

      {/* Filter Toggle Button */}
      <Card 
        variant="outlined"
        onClick={() => setShowFilters(!showFilters)}
        sx={{ 
          cursor: "pointer",
          borderRadius: 2,
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "primary.main",
          },
        }}
      >
        <CardActionArea sx={{ px: 2, py: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Filter size={16} />
              <Typography variant="body2" fontWeight={500}>
                Kategoriler
              </Typography>
              {selectedCategory !== "all" && (
                <Chip 
                  label={PRESET_CATEGORIES[selectedCategory]?.label || selectedCategory} 
                  size="small" 
                  color="primary"
                  sx={{ height: 22, fontSize: "0.75rem" }}
                />
              )}
            </Stack>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Stack>
        </CardActionArea>
      </Card>

      {/* Category Filters */}
      <Collapse in={showFilters}>
        <Box 
          sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 0.75, 
            pb: 1,
          }}
        >
          {Object.entries(PRESET_CATEGORIES).map(([key, { label }]) => {
            const count = categoryCounts[key] || 0;
            if (key !== "all" && count === 0) return null;
            
            return (
              <Chip
                key={key}
                label={`${label} (${count})`}
                size="small"
                variant={selectedCategory === key ? "filled" : "outlined"}
                color={selectedCategory === key ? "primary" : "default"}
                onClick={() => setSelectedCategory(key)}
                sx={{
                  fontSize: "0.75rem",
                  height: 26,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
              />
            );
          })}
        </Box>
      </Collapse>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {filteredPresets.length} preset bulundu
      </Typography>

      {/* Presets Grid */}
      <Grid
        container
        spacing={1}
        sx={{
          maxHeight: { xs: "unset", md: "60vh" },
          overflowY: { md: "auto" },
          pr: 0.5,
        }}
      >
        {filteredPresets.map((preset) => {
          const selected = selectedPresetId === preset.id;
          const hasImageError = imageErrors.has(preset.id);

          return (
            <Grid item xs={4} sm={3} key={preset.id}>
              <Tooltip 
                title={preset.label || formatPresetName(preset.id)} 
                arrow 
                placement="top"
                enterDelay={500}
              >
                <Card
                  variant="outlined"
                  onClick={() => onPresetSelect(preset)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 2,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? "primary.main" : "divider",
                    bgcolor: selected 
                      ? isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.08)"
                      : "background.paper",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      transform: "translateY(-2px)",
                      boxShadow: isDark 
                        ? "0 8px 24px rgba(0,0,0,0.4)" 
                        : "0 8px 24px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  {/* Preset Preview Image */}
                  <Box
                    sx={{
                      height: 60,
                      bgcolor: isDark ? "grey.900" : "grey.100",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    {hasImageError ? (
                      <ImageOff size={24} style={{ opacity: 0.3 }} />
                    ) : (
                      <CardMedia
                        component="img"
                        src={`/sspresets/${preset.id}.png`}
                        alt={preset.id}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={() => handleImageError(preset.id)}
                      />
                    )}
                  </Box>

                  {/* Preset Name */}
                  <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                    <Typography
                      variant="caption"
                      noWrap
                      component="div"
                      sx={{
                        fontWeight: 600,
                        textAlign: "center",
                        fontSize: "0.7rem",
                        color: "text.primary",
                      }}
                    >
                      {formatPresetName(preset.id)}
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          );
        })}

        {/* No Results */}
        {filteredPresets.length === 0 && (
          <Grid item xs={12}>
            <Card 
              variant="outlined" 
              sx={{ 
                py: 4, 
                textAlign: "center",
                borderRadius: 2,
                borderStyle: "dashed",
              }}
            >
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                Aramanızla eşleşen preset bulunamadı
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                Farklı bir arama terimi veya kategori deneyin
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export const PresetGallery = memo(PresetGalleryComponent);
export default PresetGallery;
