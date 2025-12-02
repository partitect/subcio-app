/**
 * StaticPresetPreview Component
 * CSS-based static preview like ClipMagic - no video, no JASSUB
 * Shows style properties directly with sample text
 */

import { memo, useMemo, forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import { Box, Typography, Tooltip, Skeleton } from '@mui/material';
import { Sparkles, Zap, Wind, Flame, Ghost, Move, RotateCcw } from 'lucide-react';
import { StyleConfig } from '../../types';
import { assToHex } from '../../utils/colorConvert';

interface StaticPresetPreviewProps {
  preset: StyleConfig;
  height?: number;
  sampleText?: string;
  showMultipleWords?: boolean;
  showEffectIcon?: boolean;
}

export interface StaticPresetPreviewRef {
  captureAsImage: () => Promise<string | null>;
}

// Sample words for preview - mix of styles like ClipMagic
const SAMPLE_WORDS = ['Sample', 'Text'];

// Effect types that use box/highlight style
const BOX_EFFECT_TYPES = ['box', 'highlight', 'karaoke', 'word_box', 'sentence_box', 'group_box'];

// Effect type to icon mapping
const EFFECT_ICONS: Record<string, React.ElementType> = {
  bounce: Move,
  shake: Wind,
  pop: Zap,
  zoom: Sparkles,
  fire: Flame,
  flame: Flame,
  phoenix: Flame,
  ghost: Ghost,
  horror: Ghost,
  spin: RotateCcw,
  rotate: RotateCcw,
  glitch: Zap,
  neon: Sparkles,
  glow: Sparkles,
  pulse: Sparkles,
};

// Global font cache to prevent reloading
const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<boolean>>();

// Get animation icon for effect type
function getEffectIcon(effectType: string | undefined): React.ElementType | null {
  if (!effectType) return null;
  const lower = effectType.toLowerCase();
  for (const [key, icon] of Object.entries(EFFECT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return null;
}

// Check if effect uses box style
function usesBoxStyle(effectType: string | undefined): boolean {
  if (!effectType) return false;
  const lower = effectType.toLowerCase();
  return BOX_EFFECT_TYPES.some(t => lower.includes(t));
}

// Check if effect uses gradient
function usesGradient(effectType: string | undefined): boolean {
  if (!effectType) return false;
  const lower = effectType.toLowerCase();
  return lower.includes('gradient') || lower.includes('rainbow') || lower.includes('neon');
}

// Convert ASS color to CSS rgba - memoized outside component
const colorCache = new Map<string, string>();
function assColorToCss(assColor: string | undefined, alpha: number = 1): string {
  if (!assColor) return `rgba(255, 255, 255, ${alpha})`;
  
  const cacheKey = `${assColor}_${alpha}`;
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)!;
  }
  
  let result = `rgba(255, 255, 255, ${alpha})`;
  
  // Handle both formats: &H00FFFFFF or #FFFFFF
  let hex = assColor;
  if (hex.startsWith('&H')) {
    // ASS format: &HAABBGGRR - extract and convert to RGB
    hex = hex.replace(/&H/gi, '').replace(/&/g, '');
    if (hex.length >= 6) {
      // ASS is BBGGRR, we need RRGGBB
      const bb = hex.slice(-6, -4) || hex.slice(0, 2);
      const gg = hex.slice(-4, -2) || hex.slice(2, 4);
      const rr = hex.slice(-2) || hex.slice(4, 6);
      result = `rgba(${parseInt(rr, 16)}, ${parseInt(gg, 16)}, ${parseInt(bb, 16)}, ${alpha})`;
    }
  } else {
    // Try hex format
    const hexColor = assToHex(assColor);
    if (hexColor && hexColor.startsWith('#')) {
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      result = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  
  colorCache.set(cacheKey, result);
  return result;
}

const StaticPresetPreviewComponent = forwardRef<StaticPresetPreviewRef, StaticPresetPreviewProps>(
  ({ preset, height = 80, sampleText, showMultipleWords = true, showEffectIcon = true }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fontName = preset.font || '';
    
    // Check if font is already loaded (sync check first)
    const [fontReady, setFontReady] = useState(() => !fontName || loadedFonts.has(fontName));
    
    // Load custom font with global cache
    useEffect(() => {
      if (!fontName) {
        setFontReady(true);
        return;
      }
      
      // Already loaded
      if (loadedFonts.has(fontName)) {
        setFontReady(true);
        return;
      }
      
      // Already loading - wait for it
      if (loadingFonts.has(fontName)) {
        loadingFonts.get(fontName)!.then(() => setFontReady(true));
        return;
      }
      
      // Start loading
      const loadPromise = (async () => {
        const possibleFiles = [
          `${fontName.replace(/\s+/g, '')}-Regular.ttf`,
          `${fontName.replace(/\s+/g, '')}-ExtraBold.ttf`,
          `${fontName.replace(/\s+/g, '')}-Bold.ttf`,
          `${fontName.replace(/\s+/g, '')}.ttf`,
          `${fontName}.ttf`,
        ];
        
        for (const file of possibleFiles) {
          try {
            const fontUrl = `/fonts/${encodeURIComponent(file)}`;
            const font = new FontFace(fontName, `url(${fontUrl})`);
            await font.load();
            document.fonts.add(font);
            loadedFonts.add(fontName);
            return true;
          } catch {
            // Try next file
          }
        }
        // Fallback - font not found, mark as loaded anyway
        loadedFonts.add(fontName);
        return true;
      })();
      
      loadingFonts.set(fontName, loadPromise);
      
      // Add timeout fallback
      const timeout = setTimeout(() => {
        loadedFonts.add(fontName);
        setFontReady(true);
      }, 1500);
      
      loadPromise.then(() => {
        clearTimeout(timeout);
        setFontReady(true);
      });
      
      return () => clearTimeout(timeout);
    }, [fontName]);
    
    // Build CSS text shadow for outline + shadow
    const textShadow = useMemo(() => {
      const shadows: string[] = [];
      
      // Outline (stroke effect using multiple shadows)
      const outlineColor = assColorToCss(preset.outline_color);
      const outlineSize = Math.min(preset.border || 2, 6);
      
      if (outlineSize > 0) {
        // Create outline using 8-direction shadows
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const x = Math.round(Math.cos(angle) * outlineSize);
          const y = Math.round(Math.sin(angle) * outlineSize);
          shadows.push(`${x}px ${y}px 0 ${outlineColor}`);
        }
        // Add more for thicker outline
        if (outlineSize > 2) {
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 + Math.PI / 8;
            const x = Math.round(Math.cos(angle) * (outlineSize * 0.7));
            const y = Math.round(Math.sin(angle) * (outlineSize * 0.7));
            shadows.push(`${x}px ${y}px 0 ${outlineColor}`);
          }
        }
      }
      
      // Drop shadow
      const shadowColor = assColorToCss(preset.shadow_color || preset.back_color, 0.8);
      const shadowSize = preset.shadow || 0;
      if (shadowSize > 0) {
        const blur = preset.shadow_blur || 0;
        shadows.push(`${shadowSize}px ${shadowSize}px ${blur}px ${shadowColor}`);
      }
      
      return shadows.join(', ');
    }, [preset.outline_color, preset.border, preset.shadow_color, preset.back_color, preset.shadow, preset.shadow_blur]);
    
    // Expose capture method
    useImperativeHandle(ref, () => ({
      captureAsImage: async (): Promise<string | null> => {
        const container = containerRef.current;
        if (!container) return null;
        
        try {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(container, {
            backgroundColor: '#1a1a2e',
            scale: 2,
            logging: false,
            useCORS: true,
          });
          return canvas.toDataURL('image/png');
        } catch (e) {
          console.error('Failed to capture preview:', e);
          return null;
        }
      }
    }), []);
    
    const primaryColor = assColorToCss(preset.primary_color);
    const secondaryColor = assColorToCss(preset.secondary_color);
    const fontSize = Math.min(Math.max(preset.font_size || 48, 16), 72);
    // Scale font size for preview
    const scaledFontSize = Math.min(fontSize * 0.5, height * 0.5);
    
    const words = sampleText 
      ? [sampleText] 
      : (showMultipleWords ? SAMPLE_WORDS : [SAMPLE_WORDS[0]]);
    
    // Check for box/highlight style
    const hasBoxStyle = usesBoxStyle(preset.effect_type);
    const boxColor = assColorToCss(preset.secondary_color || preset.back_color, 0.85);
    
    // Check for gradient style
    const hasGradient = usesGradient(preset.effect_type);
    const gradientColors = hasGradient 
      ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || '#ff00ff'})`
      : null;
    
    // Get animation icon
    const EffectIcon = getEffectIcon(preset.effect_type);
    
    // Font loading state - only show skeleton on first load
    const showSkeleton = !fontReady && !loadedFonts.has(fontName);
    
    return (
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: height,
          bgcolor: '#1a1a2e',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          gap: 1,
          px: 2,
          position: 'relative',
        }}
      >
        {/* Loading skeleton while font loads - only on initial load */}
        {showSkeleton && (
          <Box sx={{ display: 'flex', gap: 1, position: 'absolute' }}>
            <Skeleton 
              variant="text" 
              width={60} 
              height={scaledFontSize * 1.2}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />
            {showMultipleWords && (
              <Skeleton 
                variant="text" 
                width={40} 
                height={scaledFontSize * 1.2}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
              />
            )}
          </Box>
        )}
        
        {/* Animation Effect Icon */}
        {showEffectIcon && EffectIcon && (
          <Tooltip title={`Effect: ${preset.effect_type}`} arrow>
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EffectIcon size={12} color="#fff" />
            </Box>
          </Tooltip>
        )}
        
        {words.map((word, index) => (
          <Typography
            key={index}
            component="span"
            sx={{
              fontFamily: fontReady && fontName ? `"${fontName}", sans-serif` : 'sans-serif',
              fontSize: `${scaledFontSize}px`,
              fontWeight: preset.bold ? 700 : 400,
              fontStyle: preset.italic ? 'italic' : 'normal',
              // Gradient text or solid color
              ...(hasGradient ? {
                background: gradientColors,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              } : {
                // Word highlighting: second word uses secondary color
                color: index === 1 && showMultipleWords ? secondaryColor : primaryColor,
              }),
              textShadow: hasGradient ? 'none' : (textShadow || 'none'),
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              // Box/Highlight effect
              ...(hasBoxStyle && {
                bgcolor: boxColor,
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
              }),
              // Add slight blur effect if specified
              filter: preset.blur ? `blur(${Math.min(preset.blur, 2)}px)` : 'none',
              // Prevent text selection
              userSelect: 'none',
              WebkitUserSelect: 'none',
              // Smooth appearance - no opacity toggle on re-renders
              opacity: showSkeleton ? 0 : 1,
              transition: showSkeleton ? 'opacity 0.2s ease-in-out' : 'none',
            }}
          >
            {word}
          </Typography>
        ))}
      </Box>
    );
  }
);

StaticPresetPreviewComponent.displayName = 'StaticPresetPreview';

// Custom comparison for memo - only re-render if visual properties change
const arePropsEqual = (prev: StaticPresetPreviewProps, next: StaticPresetPreviewProps): boolean => {
  // Quick reference check
  if (prev === next) return true;
  
  // Check non-preset props
  if (prev.height !== next.height || 
      prev.sampleText !== next.sampleText || 
      prev.showMultipleWords !== next.showMultipleWords ||
      prev.showEffectIcon !== next.showEffectIcon) {
    return false;
  }
  
  // Check only visual properties of preset
  const p = prev.preset;
  const n = next.preset;
  
  return (
    p.font === n.font &&
    p.font_size === n.font_size &&
    p.primary_color === n.primary_color &&
    p.secondary_color === n.secondary_color &&
    p.outline_color === n.outline_color &&
    p.shadow_color === n.shadow_color &&
    p.back_color === n.back_color &&
    p.bold === n.bold &&
    p.italic === n.italic &&
    p.border === n.border &&
    p.shadow === n.shadow &&
    p.shadow_blur === n.shadow_blur &&
    p.blur === n.blur &&
    p.effect_type === n.effect_type
  );
};

export const StaticPresetPreview = memo(StaticPresetPreviewComponent, arePropsEqual);
export default StaticPresetPreview;
