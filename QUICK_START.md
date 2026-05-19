# OptiLoad Quick Start Guide

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL 14+ (local) OR use Neon DB (remote)
- Docker & Docker Compose (optional, for containerized setup)

### Option 1: Quick Start with Docker Compose (Recommended for first-time setup)

```bash
# Clone repository
git clone <repository-url>
cd optiload

# Start all services
docker-compose up

# Access applications:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/api/v1/docs
```

**What happens:**
- PostgreSQL database starts on localhost:5432
- Backend API starts on localhost:8000
- Frontend dev server starts on localhost:5173
- Database migrations run automatically

### Option 2: Manual Setup with Local Database

#### Backend Setup:

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set up local environment
cp .env.local .env

# Run database migrations
python -m alembic upgrade head

# Start development server
OPTILOAD_ENVIRONMENT=local python -m uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`

#### Frontend Setup:

```bash
cd frontend

# Install dependencies
npm install

# Create local env file
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Option 3: Using Production Neon Database Locally

```bash
# Configure backend to use production database
cd backend

# Use the setup script (Unix/Linux/Mac):
bash ../setup-db.sh
# Select option "2" for production Neon DB

# Or on Windows with PowerShell:
powershell -File ..\setup-db.ps1
# Select option "2" for production Neon DB

# Install and migrate
pip install -r requirements.txt
python -m alembic upgrade head

# Start backend
OPTILOAD_ENVIRONMENT=local python -m uvicorn app.main:app --reload
```

This connects your local development environment to the production database. **Use with caution!**

---

## 🌐 Production Deployment on Railway

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete deployment instructions.

### Quick Deployment Checklist:

1. **Backend Service:**
   - [ ] Set `OPTILOAD_ENVIRONMENT=production`
   - [ ] Set `OPTILOAD_DATABASE_URL` to Neon PostgreSQL
   - [ ] Generate and set `OPTILOAD_JWT_SECRET_KEY`
   - [ ] Set `OPTILOAD_REDIS_URL` (Railway Redis service)
   - [ ] Configure `OPTILOAD_CORS_ALLOWED_ORIGINS` for frontend domain
   - [ ] Deploy and verify health check

2. **Frontend Service:**
   - [ ] Set `VITE_API_BASE_URL=https://optiload-be.up.railway.app/api/v1`
   - [ ] Deploy
   - [ ] Verify domain routing

3. **Services:**
   - [ ] PostgreSQL (Neon): Connected via `OPTILOAD_DATABASE_URL`
   - [ ] Redis: Connected via `OPTILOAD_REDIS_URL`
   - [ ] SSL/TLS: Automatic with Railway

---

## 📁 Project Structure

```
optiload/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── core/              # Configuration, database, middleware
│   │   ├── modules/           # API modules (auth, users, vehicles, etc.)
│   │   └── main.py            # FastAPI app entry
│   ├── .env                   # Local development config
│   ├── .env.local            # Alternative local config
│   ├── .env.production       # Production config template
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Container image
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── app/              # React components and pages
│   │   ├── services/         # API client functions
│   │   └── contexts/         # React contexts
│   ├── .env.local            # Local dev config
│   ├── .env.production       # Production config
│   ├── package.json          # Node dependencies
│   └── Dockerfile            # Container image
├── docker-compose.yml         # Local development stack
├── setup-db.sh/ps1           # Database configuration helper
├── RAILWAY_DEPLOYMENT.md     # Railway deployment guide
└── README.md                 # This file
```

---

## 🔧 Environment Variables

### Backend (OPTILOAD_ prefix)

```bash
# Core
OPTILOAD_ENVIRONMENT=local|production
OPTILOAD_DATABASE_URL=postgresql://...
OPTILOAD_JWT_SECRET_KEY=<secure-random-key>

# Frontend integration
OPTILOAD_CORS_ALLOWED_ORIGINS=['https://yourdomain.com']

# Features
OPTILOAD_ALLOW_PUBLIC_REGISTRATION=true|false
OPTILOAD_DEMO_MODE=true|false
DEMO_MODE=true|false

# Rate limiting
OPTILOAD_RATE_LIMIT_BACKEND=memory|redis
OPTILOAD_REDIS_URL=redis://...

# Logging
OPTILOAD_LOG_LEVEL=DEBUG|INFO|WARNING|ERROR
```

### Frontend (VITE_ prefix)

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1|https://your-backend.com/api/v1
```

---

## 🧪 Testing

### Backend Tests:

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests:

```bash
cd frontend
npm run test
```

---

## 📝 API Documentation

When running locally with development config:

- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **OpenAPI JSON:** http://localhost:8000/api/v1/openapi.json

---

## 🐛 Troubleshooting

### Docker Compose Issues

**"Port 5432 is already in use"**
```bash
# Stop existing container
docker-compose down
# Or change port mapping in docker-compose.yml
```

**"Cannot connect to database"**
```bash
# Check database health
docker-compose logs postgres

# Wait for database to be ready (health check runs)
docker-compose ps
```

### Backend Issues

**"ModuleNotFoundError"**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**"Database migration failed"**
```bash
# Check current migration status
python -m alembic current

# Reset database (careful!)
python -m alembic downgrade base
python -m alembic upgrade head
```

### Frontend Issues

**"Cannot find module"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**"VITE_API_BASE_URL not loaded"**
```bash
# Ensure .env.local file exists with VITE_API_BASE_URL
# Restart dev server
npm run dev
```

---

## 📚 Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

---

## 📞 Support

For issues and questions:
- Check existing documentation
- Review application logs
- Test with different configurations
- Consult Railway documentation for deployment issues

---

**Happy coding! 🎉**
