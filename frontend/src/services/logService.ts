/**
 * Frontend Logging Service
 * 
 * Comprehensive logging for the frontend with:
 * - Console output (colored)
 * - Remote error reporting
 * - Performance tracking
 * - User action logging
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  module?: string;
  data?: any;
  stack?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

// Configuration
const CONFIG = {
  minLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: import.meta.env.PROD,
  remoteEndpoint: '/api/logs',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxQueueSize: 100,
};

// Session ID (unique per browser session)
const SESSION_ID = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

// Log queue for batching
let logQueue: LogEntry[] = [];
let flushTimer: number | null = null;

// Console colors
const CONSOLE_STYLES = {
  [LogLevel.DEBUG]: 'color: #9E9E9E',
  [LogLevel.INFO]: 'color: #2196F3',
  [LogLevel.WARN]: 'color: #FF9800; font-weight: bold',
  [LogLevel.ERROR]: 'color: #F44336; font-weight: bold',
  [LogLevel.FATAL]: 'color: #9C27B0; font-weight: bold; background: #FFEBEE',
};

const LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

const LEVEL_ICONS = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌',
  [LogLevel.FATAL]: '💀',
};

/**
 * Format timestamp for logging
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  module?: string,
  data?: any,
  error?: Error
): LogEntry {
  return {
    timestamp: getTimestamp(),
    level,
    levelName: LEVEL_NAMES[level],
    message,
    module,
    data: data ? JSON.parse(JSON.stringify(data)) : undefined,
    stack: error?.stack,
    sessionId: SESSION_ID,
    url: window.location.href,
    userAgent: navigator.userAgent.slice(0, 200),
  };
}

/**
 * Output to console
 */
function logToConsole(entry: LogEntry): void {
  if (!CONFIG.enableConsole) return;
  
  const style = CONSOLE_STYLES[entry.level];
  const icon = LEVEL_ICONS[entry.level];
  const time = entry.timestamp.split('T')[1].split('.')[0];
  const module = entry.module ? `[${entry.module}]` : '';
  
  const prefix = `%c${icon} ${time} ${entry.levelName} ${module}`;
  const consoleMethod = entry.level >= LogLevel.ERROR ? console.error :
                        entry.level >= LogLevel.WARN ? console.warn :
                        entry.level >= LogLevel.INFO ? console.info :
                        console.debug;
  
  if (entry.data || entry.stack) {
    consoleMethod(prefix, style, entry.message);
    if (entry.data) console.dir(entry.data);
    if (entry.stack) console.debug(entry.stack);
  } else {
    consoleMethod(prefix, style, entry.message);
  }
}

/**
 * Add entry to remote queue
 */
function queueForRemote(entry: LogEntry): void {
  if (!CONFIG.enableRemote) return;
  if (entry.level < LogLevel.WARN) return; // Only send warnings and above
  
  logQueue.push(entry);
  
  // Trim queue if too large
  if (logQueue.length > CONFIG.maxQueueSize) {
    logQueue = logQueue.slice(-CONFIG.maxQueueSize);
  }
  
  // Immediate flush for errors
  if (entry.level >= LogLevel.ERROR) {
    flushLogs();
  } else if (!flushTimer) {
    flushTimer = window.setTimeout(flushLogs, CONFIG.flushInterval);
  }
}

/**
 * Flush logs to remote server
 */
async function flushLogs(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  if (logQueue.length === 0) return;
  
  const logsToSend = [...logQueue];
  logQueue = [];
  
  try {
    await fetch(CONFIG.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
      keepalive: true,
    });
  } catch (error) {
    // Re-queue logs on failure (limited)
    if (logQueue.length < CONFIG.maxQueueSize / 2) {
      logQueue.unshift(...logsToSend.slice(0, 10));
    }
  }
}

/**
 * Main log function
 */
function log(level: LogLevel, message: string, module?: string, data?: any, error?: Error): void {
  if (level < CONFIG.minLevel) return;
  
  const entry = createLogEntry(level, message, module, data, error);
  logToConsole(entry);
  queueForRemote(entry);
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, module, data),
    info: (message: string, data?: any) => log(LogLevel.INFO, message, module, data),
    warn: (message: string, data?: any) => log(LogLevel.WARN, message, module, data),
    error: (message: string, error?: Error | any, data?: any) => {
      if (error instanceof Error) {
        log(LogLevel.ERROR, message, module, data, error);
      } else {
        log(LogLevel.ERROR, message, module, { ...data, errorDetails: error });
      }
    },
    fatal: (message: string, error?: Error, data?: any) => log(LogLevel.FATAL, message, module, data, error),
    
    // API request logging
    requestLog: (method: string, url: string, status: number, duration: number) => {
      const statusEmoji = status === 0 ? '🔴' : status < 400 ? '✅' : status < 500 ? '⚠️' : '❌';
      const message = `${statusEmoji} ${method} ${url} [${status}] ${duration}ms`;
      const level = status === 0 || status >= 500 ? LogLevel.ERROR : 
                    status >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
      log(level, message, module, { method, url, status, duration });
    },
    
    // Performance logging
    time: (label: string) => {
      if (CONFIG.minLevel <= LogLevel.DEBUG) {
        console.time(`[${module}] ${label}`);
      }
    },
    timeEnd: (label: string) => {
      if (CONFIG.minLevel <= LogLevel.DEBUG) {
        console.timeEnd(`[${module}] ${label}`);
      }
    },
    
    // Group logging
    group: (label: string) => {
      if (CONFIG.minLevel <= LogLevel.DEBUG) {
        console.group(`[${module}] ${label}`);
      }
    },
    groupEnd: () => {
      if (CONFIG.minLevel <= LogLevel.DEBUG) {
        console.groupEnd();
      }
    },
  };
}

// Default logger
export const logger = createLogger('app');

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    log(LogLevel.ERROR, event.message, 'global', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    log(LogLevel.ERROR, 'Unhandled Promise Rejection', 'global', {
      reason: String(event.reason),
    });
  });
  
  // Flush logs before page unload
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });
}

// Export utilities
export { flushLogs };
export type { LogEntry };
