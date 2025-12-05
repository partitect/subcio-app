@echo off
title Subcio Desktop - EXE Build
cd /d "%~dp0"

:: Admin check
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Admin privileges confirmed.
) else (
    echo UYARI: Yonetici haklariyla calistirilmiyor.
    echo Electron build islemi sembolik link hatasi verebilir.
    echo Lutfen bu dosyayi "Yonetici olarak calistir" secenegi ile acin.
    echo.
    pause
)

echo ========================================
echo   SUBCIO DESKTOP - EXE BUILD
echo ========================================
echo.

:: Node modules kontrolü
if not exist "electron\node_modules" (
    echo [0/4] Electron node_modules kuruluyor...
    cd electron
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [0/4] Frontend node_modules kuruluyor...
    cd frontend
    call npm install
    cd ..
)

:: Build adımları
echo [1/4] Frontend build ediliyor...
cd frontend
call npm run build
if errorlevel 1 (
    echo HATA: Frontend build basarisiz!
    pause
    exit /b 1
)
cd ..

echo [2/4] Electron prebuild calisiyor...
cd electron
call npm run prebuild
if errorlevel 1 (
    echo HATA: Prebuild basarisiz!
    pause
    exit /b 1
)

echo [3/4] Python ve FFmpeg hazirlaniyor...
if not exist "python-embedded\python.exe" (
    call node scripts/prepare-python.js
    if errorlevel 1 (
        echo HATA: Python hazirlama basarisiz!
        pause
        exit /b 1
    )
)

if not exist "ffmpeg\ffmpeg.exe" (
    call node scripts/prepare-python.js
    if errorlevel 1 (
        echo HATA: FFmpeg hazirlama basarisiz!
        pause
        exit /b 1
    )
)

echo [4/4] Electron EXE build ediliyor...
call npm run build
if errorlevel 1 (
    echo HATA: Electron build basarisiz!
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   BUILD TAMAMLANDI!
echo ========================================
echo.
echo EXE dosyalari: electron\dist klasorunde
echo.
echo - Subcio-{version}-x64.exe (NSIS Installer)
echo - Subcio-Portable-{version}.exe (Portable)
echo.
pause
