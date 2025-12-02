import { memo, useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  Box, 
  Grid, 
  Card,
  CardActionArea,
  CardContent,
  Typography, 
  TextField, 
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  useTheme as useMuiTheme,
} from "@mui/material";
import { Search, Filter, X, ChevronDown, ChevronUp, Heart, Grid3X3, List } from "lucide-react";
import { StyleConfig } from "../../types";
import { useTheme } from "../../ThemeContext";
import { announce, VisuallyHidden } from "../../utils/a11y";
import StaticPresetPreview from "../admin/StaticPresetPreview";

type Preset = StyleConfig & { label?: string };

interface PresetGalleryProps {
  presets: Preset[];
  selectedPresetId?: string;
  onPresetSelect: (preset: Preset) => void;
}

// Preset category keys - matching i18n keys
const PRESET_CATEGORY_KEYS = ["all", "favorites", "tiktok", "karaoke", "fire", "neon", "glitch", "nature", "cinema", "horror", "bounce", "text"] as const;

// Storage key for favorites
const FAVORITES_STORAGE_KEY = "subcio_preset_favorites";
const VIEW_MODE_STORAGE_KEY = "subcio_preset_view_mode";

// Load favorites from localStorage
const loadFavorites = (): Set<string> => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Save favorites to localStorage
const saveFavorites = (favorites: Set<string>) => {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
};

// Load view mode from localStorage
const loadViewMode = (): "grid" | "list" => {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
};

// Keywords for each category (for automatic categorization)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tiktok: ["tiktok", "group", "box"],
  karaoke: ["karaoke", "sentence"],
  fire: ["fire", "flame", "phoenix", "storm"],
  neon: ["neon", "glow", "pulse", "electric"],
  glitch: ["glitch", "pixel", "retro", "arcade", "matrix"],
  nature: ["wave", "ocean", "ice", "sakura", "butterfly", "crystal"],
  cinema: ["cinematic", "movie", "credits", "dramatic", "film", "blur"],
  horror: ["horror", "creepy", "flicker", "ghost"],
  bounce: ["bounce", "shake", "pop", "zoom", "slide", "spin"],
  text: ["typewriter", "fade", "highlight", "reveal"],
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [viewMode, setViewMode] = useState<"grid" | "list">(loadViewMode);
  
  const muiTheme = useMuiTheme();
  const { isDark } = useTheme();

  // Toggle favorite status
  const toggleFavorite = useCallback((presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      const isFavorite = newFavorites.has(presetId);
      if (isFavorite) {
        newFavorites.delete(presetId);
        announce(t('editor.preset.removedFromFavorites', { name: formatPresetName(presetId) }));
      } else {
        newFavorites.add(presetId);
        announce(t('editor.preset.addedToFavorites', { name: formatPresetName(presetId) }));
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [t]);

  // Handle preset selection with announcement
  const handlePresetSelect = useCallback((preset: Preset) => {
    onPresetSelect(preset);
    announce(t('editor.preset.selected', { name: preset.label || formatPresetName(preset.id) }));
  }, [onPresetSelect, t]);

  // Handle view mode change
  const handleViewModeChange = useCallback((_: React.MouseEvent, newMode: "grid" | "list" | null) => {
    if (newMode) {
      setViewMode(newMode);
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, newMode);
    }
  }, []);

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
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
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
      let matchesCategory = true;
      if (selectedCategory === "favorites") {
        matchesCategory = favorites.has(preset.id);
      } else if (selectedCategory !== "all") {
        matchesCategory = getPresetCategory(preset) === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [presets, searchQuery, selectedCategory, favorites]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: presets.length, favorites: favorites.size };
    
    presets.forEach((preset) => {
      const category = getPresetCategory(preset);
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }, [presets, favorites.size]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder={t('editor.preset.searchPlaceholder')}
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
                {t('editor.preset.categories')}
              </Typography>
              {selectedCategory !== "all" && (
                <Chip 
                  label={t(`editor.preset.category.${selectedCategory}`)} 
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
          {PRESET_CATEGORY_KEYS.map((key) => {
            const count = categoryCounts[key] || 0;
            if (key !== "all" && count === 0) return null;
            
            return (
              <Chip
                key={key}
                label={`${t(`editor.preset.category.${key}`)} (${count})`}
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

      {/* Results Count & View Toggle */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {t('editor.preset.found', { count: filteredPresets.length })}
        </Typography>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          sx={{ 
            "& .MuiToggleButton-root": { 
              px: 1, 
              py: 0.5,
              border: "1px solid",
              borderColor: "divider",
            } 
          }}
        >
          <ToggleButton value="grid" aria-label="grid view">
            <Grid3X3 size={16} />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <List size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Presets Grid/List */}
      {viewMode === "grid" ? (
        <Grid
          container
          spacing={1}
          role="listbox"
          aria-label={t('editor.preset.galleryLabel', 'Preset gallery')}
          sx={{
            maxHeight: { xs: "unset", md: "60vh" },
            overflowY: { md: "auto" },
            pr: 0.5,
          }}
        >
          {filteredPresets.map((preset, index) => {
            const selected = selectedPresetId === preset.id;
            const isFavorite = favorites.has(preset.id);
            const presetName = preset.label || formatPresetName(preset.id);

            return (
              <Grid item xs={4} sm={3} key={preset.id} role="option" aria-selected={selected}>
                <Tooltip 
                  title={presetName} 
                  arrow 
                  placement="top"
                  enterDelay={500}
                >
                  <Card
                    variant="outlined"
                    onClick={() => handlePresetSelect(preset)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePresetSelect(preset);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${presetName}${selected ? `, ${t('common.selected')}` : ''}${isFavorite ? `, ${t('editor.preset.favorite')}` : ''}`}
                    sx={{
                      cursor: "pointer",
                      borderRadius: 2,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "primary.main" : "divider",
                      bgcolor: selected 
                        ? isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.08)"
                        : "background.paper",
                      transition: "all 0.15s ease",
                      position: "relative",
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                      "&:hover": {
                        borderColor: "primary.main",
                        transform: "translateY(-2px)",
                        boxShadow: isDark 
                          ? "0 8px 24px rgba(0,0,0,0.4)" 
                          : "0 8px 24px rgba(0,0,0,0.12)",
                      },
                      "&:hover .favorite-btn": {
                        opacity: 1,
                      },
                    }}
                  >
                    {/* Favorite Button */}
                    <IconButton
                      className="favorite-btn"
                      size="small"
                      onClick={(e) => toggleFavorite(preset.id, e)}
                      aria-label={isFavorite 
                        ? t('editor.preset.removeFromFavorites', { name: presetName }) 
                        : t('editor.preset.addToFavorites', { name: presetName })
                      }
                      aria-pressed={isFavorite}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        zIndex: 2,
                        opacity: isFavorite ? 1 : 0,
                        transition: "opacity 0.2s ease",
                        bgcolor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)",
                        "&:hover": {
                          bgcolor: isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,1)",
                        },
                        "&:focus-visible": {
                          opacity: 1,
                        },
                        p: 0.5,
                      }}
                    >
                      <Heart 
                        size={14} 
                        fill={isFavorite ? "#ef4444" : "none"} 
                        color={isFavorite ? "#ef4444" : "currentColor"}
                        aria-hidden="true"
                      />
                    </IconButton>

                    {/* Static CSS-based Preset Preview */}
                    <Box
                      sx={{
                        height: 50,
                        overflow: "hidden",
                        borderRadius: "8px 8px 0 0",
                      }}
                    >
                      <StaticPresetPreview 
                        preset={preset} 
                        height={50} 
                        sampleText={preset.label || formatPresetName(preset.id)}
                        showMultipleWords={false}
                      />
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
        </Grid>
      ) : (
        /* List View */
        <Box
          sx={{
            maxHeight: { xs: "unset", md: "60vh" },
            overflowY: { md: "auto" },
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          {filteredPresets.map((preset) => {
            const selected = selectedPresetId === preset.id;
            const isFavorite = favorites.has(preset.id);

            return (
              <Card
                key={preset.id}
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
                    boxShadow: isDark 
                      ? "0 4px 12px rgba(0,0,0,0.3)" 
                      : "0 4px 12px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1 }}>
                  {/* Static CSS Thumbnail */}
                  <Box
                    sx={{
                      width: 80,
                      height: 36,
                      overflow: "hidden",
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  >
                    <StaticPresetPreview 
                      preset={preset} 
                      height={36} 
                      sampleText={preset.label || formatPresetName(preset.id)}
                      showMultipleWords={false}
                    />
                  </Box>

                  {/* Name & Category */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: 600, fontSize: "0.8rem" }}
                    >
                      {formatPresetName(preset.id)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {t(`editor.preset.category.${getPresetCategory(preset)}`)}
                    </Typography>
                  </Box>

                  {/* Favorite Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => toggleFavorite(preset.id, e)}
                    sx={{ p: 0.5 }}
                  >
                    <Heart 
                      size={16} 
                      fill={isFavorite ? "#ef4444" : "none"} 
                      color={isFavorite ? "#ef4444" : "currentColor"}
                    />
                  </IconButton>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}

      {/* No Results */}
      {filteredPresets.length === 0 && (
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
            {selectedCategory === "favorites" 
              ? t('editor.preset.noFavorites') 
              : t('editor.preset.noResults')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            {selectedCategory === "favorites"
              ? t('editor.preset.addFavorites')
              : t('editor.preset.tryDifferent')}
          </Typography>
        </Card>
      )}
    </Box>
  );
}

export const PresetGallery = memo(PresetGalleryComponent);
export default PresetGallery;
