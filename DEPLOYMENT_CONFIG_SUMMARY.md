# OptiLoad Railway Deployment - Configuration Summary

**Deployment Date:** May 13, 2026  
**Target Infrastructure:** Railway.com  
**Database:** Neon PostgreSQL  
**Frontend URL:** `https://optiload-fe.up.railway.app`  
**Backend URL:** `https://optiload-be.up.railway.app`  

---

## 📋 Configuration Files Created/Updated

### Backend Configuration

#### `.env.production` - Production Environment Variables
```ini
OPTILOAD_ENVIRONMENT=production
OPTILOAD_DATABASE_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
OPTILOAD_DATABASE_READ_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
OPTILOAD_JWT_SECRET_KEY=<GENERATE_SECURE_KEY>
OPTILOAD_CORS_ALLOWED_ORIGINS='["https://optiload-fe.up.railway.app"]'
OPTILOAD_TRUSTED_HOSTS='["optiload-be.up.railway.app"]'
OPTILOAD_REDIS_URL=redis://default:PASSWORD@HOST:PORT
OPTILOAD_ALLOW_PUBLIC_REGISTRATION=false
OPTILOAD_RATE_LIMIT_BACKEND=redis
OPTILOAD_DEMO_MODE=false
```

#### `.env` - Local Development Environment Variables
```ini
OPTILOAD_ENVIRONMENT=local
OPTILOAD_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/optiload
OPTILOAD_JWT_SECRET_KEY=dev-secret-key-change-in-production-32chars
OPTILOAD_CORS_ALLOWED_ORIGINS='["http://localhost:5173","http://localhost:8080"]'
OPTILOAD_RATE_LIMIT_BACKEND=memory
OPTILOAD_DEMO_MODE=true
```

#### `Dockerfile` - Backend Container (UPDATED)
- Python 3.12 slim base image
- Non-root user (optiload) for security
- Health check on `/api/v1/meta/health`
- 4 worker processes with 30s graceful shutdown
- Exposed port: 8000

### Frontend Configuration

#### `.env.production` - Production API Configuration
```
VITE_API_BASE_URL=https://optiload-be.up.railway.app/api/v1
```

#### `.env.local` - Local Development API Configuration
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### `Dockerfile` - Frontend Container (UPDATED)
- Node.js 20 Alpine for build stage
- Build-time `VITE_API_BASE_URL` argument
- Nginx 1.27 Alpine for serving
- Non-root user (nginx) for security
- Enhanced SPA routing and security headers
- Exposed port: 80

#### `nginx.conf` - Enhanced Production Configuration
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- gzip compression for text/css/js
- SPA routing (redirect all non-file requests to index.html)
- Cache control for static assets (365 days)
- Deny access to sensitive files (.env, .git, etc.)

### Docker & Local Development

#### `docker-compose.yml` - Complete Local Stack
Services:
- **postgres** - PostgreSQL 16 on port 5432
- **backend** - FastAPI on port 8000
- **frontend** - Nginx on port 5173

Features:
- Automatic database initialization
- Auto-reload on code changes
- Health checks
- Volume mounts for development

Usage:
```bash
docker-compose up              # Start all services
docker-compose up -d           # Start in background
docker-compose logs -f backend # View logs
docker-compose down            # Stop services
```

### Helper Scripts

#### `setup-db.sh` - Bash Script (macOS/Linux)
Switches between local and production database configurations.

Usage:
```bash
bash setup-db.sh
# Select 1 for local PostgreSQL
# Select 2 for production Neon DB
```

#### `setup-db.ps1` - PowerShell Script (Windows)
Same functionality as bash script for Windows users.

Usage:
```powershell
powershell -File setup-db.ps1
# Select 1 for local PostgreSQL
# Select 2 for production Neon DB
```

#### `verify-config.py` - Configuration Validator
Validates all environment variables are properly configured.

Usage:
```bash
python verify-config.py
# Shows validation status for all variables
# Performs production checklist if OPTILOAD_ENVIRONMENT=production
```

### Documentation

#### `RAILWAY_DEPLOYMENT.md` - Complete Deployment Guide
Detailed step-by-step instructions for Railway deployment:
- Prerequisites setup
- Backend service configuration
- Frontend service configuration
- Redis setup for rate limiting
- Health checks and monitoring
- Troubleshooting guide
- Environment variables reference

#### `QUICK_START.md` - Quick Start Guide
Quick reference for:
- Local development setup (3 options)
- Production deployment overview
- Project structure
- Troubleshooting common issues

#### `railway.toml` - Railway Configuration File
Standard Railway deployment configuration with:
- Dockerfile reference
- Build settings
- Deploy settings
- Environment variables
- Health check path

---

## 🔑 Key Configuration Parameters

### Database Connection
- **Engine:** PostgreSQL (Neon)
- **Host:** `ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech`
- **Database:** `neondb`
- **User:** `neondb_owner`
- **SSL Mode:** Required (`?sslmode=require`)
- **Connection Pooling:** 20 pool size, 40 max overflow (production)

### Frontend URLs
- **Local:** `http://localhost:5173`
- **Production:** `https://optiload-fe.up.railway.app`

### Backend URLs
- **Local:** `http://localhost:8000`
- **Production:** `https://optiload-be.up.railway.app`

### API Configuration
- **Base Path:** `/api/v1`
- **Health Check:** `/api/v1/meta/health`
- **API Docs:** `/api/v1/docs` (disabled in production)
- **Workers:** 4 (production)
- **Timeout:** 30s graceful shutdown

### Security Settings (Production)
- **Environment:** `production`
- **CORS:** Only `https://optiload-fe.up.railway.app`
- **Trusted Hosts:** `optiload-be.up.railway.app`
- **Registration:** Disabled (`false`)
- **API Docs:** Disabled (`false`)
- **Demo Mode:** Disabled (`false`)
- **Rate Limiting:** Redis-backed
- **Log Level:** WARNING (minimal logging)

### Security Settings (Local)
- **Environment:** `local`
- **CORS:** `http://localhost:5173`, `http://localhost:8080`
- **Registration:** Enabled (`true`)
- **API Docs:** Enabled (`true`)
- **Demo Mode:** Enabled (`true`)
- **Rate Limiting:** In-memory
- **Log Level:** DEBUG (verbose logging)

---

## 🚀 Deployment Steps

### Prerequisites
1. GitHub repository connected to Railway
2. Neon PostgreSQL database created
3. Redis instance available (or create on Railway)
4. Domain names configured (Railway auto-generates subdomains)

### Backend Deployment on Railway

1. **Create Backend Service**
   - New Project → Deploy from GitHub
   - Select optiload repository
   - Railway auto-detects `backend/Dockerfile`

2. **Set Environment Variables**
   ```
   OPTILOAD_ENVIRONMENT=production
   OPTILOAD_DATABASE_URL=postgresql://...
   OPTILOAD_DATABASE_READ_URL=postgresql://...
   OPTILOAD_JWT_SECRET_KEY=<GENERATED_KEY>
   OPTILOAD_CORS_ALLOWED_ORIGINS=["https://optiload-fe.up.railway.app"]
   OPTILOAD_TRUSTED_HOSTS=["optiload-be.up.railway.app"]
   OPTILOAD_REDIS_URL=redis://...
   OPTILOAD_ALLOW_PUBLIC_REGISTRATION=false
   OPTILOAD_RATE_LIMIT_BACKEND=redis
   OPTILOAD_DEMO_MODE=false
   DEMO_MODE=false
   ```

3. **Configure Health Check**
   - Path: `/api/v1/meta/health`
   - Interval: 30s
   - Timeout: 10s

4. **Run Migrations**
   ```bash
   railway run python -m alembic upgrade head
   ```

### Frontend Deployment on Railway

1. **Create Frontend Service**
   - Add Service → Docker
   - Point to `frontend/Dockerfile`

2. **Set Environment Variables**
   ```
   VITE_API_BASE_URL=https://optiload-be.up.railway.app/api/v1
   ```

3. **Verify Domain**
   - Railway auto-generates: `optiload-fe.up.railway.app`
   - SSL certificate automatic

### Redis Setup on Railway

1. **Add Redis Service**
   - Add Service → Redis (from marketplace)
   - Use default configuration
   - Copy connection URL

2. **Add to Backend Environment**
   ```
   OPTILOAD_REDIS_URL=<CONNECTION_URL>
   ```

---

## ✅ Verification Checklist

### Local Development
- [ ] `docker-compose up` starts all services
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] Backend accessible at `http://localhost:8000`
- [ ] API docs available at `http://localhost:8000/api/v1/docs`
- [ ] Database migrations run automatically
- [ ] Health check passes: `curl http://localhost:8000/api/v1/meta/health`

### Production Deployment
- [ ] Backend service is running
- [ ] Frontend service is running
- [ ] Redis service is running
- [ ] Health check passes: `curl https://optiload-be.up.railway.app/api/v1/meta/health`
- [ ] Frontend loads without CORS errors
- [ ] API calls work with authentication
- [ ] Rate limiting is active (Redis connected)
- [ ] Demo mode is disabled
- [ ] SSL certificates are valid
- [ ] Logs show no errors

---

## 🔄 Environment Switching

### Use Local PostgreSQL
```bash
bash setup-db.sh    # Unix/Linux/macOS
# OR
powershell -File setup-db.ps1    # Windows
# Select: 1
```

### Use Production Neon DB Locally
```bash
bash setup-db.sh    # Unix/Linux/macOS
# OR
powershell -File setup-db.ps1    # Windows
# Select: 2
```

---

## 📝 Configuration Hierarchy

The configuration system uses environment-driven defaults:

```
1. Environment Variable (OPTILOAD_*)
2. .env file in current directory
3. Built-in defaults based on OPTILOAD_ENVIRONMENT
```

### Environment Modes

| Mode | Use Case | Defaults |
|------|----------|----------|
| `local` | Local development | Debug logging, in-memory rate limiting, API docs enabled |
| `production` | Railway deployment | Warning logging, Redis rate limiting, API docs disabled |
| `testing` | Automated tests | Debug logging, memory rate limiting, API docs enabled |

---

## 🔐 Security Considerations

### Production-Only Security
- JWT secret key must be >= 32 characters (generated, not default)
- Redis required for rate limiting
- CORS restricted to frontend domain only
- Public registration disabled
- API docs disabled
- Detailed error messages disabled
- Account lockout enabled
- MFA required for admin roles

### Transport Security
- SSL/TLS: Automatic via Railway
- Database SSL: Required (`sslmode=require`)
- Secure cookies in production (`cookie_secure=true`)
- SameSite cookies: `strict` in production

### Database Security
- SSL connection required to Neon DB
- Connection pooling to limit idle connections
- Statement timeout: 30 seconds
- Non-superuser database user

---

## 📊 Performance Configuration

### Database Connection Pool (Production)
- Pool size: 20
- Max overflow: 40
- Total max: 60 connections
- Recycle: 1800 seconds (30 minutes)
- Timeout: 30 seconds

### Rate Limiting (Production)
- General: 60 requests/minute
- Login: 5 attempts/minute
- Backend: Redis-backed for distributed rate limiting

### Caching (Production)
- Enabled
- TTL: 300 seconds default
- Max TTL: 3600 seconds

---

## 📞 Support Resources

### Documentation
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Detailed deployment guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference guide

### Tools
- `verify-config.py` - Validate configuration
- `setup-db.sh` / `setup-db.ps1` - Configure database

### Railways Official
- https://docs.railway.app/
- https://railway.app/support

---

## 🎯 Next Steps

1. **Generate JWT Secret:**
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

2. **Update Environment Variables in Railway Dashboard**

3. **Deploy Backend**

4. **Deploy Frontend**

5. **Verify Deployment:**
   ```bash
   curl https://optiload-be.up.railway.app/api/v1/meta/health
   ```

6. **Test API Endpoints**

7. **Monitor Logs**

---

**Configuration Summary Complete!**  
All files are ready for Railway deployment.
