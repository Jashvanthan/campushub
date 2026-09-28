# CampusHub — Deployment & Architecture Guide

This document covers how to run and deploy the **CampusHub** full-stack application (React + Vite Frontend + Python Flask Backend + SQLAlchemy ORM Database) on **Render** and **Vercel**.

---

## Architecture Overview

```
Campushub/
├── backend/                  # Python Flask REST API Backend
│   ├── app/
│   │   ├── __init__.py       # Application Factory, CORS & Auto-Seeding
│   │   ├── config.py         # Config (SQLite & PostgreSQL auto-detection)
│   │   ├── models/           # SQLAlchemy Data Models (User, Post, Idea, Workspace...)
│   │   ├── routes/           # Blueprints: /api/auth, /api/posts, /api/ideas, /api/workspaces, /api/stats
│   │   └── utils/            # JWT Auth helpers & Database Seeder
│   ├── run.py                # Local development server entrypoint
│   ├── wsgi.py               # Production WSGI server (Gunicorn)
│   ├── seed.py               # Database re-seeding CLI script (`python seed.py`)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Production Container build
├── api/
│   └── index.py              # Vercel Serverless Function entrypoint
├── src/                      # React + Vite Frontend
│   └── services/api.js       # Frontend API Client
├── vercel.json               # Vercel Full-Stack / SPA routing config
└── render.yaml               # Render Infrastructure as Code Blueprint
```

---

## 1. Local Development

### Run Backend (Python Flask)
```bash
# In project root or backend folder
pip install -r backend/requirements.txt

# Run server on port 5000
python backend/run.py
```
> The database (`campushub.db`) will be automatically created and seeded on the first run with all default users, posts, ideas, workspaces, and chat messages!

### Run Frontend (React + Vite)
```bash
npm install
npm run dev
```

---

## 2. Deploy Backend on Render

### Option A: 1-Click Blueprint (Recommended)
1. Push your repository to **GitHub**.
2. Log into [render.com](https://render.com).
3. Click **New +** → **Blueprint**.
4. Select your repository.
5. Render will detect `render.yaml` and automatically provision:
   - **`campushub-backend`**: Python Web Service running `gunicorn wsgi:app`.
   - **`campushub-db`**: Managed PostgreSQL database.
   - Automatically link `DATABASE_URL` between them!

### Option B: Manual Web Service on Render
1. Create a new **Web Service** on Render.
2. Root Directory: `backend`
3. Environment: `Python 3`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `gunicorn wsgi:app`
6. Add Environment Variables:
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: `<your-random-secret>`
   - `JWT_SECRET_KEY`: `<your-jwt-secret>`
   - `DATABASE_URL`: `<your-postgres-connection-string>` (or leave empty for SQLite)
   - `CORS_ORIGINS`: `*` (or your Vercel frontend URL)

---

## 3. Deploy Frontend on Vercel

1. Log into [vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Framework Preset: **Vite**
5. Root Directory: `./`
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend-url.onrender.com/api`
9. Click **Deploy**!

---

## 4. Deploy Full Stack (Frontend + Python API) on Vercel

If you want both the React frontend and the Python backend running directly on Vercel:
1. `vercel.json` and `api/index.py` are already pre-configured.
2. In your Vercel Project Settings, add:
   - `DATABASE_URL`: `<your-hosted-postgresql-url>` (from Supabase, Neon, or Render Postgres)
   - `SECRET_KEY`: `<your-secret>`
   - `JWT_SECRET_KEY`: `<your-jwt-secret>`
3. Vercel will automatically route `/api/*` to the Python backend and all other routes to the React SPA!

---

## Default Seed Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@2025!` |
| **Student** | `std1` | `Student@2025!` |
| **Researcher** | `sarah_jenkins` | `Student@2025!` |
| **Tech Club** | `tech_club` | `Student@2025!` |
| **IoT Specialist** | `david_chen` | `Student@2025!` |
| **Cloud Engineer** | `anjali_sharma` | `Student@2025!` |
