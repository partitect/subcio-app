@echo off
title Subcio - Durdur
echo Subcio durduruluyor...

:: Node.js (Frontend) kapat
taskkill /f /im node.exe 2>nul
if %errorlevel%==0 (
    echo [OK] Frontend durduruldu
) else (
    echo [--] Frontend zaten kapali
)

:: Python (Backend) kapat  
taskkill /f /im python.exe 2>nul
if %errorlevel%==0 (
    echo [OK] Backend durduruldu
) else (
    echo [--] Backend zaten kapali
)

echo.
echo Subcio durduruldu!
timeout /t 2 /nobreak > nul
