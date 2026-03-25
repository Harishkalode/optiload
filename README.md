# Optiload

Optiload is a starter full-stack app for user management with hierarchical access control.

## User types
- **Superuser**: platform owner/controller with full visibility.
- **Admin**: customer account admin.
- **Sub-admin**: subordinate user managed under an admin.

## Tech stack
- **Frontend:** React (Vite)
- **Backend:** FastAPI + SQLAlchemy
- **Database:** SQLite (local) or PostgreSQL (Docker)
- **Auth:** JWT-based login
- **Access Control:** Role + permission model

## Backend API overview
- `POST /auth/login` — authenticate and receive a bearer token.
- `GET /users/me` — current authenticated user.
- `GET /users` — list users based on role scope.
- `POST /users` — create users (superuser/admin permissions enforced).

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
Backend runs on `http://localhost:8000`.

### 2) Frontend
```bash
cd frontend
npm install
cp ../.env.example .env
npm run dev
```
Frontend runs on `http://localhost:5173`.

## Docker development
```bash
docker compose up --build
```

This starts:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

## Default seeded superuser
- Email: `owner@optiload.local`
- Password: `ChangeMe123!`

> Change secrets/passwords before production use.
