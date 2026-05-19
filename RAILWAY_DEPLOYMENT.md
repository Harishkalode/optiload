# OptiLoad Railway Deployment Guide

This guide explains how to deploy OptiLoad on Railway with production configuration.

## Architecture

```
optiload-fe.up.railway.app (Next.js Frontend)
         ↓ (HTTPS)
optiload-be.up.railway.app (FastAPI Backend)
         ↓ (SSL)
Neon PostgreSQL Database
         ↑ (SSL)
Redis Cache (for rate limiting)
```

## Prerequisites

1. **Railway Account**: https://railway.app
2. **GitHub Account** (for connecting repo)
3. **Neon Database** (PostgreSQL): Already configured
   - Host: `ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech`
   - Database: `neondb`
   - User: `neondb_owner`
   - Connection string: `postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **Redis Instance** (for rate limiting): To be set up on Railway

## Step 1: Set Up Backend on Railway

### 1.1 Create Backend Service

1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Select the optiload repository
4. Railway will auto-detect the backend Dockerfile
5. Click "Deploy"

### 1.2 Configure Backend Environment Variables

In Railway dashboard for the backend service, set:

```
OPTILOAD_ENVIRONMENT=production
OPTILOAD_DATABASE_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
OPTILOAD_DATABASE_READ_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
OPTILOAD_JWT_SECRET_KEY=<GENERATE_SECURE_KEY_SEE_BELOW>
OPTILOAD_CORS_ALLOWED_ORIGINS=["https://optiload-fe.up.railway.app"]
OPTILOAD_TRUSTED_HOSTS=["optiload-be.up.railway.app"]
OPTILOAD_REDIS_URL=<SET_AFTER_REDIS_SETUP>
OPTILOAD_ALLOW_PUBLIC_REGISTRATION=false
OPTILOAD_RATE_LIMIT_BACKEND=redis
OPTILOAD_RATE_LIMIT_PER_MINUTE=60
OPTILOAD_AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=5
OPTILOAD_DB_POOL_SIZE=20
OPTILOAD_DB_MAX_OVERFLOW=40
OPTILOAD_LOG_LEVEL=WARNING
OPTILOAD_STRUCTURED_LOGGING=true
OPTILOAD_ACCESS_LOG_ENABLED=false
OPTILOAD_ENABLE_API_DOCS=false
OPTILOAD_DEMO_MODE=false
DEMO_MODE=false
```

### 1.3 Generate JWT Secret Key

Run this command locally to generate a secure JWT secret:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

Copy the output and paste into `OPTILOAD_JWT_SECRET_KEY` in Railway.

### 1.4 Configure Dockerfile

Ensure `backend/Dockerfile` has correct start command. It should have:

```dockerfile
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --timeout-graceful-shutdown 30
```

### 1.5 Configure Port

Railway auto-detects port from `PORT` env var or defaults to 8000. Ensure backend listens on port 8000.

### 1.6 Set Up Database Migrations

Add a deployment command in Railway dashboard:

- Go to Backend Service → Deployments → Settings
- Find "Deploy on Push" or similar settings
- Add this as a pre-deployment command:

```bash
python -m alembic upgrade head
```

Or manually run once after first deployment:

```bash
railway run python -m alembic upgrade head
```

## Step 2: Set Up Redis for Rate Limiting

### 2.1 Add Redis Service

1. In Railway dashboard, click "Add a New Service"
2. Select "Redis" from the marketplace
3. Configure with default settings
4. Note the connection URL (Railway provides it automatically)

### 2.2 Add Redis URL to Backend

Copy the Redis URL from Railway dashboard and add to backend environment variables:

```
OPTILOAD_REDIS_URL=redis://<user>:<password>@<redis-host>:<port>
```

## Step 3: Set Up Frontend on Railway

### 3.1 Create Frontend Service

1. In the same project, click "Add a New Service"
2. Select "Docker" → Use Dockerfile
3. Point to `frontend/Dockerfile`
4. Railway will auto-build

### 3.2 Configure Frontend Environment Variables

Set in Railway dashboard for frontend:

```
VITE_API_BASE_URL=https://optiload-be.up.railway.app/api/v1
```

### 3.3 Configure Nginx (if using nginx as reverse proxy)

The frontend Dockerfile includes nginx configuration. Ensure `frontend/nginx.conf` is properly configured for:

- Serving static files from `/usr/share/nginx/html`
- SPA routing (redirect 404 to index.html)
- Proper headers and caching

### 3.4 Set Domain

In Railway dashboard:
- Go to Frontend Service
- Under "Domains", add a custom domain or use Railway's default `optiload-fe.up.railway.app`

## Step 4: Configure Domains and SSL

### 4.1 Backend Domain

1. Railway auto-generates: `optiload-be.up.railway.app`
2. SSL certificate is automatic (Railway handles it)

### 4.2 Frontend Domain

1. Railway auto-generates: `optiload-fe.up.railway.app`
2. SSL certificate is automatic

### 4.3 Update CORS if Using Custom Domain

If you use custom domains, update in backend environment variables:

```
OPTILOAD_CORS_ALLOWED_ORIGINS=["https://yourdomain.com"]
```

## Step 5: Health Checks and Monitoring

### 5.1 Configure Health Check Endpoint

Backend has a health check endpoint at:

```
GET /api/v1/meta/health
```

Railway should auto-detect this. If not, configure manually:

- Path: `/api/v1/meta/health`
- Port: 8000
- Interval: 30s
- Timeout: 10s

### 5.2 Monitor Logs

In Railway dashboard:
- View real-time logs for each service
- Check for errors during deployment
- Monitor performance metrics

## Step 6: Local Testing with Production Config

### Option A: Using docker-compose with local PostgreSQL

```bash
cd optiload
docker-compose up
```

This will:
- Start local PostgreSQL
- Build and run backend with local .env
- Build and run frontend

Access at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

### Option B: Using docker-compose with Neon DB (Production DB)

Edit `docker-compose.yml` and change backend environment:

```yaml
OPTILOAD_DATABASE_URL: postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Then:

```bash
docker-compose up
```

### Option C: Manual local development

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python -m alembic upgrade head
OPTILOAD_ENVIRONMENT=local python -m uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run dev
```

## Deployment Checklist

- [ ] JWT Secret key is set (not default)
- [ ] Database URL points to Neon PostgreSQL
- [ ] Redis URL is configured
- [ ] CORS allowed origins includes frontend domain
- [ ] Frontend `VITE_API_BASE_URL` points to backend domain
- [ ] Backend health check is passing
- [ ] Database migrations have run successfully
- [ ] Demo mode is disabled (`OPTILOAD_DEMO_MODE=false`)
- [ ] SSL certificates are active
- [ ] Frontend and backend can communicate
- [ ] Rate limiting is working (Redis connected)

## Troubleshooting

### Backend won't start

1. Check logs: `railway logs backend`
2. Verify database connection: `OPTILOAD_DATABASE_URL` is correct
3. Verify JWT secret key is set (not default)
4. Check port binding: Backend should listen on 8000

### Frontend won't load

1. Check logs: `railway logs frontend`
2. Verify `VITE_API_BASE_URL` is correct
3. Check CORS headers on backend response
4. Verify frontend service is running

### API calls fail with CORS error

1. Check backend `OPTILOAD_CORS_ALLOWED_ORIGINS`
2. Verify it includes your frontend domain with HTTPS
3. Restart backend service

### Database connection fails

1. Verify Neon DB credentials are correct
2. Check connection string format includes `?sslmode=require`
3. Test connection locally first
4. Check Railway network connectivity

### Rate limiting not working

1. Verify Redis URL is set in backend env vars
2. Verify Redis service is running
3. Check Redis connection in backend logs
4. Fallback will use in-memory rate limiting if Redis fails

## Environment Variables Reference

### Backend (OPTILOAD_ prefix)

| Variable | Local | Production | Notes |
|----------|-------|------------|-------|
| ENVIRONMENT | local | production | Controls security settings |
| DATABASE_URL | localhost:5432 | Neon URL | PostgreSQL connection |
| JWT_SECRET_KEY | dev-key | Secure random | Must be 32+ chars in prod |
| CORS_ALLOWED_ORIGINS | localhost:5173 | frontend domain | HTTPS only in prod |
| REDIS_URL | Optional | Required | For rate limiting |
| ALLOW_PUBLIC_REGISTRATION | true | false | Disable in production |
| RATE_LIMIT_BACKEND | memory | redis | In-memory or Redis |
| LOG_LEVEL | DEBUG | WARNING | Production = less verbose |
| DEMO_MODE | true | false | Disable in production |

### Frontend (VITE_ prefix)

| Variable | Local | Production |
|----------|-------|------------|
| VITE_API_BASE_URL | http://localhost:8000/api/v1 | https://optiload-be.up.railway.app/api/v1 |

## Support

For issues:

1. Check Railway documentation: https://docs.railway.app/
2. Check application logs in Railway dashboard
3. Verify configuration matches this guide
4. Test locally first before deploying

---

Last updated: 2026-05-13
OptiLoad Production Deployment Guide
