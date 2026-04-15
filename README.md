# Face Attendance System

A production-ready face-recognition attendance application with a FastAPI backend and React frontend.

## Project Scope

This project is designed to support:
- user registration with face image upload
- email and face recognition login
- attendance check-in/check-out using face matching
- admin reporting for users and attendance
- PostgreSQL-backed storage for users, attendance, leave, holiday, and policy data
- FAISS-based similarity search for face authentication

## Features

- Register users with facial image upload
- Login with email or face recognition
- Mark attendance using webcam or image upload
- Automatic check-in/check-out and punch logging
- Attendance rule evaluation for late, absent, half-day, overtime, and shortfall
- Admin endpoints to list users and attendance records
- Environment-based configuration for safe deployment

## Technologies

- Backend: FastAPI, Python, PostgreSQL, psycopg, FAISS, DeepFace, OpenCV
- Frontend: React, Vite, TypeScript, Tailwind CSS, Axios, React Router
- Environment: python-dotenv for backend env loading, Vite env vars for frontend

## Architecture

### Backend
- `Backend/app/main.py` — FastAPI application entry point
- `Backend/app/config.py` — environment loading and configuration
- `Backend/app/db.py` — database connection helper
- `Backend/app/init_db.py` — schema creation
- `Backend/app/faiss_index.py` — FAISS index management
- `Backend/app/routes/auth.py` — authentication routes
- `Backend/app/routes/attendance.py` — attendance and processing routes
- `Backend/app/routes/admin.py` — admin reporting routes
- `Backend/app/services/face_service.py` — face embedding extraction
- `Backend/app/services/attendance_service.py` — punch handling
- `Backend/app/services/attendance_processor.py` — rule engine and attendance computation

### Frontend
- `Frontend/src/main.tsx` — app bootstrap
- `Frontend/src/App.tsx` — top-level routing and layout
- `Frontend/src/api/api.ts` — API client and endpoints
- `Frontend/src/pages` — user and admin pages
- `Frontend/src/components` — reusable UI and layout components

## Environment Configuration

### Backend
Create a `.env` file at the project root using `.env.example` as a template.

Required values:
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `FAISS_INDEX_PATH`
- `ADMIN_USER`
- `ADMIN_PASSWORD`

The backend loads these values automatically from `.env`.

### Frontend
Create `Frontend/.env` using `Frontend/.env.example`.
- `VITE_API_BASE_URL` controls the backend API URL.

## Setup

### Backend

```bash
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and update the database connection values.

Initialize the database schema:

```bash
python app/init_db.py
```

Start the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd Frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

Open the browser at the Vite address (commonly `http://localhost:5173`).

## API Overview

### Auth
- `POST /auth/register` — register user with name, email, and face image
- `POST /auth/login` — login with email/password
- `POST /auth/face-login` — login with face image

### Attendance
- `POST /attendance/mark-attendance` — mark attendance using face image
- `POST /attendance/process-today` — process current date attendance
- `POST /attendance/process-date?target_date=YYYY-MM-DD` — process attendance for a specific date
- `GET /attendance/today/{user_id}` — fetch today’s attendance
- `GET /attendance/history/{user_id}` — fetch attendance history

### Admin
- `GET /admin/users` — list registered users
- `GET /admin/attendance` — get attendance summary
- `GET /admin/attendance/{date}` — get attendance records by date
- `POST /admin/process/{date}` — process attendance for a given date

## Notes

- The backend now uses env vars instead of hardcoded config values.
- The frontend reads the API base URL from `VITE_API_BASE_URL`.
- Keep `.env` local and do not commit it; `.env.example` is safe to share.
- `Backend/faiss.index` is rebuilt automatically on startup if needed.

## Documentation

- Full project specification is available in `docs/PROJECT_SPEC.md`.
