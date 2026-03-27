# OptiLoad Backend (FastAPI)

## Local Run
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uv run uvicorn app.main:app --reload
```

## Docker Run (from repo root)
```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build
```

## Security defaults
- JWT secret key is configurable only through environment.
- CORS is restricted by `OPTILOAD_CORS_ALLOWED_ORIGINS`.
- Trusted host filtering enabled via `OPTILOAD_TRUSTED_HOSTS`.
- Security headers middleware enabled.
- Rate limiting middleware enabled.

## API base
- `/api/v1`
