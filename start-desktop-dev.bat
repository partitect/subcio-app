@echo off
title Subcio Desktop - Dev Mode
cd /d "%~dp0"

echo ========================================
echo   SUBCIO DESKTOP - DEV MODE
echo ========================================
echo.

:: Venv aktif et
call .venv\Scripts\activate.bat

:: Backend başlat (arka planda)
echo [1/3] Backend baslatiliyor...
start "Subcio Backend" /min cmd /c "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Bekle
timeout /t 3 /nobreak > nul

:: Frontend başlat (arka planda)
echo [2/3] Frontend baslatiliyor...
start "Subcio Frontend" /min cmd /c "cd frontend && npm run dev"

:: Bekle
timeout /t 5 /nobreak > nul

:: Electron başlat
echo [3/3] Electron baslatiliyor...
cd electron
npm start

:: Electron kapandığında backend ve frontend'i de kapat
echo Kapaniyor...
taskkill /f /fi "WINDOWTITLE eq Subcio Backend*" 2>nul
taskkill /f /fi "WINDOWTITLE eq Subcio Frontend*" 2>nul
