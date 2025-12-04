@echo off
title Subcio - Docker
cd /d "E:\Projeler\ReactProjects\pycaps-main\pycaps-main"

echo ========================================
echo   SUBCIO - Docker ile Baslatiliyor
echo ========================================
echo.

docker-compose -f docker-compose.local.yml up -d

echo.
echo Bekleniyor...
timeout /t 10 /nobreak > nul

start http://localhost:5173

echo ========================================
echo   Subcio Docker'da calisiyor!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Durdurmak icin: docker-compose -f docker-compose.local.yml down
pause
