/**
 * Embedded Python & FFmpeg Hazırlama Script'i
 * 
 * Bu script Python Embedded'ı ve FFmpeg'i indirir, gerekli paketleri kurar.
 * Build öncesinde çalıştırılmalıdır.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PYTHON_VERSION = '3.11.7';
const PYTHON_EMBED_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const GET_PIP_URL = 'https://bootstrap.pypa.io/get-pip.py';

// FFmpeg essentials build (smaller than full build)
const FFMPEG_URL = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

const ELECTRON_DIR = path.resolve(__dirname, '..');
const PYTHON_DIR = path.join(ELECTRON_DIR, 'python-embedded');
const FFMPEG_DIR = path.join(ELECTRON_DIR, 'ffmpeg');
const BACKEND_DIR = path.join(ELECTRON_DIR, '..', 'backend');

// Gerekli Python paketleri (requirements.txt'ye ek olarak)
const REQUIRED_PACKAGES = [
  'uvicorn[standard]',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const file = fs.createWriteStream(dest);
    
    const doRequest = (requestUrl) => {
      https.get(requestUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Redirect
          doRequest(response.headers.location);
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      }).on('error', reject);
    };
    
    doRequest(url);
  });
}

function extractZipWithPowerShell(zipPath, destPath) {
  console.log(`Extracting: ${zipPath} -> ${destPath}`);
  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force"`,
    { stdio: 'inherit' }
  );
}

async function preparePython() {
  console.log('='.repeat(50));
  console.log('Embedded Python Hazırlanıyor...');
  console.log('='.repeat(50));

  // Klasör oluştur
  if (fs.existsSync(PYTHON_DIR)) {
    console.log('Mevcut Python klasörü siliniyor...');
    fs.rmSync(PYTHON_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PYTHON_DIR, { recursive: true });

  // Python Embedded indir
  const zipPath = path.join(PYTHON_DIR, 'python-embed.zip');
  await download(PYTHON_EMBED_URL, zipPath);
  extractZipWithPowerShell(zipPath, PYTHON_DIR);
  fs.unlinkSync(zipPath);

  // python311._pth dosyasını düzenle (import site ekle)
  const pthFile = path.join(PYTHON_DIR, `python311._pth`);
  if (fs.existsSync(pthFile)) {
    let content = fs.readFileSync(pthFile, 'utf8');
    // "import site" satırını uncomment et
    content = content.replace('#import site', 'import site');
    // Lib klasörünü ekle
    content += '\nLib\nLib\\site-packages\n';
    fs.writeFileSync(pthFile, content);
    console.log('python311._pth güncellendi');
  }

  // get-pip.py indir ve çalıştır
  const getPipPath = path.join(PYTHON_DIR, 'get-pip.py');
  await download(GET_PIP_URL, getPipPath);

  const pythonExe = path.join(PYTHON_DIR, 'python.exe');
  console.log('pip kuruluyor...');
  execSync(`"${pythonExe}" "${getPipPath}" --no-warn-script-location`, {
    cwd: PYTHON_DIR,
    stdio: 'inherit'
  });

  // Lib/site-packages klasörü oluştur
  const sitePackages = path.join(PYTHON_DIR, 'Lib', 'site-packages');
  fs.mkdirSync(sitePackages, { recursive: true });

  // Backend requirements.txt'den kur
  const requirementsPath = path.join(BACKEND_DIR, 'requirements.txt');
  const pipExe = path.join(PYTHON_DIR, 'Scripts', 'pip.exe');
  
  if (fs.existsSync(requirementsPath)) {
    console.log('Backend requirements kuruluyor...');
    try {
      execSync(`"${pipExe}" install -r "${requirementsPath}" --no-warn-script-location --target "${sitePackages}"`, {
        cwd: PYTHON_DIR,
        stdio: 'inherit'
      });
    } catch (e) {
      console.error('Bazı backend requirements kurulamadı:', e.message);
    }
  }

  // Ekstra paketleri kur
  for (const pkg of REQUIRED_PACKAGES) {
    console.log(`  Kuruluyor: ${pkg}`);
    try {
      execSync(`"${pipExe}" install "${pkg}" --no-warn-script-location --target "${sitePackages}"`, {
        cwd: PYTHON_DIR,
        stdio: 'inherit'
      });
    } catch (e) {
      console.error(`  Hata: ${pkg} kurulamadı`);
    }
  }

  // Temizlik
  fs.unlinkSync(getPipPath);

  console.log('='.repeat(50));
  console.log('Python hazırlama tamamlandı!');
  console.log(`Konum: ${PYTHON_DIR}`);
  console.log('='.repeat(50));
}

async function prepareFFmpeg() {
  console.log('='.repeat(50));
  console.log('FFmpeg Hazırlanıyor...');
  console.log('='.repeat(50));

  // Klasör oluştur
  if (fs.existsSync(FFMPEG_DIR)) {
    console.log('Mevcut FFmpeg klasörü siliniyor...');
    fs.rmSync(FFMPEG_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FFMPEG_DIR, { recursive: true });

  // FFmpeg indir
  const zipPath = path.join(FFMPEG_DIR, 'ffmpeg.zip');
  await download(FFMPEG_URL, zipPath);
  
  // Geçici klasöre çıkar
  const tempDir = path.join(FFMPEG_DIR, 'temp');
  extractZipWithPowerShell(zipPath, tempDir);
  fs.unlinkSync(zipPath);

  // İç klasörü bul ve bin içeriğini kopyala
  const extractedDirs = fs.readdirSync(tempDir);
  const ffmpegInnerDir = extractedDirs.find(d => d.startsWith('ffmpeg'));
  
  if (ffmpegInnerDir) {
    const binDir = path.join(tempDir, ffmpegInnerDir, 'bin');
    if (fs.existsSync(binDir)) {
      // Sadece ffmpeg.exe ve ffprobe.exe'yi kopyala
      const filesToCopy = ['ffmpeg.exe', 'ffprobe.exe'];
      for (const file of filesToCopy) {
        const src = path.join(binDir, file);
        const dest = path.join(FFMPEG_DIR, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`  Kopyalandı: ${file}`);
        }
      }
    }
  }

  // Temp klasörünü temizle
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('='.repeat(50));
  console.log('FFmpeg hazırlama tamamlandı!');
  console.log(`Konum: ${FFMPEG_DIR}`);
  console.log('='.repeat(50));
}

async function main() {
  try {
    await preparePython();
    await prepareFFmpeg();
    console.log('\n✅ Tüm bağımlılıklar hazırlandı!');
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

main();
