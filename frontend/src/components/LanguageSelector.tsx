/**
 * LanguageSelector Component
 * 
 * Dropdown menu for selecting the UI language.
 * Supports English, Turkish, Spanish, and German.
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../i18n';

// Flag components as SVG for better compatibility
const FlagUS = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" style={{ borderRadius: 2 }}>
    <rect width="24" height="18" fill="#B22234"/>
    <rect y="1.38" width="24" height="1.38" fill="white"/>
    <rect y="4.15" width="24" height="1.38" fill="white"/>
    <rect y="6.92" width="24" height="1.38" fill="white"/>
    <rect y="9.69" width="24" height="1.38" fill="white"/>
    <rect y="12.46" width="24" height="1.38" fill="white"/>
    <rect y="15.23" width="24" height="1.38" fill="white"/>
    <rect width="9.6" height="9.69" fill="#3C3B6E"/>
  </svg>
);

const FlagTR = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" style={{ borderRadius: 2 }}>
    <rect width="24" height="18" fill="#E30A17"/>
    <circle cx="9" cy="9" r="4.5" fill="white"/>
    <circle cx="10" cy="9" r="3.6" fill="#E30A17"/>
    <polygon points="13,9 14.5,7.5 14,9.5 15.5,8 14,9 15.5,10 14,9.5 14.5,11.5" fill="white"/>
  </svg>
);

const FlagES = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" style={{ borderRadius: 2 }}>
    <rect width="24" height="18" fill="#AA151B"/>
    <rect y="4.5" width="24" height="9" fill="#F1BF00"/>
  </svg>
);

const FlagDE = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" style={{ borderRadius: 2 }}>
    <rect width="24" height="6" fill="#000"/>
    <rect y="6" width="24" height="6" fill="#DD0000"/>
    <rect y="12" width="24" height="6" fill="#FFCE00"/>
  </svg>
);

const FLAGS: Record<string, React.ReactNode> = {
  en: <FlagUS />,
  tr: <FlagTR />,
  es: <FlagES />,
  de: <FlagDE />,
};

interface LanguageSelectorProps {
  variant?: 'icon' | 'full';
  size?: 'small' | 'medium' | 'large';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'icon',
  size = 'medium' 
}) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (langCode: LanguageCode) => {
    i18n.changeLanguage(langCode);
    handleClose();
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0]; // Default to English

  return (
    <Box sx={{ width: variant === 'full' ? 76 : 44, flexShrink: 0 }}>
      <Tooltip title={t('settings.language.select')}>
        <IconButton
          onClick={handleClick}
          size={size}
          sx={{
            color: 'inherit',
            borderRadius: 2,
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            width: variant === 'full' ? 76 : 44,
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: 24, height: 18 }}>
            {FLAGS[currentLanguage.code]}
          </Box>
          {variant === 'full' && (
            <Typography 
              component="span" 
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                width: 20,
                textAlign: 'center',
              }}
            >
              {currentLanguage.code.toUpperCase()}
            </Typography>
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 180,
            borderRadius: 2,
            mt: 1,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            {t('settings.language.title')}
          </Typography>
        </Box>
        <Divider />
        {SUPPORTED_LANGUAGES.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n.language === language.code}
            sx={{
              py: 1.5,
              '&.Mui-selected': {
                bgcolor: 'primary.50',
                '&:hover': {
                  bgcolor: 'primary.100',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {FLAGS[language.code]}
            </ListItemIcon>
            <ListItemText 
              primary={language.name}
              primaryTypographyProps={{
                fontWeight: i18n.language === language.code ? 600 : 400,
              }}
            />
            {i18n.language === language.code && (
              <CheckIcon 
                fontSize="small" 
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
