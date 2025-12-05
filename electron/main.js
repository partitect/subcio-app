const { app, BrowserWindow, Menu, Tray, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Logging
const log = require('electron-log');
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';

// Paths - Development vs Production
const isDev = !app.isPackaged;
console.log('[Electron] isDev:', isDev, 'app.isPackaged:', app.isPackaged);

function getAppPath() {
  if (isDev) {
    return path.join(__dirname, '..');
  } else {
    // Production: app klasörünün içindeyiz
    return path.dirname(app.getPath('exe'));
  }
}

function getPaths() {
  const appPath = getAppPath();

  if (isDev) {
    // Development mode
    return {
      pythonExe: path.join(appPath, '.venv', 'Scripts', 'python.exe'),
      backendDir: path.join(appPath, 'backend'),
      frontendDir: null, // Vite server kullan
      frontendUrl: 'http://localhost:5173',
      ffmpegDir: null, // System FFmpeg kullan
    };
  } else {
    // Production mode - embedded Python and FFmpeg
    // asar: false olduğu için app.asar yerine app klasörü
    const appDir = path.join(path.dirname(app.getPath('exe')), 'resources', 'app');
    return {
      pythonExe: path.join(appDir, 'python-embedded', 'python.exe'),
      backendDir: path.join(appDir, 'backend'),
      frontendDir: path.join(appDir, 'frontend-dist'),
      frontendUrl: null, // file:// kullan
      ffmpegDir: path.join(appDir, 'ffmpeg'),
    };
  }
}

const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Global references
let mainWindow = null;
let splashWindow = null;
let tray = null;
let backendProcess = null;
let isQuitting = false;

// Disable GPU cache to prevent disk_cache errors
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Create splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 15px;
          font-family: 'Segoe UI', sans-serif;
          color: white;
        }
        .logo {
          font-size: 48px;
          font-weight: bold;
          background: linear-gradient(90deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        .status {
          font-size: 14px;
          color: #888;
          margin-top: 20px;
        }
        .loader {
          width: 50px;
          height: 50px;
          border: 3px solid #333;
          border-top: 3px solid #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="logo">Subcio</div>
      <div class="loader"></div>
      <div class="status" id="status">Başlatılıyor...</div>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('status', (event, msg) => {
          document.getElementById('status').textContent = msg;
        });
      </script>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
}

function updateSplashStatus(message) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('status', message);
  }
  log.info(`[Splash] ${message}`);
}

// Create main window
function createMainWindow() {
  const paths = getPaths();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev, // Disable web security in dev for local file access
    },
    show: false,
    autoHideMenuBar: false, // Show default menu
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Load content
  if (isDev || paths.frontendUrl) {
    mainWindow.loadURL(paths.frontendUrl || 'http://localhost:5173');
  } else {
    // Use file:// protocol for production with proper path
    const indexPath = path.join(paths.frontendDir, 'index.html');
    log.info(`Loading frontend from: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  // Dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // External links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Minimize to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

// =============================================================================
// IPC Handlers - Communication between renderer and main process
// =============================================================================

// Get app version
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

// Open file dialog
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv'] },
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options.defaultPath || 'output.mp4',
    filters: options.filters || [
      { name: 'Video Files', extensions: ['mp4'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePath;
});

// Export video using native FFmpeg
ipcMain.handle('export:video', async (event, options) => {
  const paths = getPaths();

  return new Promise((resolve, reject) => {
    const ffmpegPath = isDev
      ? 'ffmpeg'  // Use system FFmpeg in dev
      : path.join(paths.ffmpegDir, 'ffmpeg.exe');

    const args = options.args || [];

    log.info(`Running FFmpeg: ${ffmpegPath} ${args.join(' ')}`);

    const ffmpegProcess = spawn(ffmpegPath, args, {
      windowsHide: true,
    });

    let stderr = '';

    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // Parse progress from FFmpeg output
      const timeMatch = data.toString().match(/time=(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch && mainWindow) {
        const seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
        mainWindow.webContents.send('export-progress', { seconds, output: data.toString() });
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        if (mainWindow) mainWindow.webContents.send('export-complete', { success: true });
        resolve({ success: true });
      } else {
        if (mainWindow) mainWindow.webContents.send('export-complete', { success: false, error: stderr });
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      log.error('FFmpeg error:', err);
      reject(err);
    });
  });
});

// =============================================================================
// Backend Management
// =============================================================================

// Check if backend is already running
async function checkBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start backend server
async function startBackend() {
  const paths = getPaths();

  log.info('Starting backend...');
  log.info(`Python: ${paths.pythonExe}`);
  log.info(`Backend: ${paths.backendDir}`);

  // Check if backend is already running (useful in dev mode when backend started separately)
  const isRunning = await checkBackendRunning();
  if (isRunning) {
    log.info('Backend already running on port ' + BACKEND_PORT + ', skipping startup');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {

    // Check if Python exists
    if (!fs.existsSync(paths.pythonExe)) {
      const error = new Error(`Python not found: ${paths.pythonExe}`);
      log.error(error.message);
      reject(error);
      return;
    }

    // Check if backend exists
    if (!fs.existsSync(paths.backendDir)) {
      const error = new Error(`Backend not found: ${paths.backendDir}`);
      log.error(error.message);
      reject(error);
      return;
    }

    // Set PYTHONPATH for embedded Python
    const env = { ...process.env };

    // Desktop mode environment variables
    env.SUBCIO_DESKTOP = '1';           // Enable CORS * for file:// origin
    env.USE_LOCAL_WHISPER = '1';        // Use local Whisper model instead of Groq API
    env.APP_ENV = 'desktop';            // Skip production security checks

    if (!isDev) {
      const pythonDir = path.dirname(paths.pythonExe);
      const sitePackages = path.join(pythonDir, 'Lib', 'site-packages');
      env.PYTHONPATH = sitePackages;
      env.PYTHONHOME = pythonDir;

      // Add FFmpeg to PATH for embedded mode
      if (paths.ffmpegDir && fs.existsSync(paths.ffmpegDir)) {
        env.PATH = `${paths.ffmpegDir};${env.PATH || ''}`;
        log.info(`FFmpeg PATH set: ${paths.ffmpegDir}`);
      }
    }

    // Spawn Python process
    backendProcess = spawn(paths.pythonExe, [
      '-m', 'uvicorn',
      'main:app',
      '--host', '127.0.0.1',
      '--port', String(BACKEND_PORT),
    ], {
      cwd: paths.backendDir,
      env: env,
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    log.info(`Backend process spawned with PID: ${backendProcess.pid}`);

    let startupComplete = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      log.info(`[Backend] ${output}`);

      if (output.includes('Application startup complete') || output.includes('Uvicorn running')) {
        startupComplete = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      log.info(`[Backend] ${output}`);

      // Uvicorn logs to stderr
      if (output.includes('Application startup complete') || output.includes('Uvicorn running')) {
        startupComplete = true;
        resolve();
      }
    });

    backendProcess.on('error', (err) => {
      log.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('close', (code) => {
      log.info(`Backend exited with code ${code}`);
      backendProcess = null;

      if (!startupComplete) {
        reject(new Error(`Backend crashed with code ${code}`));
      }
    });

    // Timeout - resolve anyway after 10 seconds
    setTimeout(() => {
      if (!startupComplete) {
        log.warn('Backend startup timeout, continuing anyway...');
        resolve();
      }
    }, 10000);
  });
}

// Wait for backend health check
function waitForBackend(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      updateSplashStatus(`Backend kontrol ediliyor... (${attempts}/${maxAttempts})`);

      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });

      req.on('error', retry);
      req.setTimeout(1000, retry);
    };

    const retry = () => {
      if (attempts < maxAttempts) {
        setTimeout(check, 500);
      } else {
        // Don't reject, try to continue
        log.warn('Backend health check failed, continuing anyway...');
        resolve();
      }
    };

    check();
  });
}

// Stop backend
function stopBackend() {
  if (backendProcess) {
    log.info('Stopping backend...');

    // Windows: Force kill process tree to avoid zombies
    if (process.platform === 'win32') {
      try {
        require('child_process').execSync(`taskkill /pid ${backendProcess.pid} /T /F`);
      } catch (e) {
        // Ignore error if process already dead
      }
    }

    backendProcess.kill(); // Fallback / non-Windows
    backendProcess = null;
  }
}

// Create system tray
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');

  if (!fs.existsSync(iconPath)) {
    log.warn('Tray icon not found:', iconPath);
    return;
  }

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Subcio Aç',
      click: () => mainWindow?.show()
    },
    { type: 'separator' },
    {
      label: 'Yeniden Başlat',
      click: async () => {
        stopBackend();
        await startBackend();
        mainWindow?.reload();
      }
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Subcio - Karaoke Subtitle Editor');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

// App menu
function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Proje',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('new-project')
        },
        { type: 'separator' },
        {
          label: 'Çıkış',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yenile' },
        { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Gerçek Boyut' },
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Log Dosyasını Aç',
          click: () => {
            shell.openPath(log.transports.file.getFile().path);
          }
        },
        { type: 'separator' },
        {
          label: 'Hakkında',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Subcio Hakkında',
              message: 'Subcio - AI Karaoke Subtitle Editor',
              detail: `Versiyon: ${app.getVersion()}\n\nAI destekli karaoke altyazı düzenleme uygulaması.`
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// App ready
app.whenReady().then(async () => {
  try {
    log.info('='.repeat(50));
    log.info('Subcio Desktop starting...');
    log.info(`Mode: ${isDev ? 'Development' : 'Production'}`);
    log.info(`App Path: ${getAppPath()}`);
    log.info('='.repeat(50));

    // Show splash screen
    createSplashWindow();

    // Start backend
    updateSplashStatus('Backend başlatılıyor...');
    await startBackend();

    // Wait for backend to be ready
    updateSplashStatus('Backend hazırlanıyor...');
    await waitForBackend();

    // Create UI
    updateSplashStatus('Arayüz yükleniyor...');
    createMainWindow();
    createMenu();
    createTray();

    log.info('Subcio started successfully!');

  } catch (error) {
    log.error('Startup error:', error);

    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }

    dialog.showErrorBox(
      'Başlatma Hatası',
      `Subcio başlatılamadı:\n\n${error.message}\n\nLog dosyası: ${log.transports.file.getFile().path}`
    );

    app.quit();
  }
});

// Cleanup
app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

app.on('window-all-closed', () => {
  // Don't quit on macOS
  if (process.platform !== 'darwin') {
    // Stay in tray
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else {
    mainWindow?.show();
  }
});
