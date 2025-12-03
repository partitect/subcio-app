# 🎬 Subcio - AI-Powered Subtitle Generator

**Professional subtitle generation and styling platform powered by AI**

Transform your videos with beautifully styled, animated subtitles in seconds. Subcio combines cutting-edge AI transcription with advanced subtitle styling effects.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green.svg)](https://fastapi.tiangolo.com/)

---

## ✨ Features

### 🎙️ AI Transcription
- **Whisper-powered** transcription with word-level timestamps
- Multiple language support
- High accuracy with speaker detection
- Automatic punctuation and formatting

### 🎨 Advanced Styling
- **50+ karaoke effects** (bounce, wave, shake, etc.)
- Custom fonts and colors
- Position and alignment controls
- Real-time preview
- PyonFX integration for professional effects

### 💼 Professional Tools
- Multi-format export (ASS, SRT, VTT)
- Video export with burned-in subtitles
- Batch processing
- Project management
- Cloud storage

### 🔐 Authentication & Payments
- Email/password authentication
- OAuth (Google, GitHub)
- Stripe integration
- Subscription management
- Usage tracking

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg (for video processing)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/partitect/subcio-app.git
   cd subcio-app
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start backend
   uvicorn main:app --reload
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with backend URL
   
   # Start frontend
   npm run dev
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## 📦 Production Deployment

See [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md) for detailed production deployment guide.

**Quick Deploy:**

### Backend (Railway)
```bash
# Connect GitHub repo to Railway
# Add PostgreSQL database
# Set environment variables from .env.production.example
# Deploy automatically
```

### Frontend (Netlify)
```bash
# Connect GitHub repo to Netlify
# Configure build: npm run build
# Set environment variables
# Deploy automatically
```

**Environment Variables:**
- Backend: See [.env.production.example](.env.production.example)
- Frontend: See [frontend/.env.production.example](frontend/.env.production.example)

---

## 🏗️ Architecture

```
subcio-app/
├── backend/              # FastAPI backend
│   ├── main.py          # Main application
│   ├── auth/            # Authentication & authorization
│   ├── payments/        # Stripe integration
│   ├── security/        # Rate limiting, validation
│   ├── styles/          # PyonFX effects
│   └── requirements.txt
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Route pages
│   │   ├── contexts/    # React contexts
│   │   └── services/    # API services
│   └── package.json
└── docs/               # Documentation
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** PostgreSQL (production), SQLite (development)
- **AI:** Faster-Whisper (OpenAI Whisper)
- **Effects:** PyonFX
- **Auth:** JWT, OAuth2 (Google, GitHub)
- **Payments:** Stripe
- **Security:** Rate limiting, input validation

### Frontend
- **Framework:** React 18 + TypeScript
- **UI:** Material-UI (MUI)
- **Routing:** React Router v6
- **State:** React Context
- **Styling:** Emotion + Tailwind CSS
- **Video:** React Player
- **Internationalization:** i18next

---

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_STEPS.md) - Step-by-step production deployment
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (Swagger)
- [Architecture Overview](.github/DEPLOYMENT.md) - System architecture and design

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Email:** support@subcio.io
- **Issues:** [GitHub Issues](https://github.com/partitect/subcio-app/issues)

---

**Made with ❤️ by the Subcio Team**
