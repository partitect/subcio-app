@echo off
title Subcio Desktop - Build
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
echo   SUBCIO DESKTOP - BUILD
echo ========================================
echo.

:: 1. Frontend build
echo [1/3] Frontend build ediliyor...
cd frontend
call npm run build
if errorlevel 1 (
    echo HATA: Frontend build basarisiz!
    pause
    exit /b 1
)

:: 2. Electron build
echo [2/3] Electron build ediliyor...
cd ..\electron
call npm run build:portable
if errorlevel 1 (
    echo HATA: Electron build basarisiz!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD TAMAMLANDI!
echo ========================================
echo.
echo Portable EXE: electron\dist\Subcio-Portable-1.0.0.exe
echo.
pause
