@echo off
title Subcio App
cd /d "E:\Projeler\ReactProjects\pycaps-main\pycaps-main"

echo ========================================
echo   SUBCIO - Karaoke Subtitle Editor
echo ========================================
echo.

:: Virtual environment aktif et
call .venv\Scripts\activate.bat

:: Backend'i arka planda başlat
echo [1/3] Backend baslatiliyor...
start "Subcio Backend" /min cmd /c "cd backend && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

:: Biraz bekle
timeout /t 3 /nobreak > nul

:: Frontend'i arka planda başlat
echo [2/3] Frontend baslatiliyor...
start "Subcio Frontend" /min cmd /c "cd frontend && npm run dev"

:: Biraz bekle
timeout /t 5 /nobreak > nul

:: Tarayıcıyı aç
echo [3/3] Tarayici aciliyor...
start http://localhost:5173

echo.
echo ========================================
echo   Subcio calisiyor!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Bu pencereyi kapatmak uygulamayi DURDURMAZ.
echo Durdurmak icin Task Manager'dan kapatabilirsiniz.
echo veya asagidaki komutla:
echo   taskkill /f /im node.exe
echo   taskkill /f /im python.exe
echo.
pause
