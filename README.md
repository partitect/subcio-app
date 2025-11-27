# Subcio

## Backend

### Prerequisites
- Python 3.8+
- FFmpeg installed and added to system PATH

### Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server
Start the backend server using uvicorn (recommended for development with hot-reload):
```bash
uvicorn main:app --reload
```
Or simply:
```bash
python main.py
```

The server will start at `http://127.0.0.1:8000`.

## Frontend

### Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
Start the frontend development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (default Vite port).
