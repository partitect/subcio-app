@echo off
:: Sessiz mod - pencere gosterme
cd /d "E:\Projeler\ReactProjects\pycaps-main\pycaps-main"

:: Virtual environment aktif et
call .venv\Scripts\activate.bat

:: Backend'i sessiz baslat
start /min "" cmd /c "cd backend && uvicorn main:app --host 127.0.0.1 --port 8000"

:: Bekle
timeout /t 3 /nobreak > nul

:: Frontend'i sessiz baslat
start /min "" cmd /c "cd frontend && npm run dev"
