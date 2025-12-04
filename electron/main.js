const { app, BrowserWindow, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Paths
const isDev = !app.isPackaged;
const resourcesPath = isDev 
  ? path.join(__dirname, '..') 
  : path.join(process.resourcesPath);

const backendPath = isDev 
  ? path.join(resourcesPath, 'backend')
  : path.join(resourcesPath, 'backend');

const pythonPath = isDev
  ? path.join(resourcesPath, '.venv', 'Scripts', 'python.exe')
  : path.join(resourcesPath, 'python-env', 'Scripts', 'python.exe');

const frontendPath = isDev
  ? null  // Dev mode'da Vite server kullan
  : path.join(resourcesPath, 'frontend');

// URLs
const BACKEND_URL = 'http://127.0.0.1:8000';
const FRONTEND_URL = isDev ? 'http://localhost:5173' : `file://${path.join(frontendPath, 'index.html')}`;

// Global references
let mainWindow = null;
let tray = null;
let backendProcess = null;
let isQuitting = false;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Create main window
function createWindow() {
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
      // FFmpeg.wasm için gerekli
      crossOriginIsolated: true
    },
    titleBarStyle: 'default',
    show: false, // Hazır olana kadar gizle
  });

  // Loading ekranı göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Dev tools
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

  // Close to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

// Start backend server
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend...');
    console.log('Python path:', pythonPath);
    console.log('Backend path:', backendPath);

    backendProcess = spawn(pythonPath, [
      '-m', 'uvicorn', 
      'main:app', 
      '--host', '127.0.0.1', 
      '--port', '8000'
    ], {
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'
      }
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data}`);
      if (data.toString().includes('Application startup complete')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data}`);
      // Uvicorn startup messages go to stderr
      if (data.toString().includes('Application startup complete')) {
        resolve();
      }
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });

    // Timeout fallback
    setTimeout(() => resolve(), 5000);
  });
}

// Wait for backend to be ready
function waitForBackend(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      const req = http.get(`${BACKEND_URL}/api/health`, (res) => {
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
        reject(new Error('Backend failed to start'));
      }
    };

    check();
  });
}

// Stop backend
function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// Create system tray
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Subcio Aç', 
      click: () => mainWindow.show() 
    },
    { type: 'separator' },
    { 
      label: 'Tarayıcıda Aç', 
      click: () => shell.openExternal('http://localhost:5173') 
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
    mainWindow.show();
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
          click: () => mainWindow.webContents.send('new-project')
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
          label: 'Hakkında',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Subcio Hakkında',
              message: 'Subcio - AI Karaoke Subtitle Editor',
              detail: 'Versiyon 1.0.0\n\nAI destekli karaoke altyazı düzenleme uygulaması.'
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
    // Splash/loading gösterilebilir
    console.log('Subcio Desktop başlatılıyor...');

    // Backend başlat
    await startBackend();
    console.log('Backend başlatıldı, bekleniyor...');

    // Backend hazır olana kadar bekle
    await waitForBackend();
    console.log('Backend hazır!');

    // UI oluştur
    createWindow();
    createMenu();
    createTray();

    // Frontend yükle
    if (isDev) {
      // Dev mode - Vite server
      mainWindow.loadURL('http://localhost:5173');
    } else {
      // Production - local files
      mainWindow.loadFile(path.join(frontendPath, 'index.html'));
    }

  } catch (error) {
    console.error('Startup error:', error);
    dialog.showErrorBox('Başlatma Hatası', `Subcio başlatılamadı:\n${error.message}`);
    app.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, minimize to tray
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
