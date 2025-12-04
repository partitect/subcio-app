@echo off
title Subcio - Windows Baslangicina Ekle
cd /d "E:\Projeler\ReactProjects\pycaps-main\pycaps-main"

echo ========================================
echo   Windows Baslangicina Ekleniyor
echo ========================================
echo.

:: Startup klasörüne kısayol oluştur
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

:: PowerShell ile kısayol oluştur
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTUP%\Subcio.lnk'); $Shortcut.TargetPath = 'E:\Projeler\ReactProjects\pycaps-main\pycaps-main\start-subcio-silent.bat'; $Shortcut.WorkingDirectory = 'E:\Projeler\ReactProjects\pycaps-main\pycaps-main'; $Shortcut.WindowStyle = 7; $Shortcut.Save()"

echo [OK] Subcio Windows baslangicina eklendi!
echo.
echo Bilgisayar her acildiginda Subcio otomatik baslar.
echo Kaldirmak icin: %STARTUP%\Subcio.lnk dosyasini silin
echo.
pause
