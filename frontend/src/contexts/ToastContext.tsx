/**
 * Toast Notification Context
 * 
 * Global toast notification system with Lottie animations
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  IconButton,
  Slide,
  SlideProps,
  alpha,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'connection-error';

export interface ToastOptions {
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState extends ToastOptions {
  id: number;
  open: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConnectionError: (onRetry?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

// Connection Error Icons (inline SVG for reliability)
const ConnectionErrorIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0 150;150 150" dur="1s" fill="freeze" />
    </circle>
    <path d="M16 24C16 19.5817 19.5817 16 24 16M24 16C28.4183 16 32 19.5817 32 24M24 16V12" 
          stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.5s" fill="freeze" />
    </path>
    <circle cx="24" cy="30" r="2" fill="#ef4444">
      <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <line x1="14" y1="34" x2="34" y2="14" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="stroke-dasharray" values="0 30;30 30" dur="0.5s" begin="0.8s" fill="freeze" />
    </line>
  </svg>
);

const SuccessIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="#22c55e" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0 120;120 120" dur="0.6s" fill="freeze" />
    </circle>
    <path d="M12 20L17 25L28 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <animate attributeName="stroke-dasharray" values="0 25;25 25" dur="0.4s" begin="0.4s" fill="freeze" />
    </path>
  </svg>
);

const WarningIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4L38 36H2L20 4Z" stroke="#f59e0b" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0 100;100 100" dur="0.6s" fill="freeze" />
    </path>
    <line x1="20" y1="16" x2="20" y2="24" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
      <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.4s" fill="freeze" />
    </line>
    <circle cx="20" cy="30" r="1.5" fill="#f59e0b">
      <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.6s" fill="freeze" />
    </circle>
  </svg>
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [idCounter, setIdCounter] = useState(0);

  const showToast = useCallback((options: ToastOptions) => {
    const id = idCounter;
    setIdCounter(prev => prev + 1);
    
    setToasts(prev => [...prev, { ...options, id, open: true }]);
  }, [idCounter]);

  const hideToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, open: false } : t));
    // Remove from array after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', message, title, duration: 4000 });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', message, title, duration: 6000 });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', message, title, duration: 5000 });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', message, title, duration: 4000 });
  }, [showToast]);

  const showConnectionError = useCallback((onRetry?: () => void) => {
    showToast({
      type: 'connection-error',
      title: 'Bağlantı Hatası',
      message: 'Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.',
      duration: 10000,
      action: onRetry ? { label: 'Tekrar Dene', onClick: onRetry } : undefined,
    });
  }, [showToast]);

  const getAlertSeverity = (type: ToastType) => {
    if (type === 'connection-error') return 'error';
    return type;
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'connection-error':
        return <ConnectionErrorIcon />;
      default:
        return undefined;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, showConnectionError }}>
      {children}
      
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          autoHideDuration={toast.duration || 5000}
          onClose={() => hideToast(toast.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ 
            bottom: { xs: 16 + index * 80, sm: 24 + index * 80 },
            zIndex: theme.zIndex.snackbar + index,
          }}
        >
          {toast.type === 'connection-error' ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: alpha(theme.palette.error.dark, 0.95),
                borderRadius: 2,
                boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.3)}`,
                border: `1px solid ${alpha(theme.palette.error.light, 0.3)}`,
                backdropFilter: 'blur(10px)',
                minWidth: 320,
                maxWidth: 450,
              }}
            >
              <Box sx={{ flexShrink: 0 }}>
                <ConnectionErrorIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} color="white">
                  {toast.title}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  {toast.message}
                </Typography>
                {toast.action && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small"
                      onClick={toast.action.onClick}
                      sx={{ 
                        color: 'white',
                        bgcolor: alpha('#fff', 0.1),
                        '&:hover': { bgcolor: alpha('#fff', 0.2) },
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                      variant="body2" 
                      color="white" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={toast.action.onClick}
                    >
                      {toast.action.label}
                    </Typography>
                  </Box>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => hideToast(toast.id)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Alert
              severity={getAlertSeverity(toast.type)}
              icon={getIcon(toast.type)}
              onClose={() => hideToast(toast.id)}
              sx={{
                minWidth: 300,
                boxShadow: theme.shadows[8],
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                },
              }}
            >
              {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
              {toast.message}
            </Alert>
          )}
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
