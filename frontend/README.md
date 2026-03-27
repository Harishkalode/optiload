# OptiLoad Frontend

## Local run
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Backend connection
- `VITE_API_BASE_URL` defaults to `http://localhost:8000/api/v1`.
- Auth token is read from `localStorage` and sent as `Authorization: Bearer <token>`.

## Docker
Run with root `docker compose up --build` and open `http://localhost:8080`.

## Dependency conflict fix
If you previously saw `ERESOLVE` around `@react-three/fiber` requiring React 19, this repo pins compatible React-18 versions:
- `@react-three/fiber@8.17.10`
- `@react-three/drei@9.120.4`
