# Optiload

Optiload is a full-stack starter for rail / heavy logistics load optimization.

## Current scope
This version focuses on **admin-side backend capabilities** needed by an enterprise SaaS UI:
- Organization onboarding (admin signup)
- Auth and role-based access (`superuser`, `admin`, `sub-admin`)
- Dashboard KPIs and recent jobs
- Warehouse management
- Vehicle management
- Load management
- Optimization job orchestration (step-based payload)
- API key management

## Tech stack
- **Frontend:** React (Vite)
- **Backend:** FastAPI + SQLAlchemy
- **Database:** SQLite (local) or PostgreSQL (Docker)
- **Auth:** JWT bearer tokens

## Backend APIs
### Authentication
- `POST /auth/login`
- `POST /auth/signup/admin`

### Users & access
- `GET /users/me`
- `GET /users`
- `POST /users`

### Admin modules
- `GET /dashboard`
- `GET/POST /warehouses`
- `GET/POST /vehicles`
- `GET/POST /loads`
- `GET/POST /optimizations`
- `GET/POST /api-keys`

## Local development
### 1) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload
```

### 2) Frontend
```bash
cd frontend
npm install
cp ../.env.example .env
npm run dev
```

## Docker development
```bash
docker compose up --build
```

## Seed users
- Superuser: `owner@optiload.local` / `ChangeMe123!`
- Demo admin: `admin@demo.optiload.local` / `ChangeMe123!`

> Change all default credentials and secret keys before production use.
