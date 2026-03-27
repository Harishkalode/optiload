# OptiLoad Application Scaffold

This repository now contains a modular monolith scaffold for OptiLoad with:

- `backend/`: FastAPI app split by domain modules.
- `frontend/`: React + TypeScript structure with service/store/hooks skeletons.
- `shared/`: shared type placeholders.

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
