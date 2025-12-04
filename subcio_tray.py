"""
Subcio System Tray Application
Sistem tepsisinden Subcio'yu yönet
"""

import subprocess
import sys
import webbrowser
import os
from pathlib import Path

try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:
    print("Gerekli paketler kuruluyor...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pystray", "Pillow"])
    import pystray
    from PIL import Image, ImageDraw

# Paths
BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"
VENV_PYTHON = BASE_DIR / ".venv" / "Scripts" / "python.exe"

# Process handles
backend_process = None
frontend_process = None

def create_icon():
    """Basit bir ikon oluştur"""
    image = Image.new('RGB', (64, 64), color=(41, 128, 185))
    draw = ImageDraw.Draw(image)
    draw.text((20, 20), "S", fill='white')
    return image

def start_backend():
    global backend_process
    if backend_process is None:
        backend_process = subprocess.Popen(
            [str(VENV_PYTHON), "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=str(BACKEND_DIR),
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        print("Backend başlatıldı")

def start_frontend():
    global frontend_process
    if frontend_process is None:
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        print("Frontend başlatıldı")

def stop_all():
    global backend_process, frontend_process
    if backend_process:
        backend_process.terminate()
        backend_process = None
    if frontend_process:
        frontend_process.terminate()
        frontend_process = None
    # Kill any remaining processes
    os.system("taskkill /f /im node.exe 2>nul")
    print("Durduruldu")

def open_browser(icon, item):
    webbrowser.open("http://localhost:5173")

def start_services(icon, item):
    start_backend()
    start_frontend()
    icon.notify("Subcio başlatıldı!", "Subcio")

def stop_services(icon, item):
    stop_all()
    icon.notify("Subcio durduruldu", "Subcio")

def quit_app(icon, item):
    stop_all()
    icon.stop()

def main():
    # Menü oluştur
    menu = pystray.Menu(
        pystray.MenuItem("🌐 Tarayıcıda Aç", open_browser, default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("▶️ Başlat", start_services),
        pystray.MenuItem("⏹️ Durdur", stop_services),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ Çıkış", quit_app)
    )
    
    # Tray icon oluştur
    icon = pystray.Icon(
        "Subcio",
        create_icon(),
        "Subcio - Karaoke Subtitle Editor",
        menu
    )
    
    # Başlangıçta servisleri başlat
    start_backend()
    start_frontend()
    
    print("Subcio sistem tepsisinde çalışıyor...")
    icon.run()

if __name__ == "__main__":
    main()
