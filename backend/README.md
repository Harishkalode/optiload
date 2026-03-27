# OptiLoad Backend (FastAPI)

## Run
```bash
cd backend
uv run uvicorn app.main:app --reload
```

## Key capabilities
- Multi-tenant organization isolation.
- JWT auth with login endpoint.
- RBAC via roles and permissions.
- Repository + service architecture.
- Audit logging for write and login actions.
- System monitoring endpoints for super admins.

## API base
- `/api/v1`
