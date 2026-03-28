# OptiLoad Backend (FastAPI + SQLAlchemy + Alembic)

## Local Run
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uv run uvicorn app.main:app --reload
```

## Migration Workflow (required)
```bash
# 1) update SQLAlchemy models
# 2) generate migration
alembic revision --autogenerate -m "add_your_change"

# 3) review migration in migrations/versions
# 4) apply
alembic upgrade head
```

## Notes
- Schema creation is migration-driven; application startup does **not** run `Base.metadata.create_all()`.
- Alembic reads DB URL from `OPTILOAD_DATABASE_URL` / `DATABASE_URL` (fallback: `alembic.ini`).

## Docker Run (from repo root)
```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build
```

## API base
- `/api/v1`
