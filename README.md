# OptiLoad

OptiLoad now includes a **production-oriented frontend system spec implementation** for rail/heavy logistics SaaS operations.

## Frontend architecture (React-optimized)
```
src/
 ├── app/
 │    ├── layout/
 │    ├── dashboard/
 │    ├── vehicles/
 │    ├── loads/
 │    ├── optimizations/
 │    ├── templates/
 │    ├── reports/
 │    ├── users/
 │    ├── settings/
 │    └── auth/
 ├── components/
 │    ├── ui/
 │    └── 3d/
 ├── theme/
 ├── store/
 ├── hooks/
 └── utils/
```

## Design system implementation
- Strict spacing token system and layout metrics (8px based).
- Semantic color tokens with dark/light mode support.
- Palette engine (`industrialBlue`, `safetyOrange`, `steelTeal`, `railRed`) and highlight override.
- Reusable UI primitives:
  - Button, Card, Table, Modal, Drawer, Stepper, Badge, Toggle, Select, Tabs, Toast.
- SaaS shell:
  - Fixed 240px sidebar
  - Sticky 72px top navbar
  - 12-column content grid and 1440px max width

## 3D UX implementation scaffold
- `RailcarScene` with modular sub-components:
  - `LoadMesh`
  - `CameraControls`
  - `HighlightLayer`
- Supports interaction states scaffold:
  - hover highlight + tooltip
  - selected load state
  - violation visualization mode
  - compare mode split visualization marker

## Backend modules
- Auth, users, dashboard, warehouses, vehicles, loads, optimizations, API keys.

## Local development
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
cp ../.env.example .env
npm run dev
```

## Docker
```bash
docker compose up --build
```
