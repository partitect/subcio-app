# ================================
# Subcio Backend - Production Dockerfile
# ================================

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies (including PyonFX/Cairo dependencies and FFmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    libcairo2-dev \
    libgirepository1.0-dev \
    gobject-introspection \
    libglib2.0-dev \
    pkg-config \
    python3-dev \
    python3-gi \
    python3-gi-cairo \
    gir1.2-pango-1.0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install PyonFX separately with system-provided PyGObject
RUN pip install --no-cache-dir --no-build-isolation pycairo pyonfx || \
    pip install --no-cache-dir pyonfx || \
    echo "Warning: PyonFX installation failed, effects may not work"

# Install production dependencies
RUN pip install --no-cache-dir \
    psycopg2-binary \
    gunicorn \
    uvloop \
    httptools

# Copy application code
COPY backend/ .

# Make start script executable before switching user
RUN chmod +x /app/start.sh

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["sh", "/app/start.sh"]
