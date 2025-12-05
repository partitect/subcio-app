/**
 * Subcio Desktop Build Script
 * 
 * Bu script tüm build sürecini yönetir:
 * 1. Frontend build
 * 2. Python embedded hazırla
 * 3. FFmpeg hazırla
 * 4. Backend kopyala
 * 5. Electron build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const ELECTRON_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const PYTHON_DIR = path.join(ELECTRON_DIR, 'python-embedded');
const FFMPEG_DIR = path.join(ELECTRON_DIR, 'ffmpeg');
const FRONTEND_DIST = path.join(ELECTRON_DIR, 'frontend-dist');
const BACKEND_COPY = path.join(ELECTRON_DIR, 'backend');

function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Exclude patterns
    if (exclude.some(pattern => entry.name.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function build() {
  console.log('='.repeat(60));
  console.log('  SUBCIO DESKTOP BUILD');
  console.log('='.repeat(60));

  // 1. Frontend Build (sadece kopyala, build zaten yapıldı)
  console.log('\n[1/4] Frontend kopyalanıyor...');

  // Frontend dist varsa build atla
  // Frontend build zaten build-exe.bat tarafindan yapiliyor
  console.log('  Frontend build kontrol ediliyor...');
  if (!fs.existsSync(path.join(FRONTEND_DIR, 'dist'))) {
    console.log('  Frontend dist bulunamadi, build ediliyor...');
    execSync('npm run build', {
      cwd: FRONTEND_DIR,
      stdio: 'inherit'
    });
  } else {
    console.log('  Frontend dist mevcut, build atlanıyor.');
  }

  // Frontend dist'i electron klasörüne kopyala
  if (fs.existsSync(FRONTEND_DIST)) {
    fs.rmSync(FRONTEND_DIST, { recursive: true });
  }
  copyDir(path.join(FRONTEND_DIR, 'dist'), FRONTEND_DIST);
  console.log('  Frontend build kopyalandı');

  // 2. Python Embedded ve FFmpeg hazırla
  console.log('\n[2/4] Python embedded ve FFmpeg hazırlanıyor...');
  if (!fs.existsSync(PYTHON_DIR) || !fs.existsSync(FFMPEG_DIR)) {
    execSync('node scripts/prepare-python.js', {
      cwd: ELECTRON_DIR,
      stdio: 'inherit'
    });
  } else {
    console.log('  Python ve FFmpeg zaten mevcut, atlanıyor...');
  }

  // 3. Backend kopyala
  console.log('\n[3/4] Backend kopyalanıyor...');
  if (fs.existsSync(BACKEND_COPY)) {
    fs.rmSync(BACKEND_COPY, { recursive: true });
  }

  copyDir(BACKEND_DIR, BACKEND_COPY, [
    '__pycache__',
    '.pyc',
    'uploads',
    'exports',
    'logs',
    '.env',
    'test_',
  ]);

  // Gerekli klasörleri oluştur
  fs.mkdirSync(path.join(BACKEND_COPY, 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(BACKEND_COPY, 'exports'), { recursive: true });
  fs.mkdirSync(path.join(BACKEND_COPY, 'logs'), { recursive: true });
  console.log('  Backend kopyalandı');

  // 4. package.json'daki files ayarlarını kontrol et
  console.log('\n[4/4] Build tamamlandı!');
  console.log('\nŞimdi electron-builder çalıştırılabilir:');
  console.log('  npm run build:win');

  console.log('\n' + '='.repeat(60));
}

build().catch(console.error);
