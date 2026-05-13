# OptiLoad - Switch between local and production database for development
# PowerShell version for Windows

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OptiLoad Database Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Use LOCAL PostgreSQL (default)" -ForegroundColor Yellow
Write-Host "2. Use PRODUCTION Neon DB (remote)" -ForegroundColor Yellow
Write-Host ""
$choice = Read-Host "Select option (1 or 2)"

switch ($choice) {
  "1" {
    Write-Host ""
    Write-Host "Configuring for LOCAL PostgreSQL..." -ForegroundColor Green
    Write-Host ""
    
    $env_content = @"
OPTILOAD_ENVIRONMENT=local
OPTILOAD_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/optiload
OPTILOAD_JWT_SECRET_KEY=dev-secret-key-change-in-production-32chars
OPTILOAD_CORS_ALLOWED_ORIGINS='["http://localhost:5173","http://localhost:8080"]'
OPTILOAD_TRUSTED_HOSTS='["localhost","127.0.0.1"]'
OPTILOAD_ALLOW_PUBLIC_REGISTRATION=true
OPTILOAD_RATE_LIMIT_BACKEND=memory
OPTILOAD_RATE_LIMIT_PER_MINUTE=100
OPTILOAD_AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=30
OPTILOAD_DB_POOL_SIZE=5
OPTILOAD_DB_MAX_OVERFLOW=10

# ─── DEMO MODE ────────────────────────────────────────
# Set to true to enable demo mode (returns exact reference layouts)
DEMO_MODE=true
OPTILOAD_DEMO_MODE=true
"@
    
    $env_file = Join-Path $BACKEND_DIR ".env"
    Set-Content -LiteralPath $env_file -Value $env_content -Encoding UTF8
    
    Write-Host "✓ Backend configured for LOCAL PostgreSQL" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Ensure PostgreSQL is running locally on port 5432"
    Write-Host "  2. Create database: createdb -U postgres optiload"
    Write-Host "  3. Run migrations: cd backend && python -m alembic upgrade head"
    Write-Host "  4. Start backend: Set-Item Env:\OPTILOAD_ENVIRONMENT -Value 'local'; python -m uvicorn app.main:app --reload"
    Write-Host "  5. Start frontend: cd frontend && npm run dev"
    Write-Host ""
  }
  
  "2" {
    Write-Host ""
    Write-Host "Configuring for PRODUCTION Neon DB..." -ForegroundColor Green
    Write-Host ""
    
    $env_content = @"
OPTILOAD_ENVIRONMENT=local
OPTILOAD_DATABASE_URL=postgresql+psycopg2://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
OPTILOAD_DATABASE_READ_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
OPTILOAD_JWT_SECRET_KEY=dev-secret-key-change-in-production-32chars
OPTILOAD_CORS_ALLOWED_ORIGINS='["http://localhost:5173","http://localhost:8080"]'
OPTILOAD_TRUSTED_HOSTS='["localhost","127.0.0.1"]'
OPTILOAD_ALLOW_PUBLIC_REGISTRATION=true
OPTILOAD_RATE_LIMIT_BACKEND=memory
OPTILOAD_RATE_LIMIT_PER_MINUTE=100
OPTILOAD_AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=30
OPTILOAD_DB_POOL_SIZE=5
OPTILOAD_DB_MAX_OVERFLOW=10

# ─── DEMO MODE ────────────────────────────────────────
DEMO_MODE=true
OPTILOAD_DEMO_MODE=true
"@
    
    $env_file = Join-Path $BACKEND_DIR ".env"
    Set-Content -LiteralPath $env_file -Value $env_content -Encoding UTF8
    
    Write-Host "✓ Backend configured for PRODUCTION Neon DB" -ForegroundColor Green
    Write-Host ""
    Write-Host "WARNING: Using production database for local development!" -ForegroundColor Red
    Write-Host "         Any changes will affect the production database." -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run migrations (if needed): cd backend && python -m alembic upgrade head"
    Write-Host "  2. Start backend: Set-Item Env:\OPTILOAD_ENVIRONMENT -Value 'local'; python -m uvicorn app.main:app --reload"
    Write-Host "  3. Start frontend: cd frontend && npm run dev"
    Write-Host ""
    Write-Host "Access at: http://localhost:5173" -ForegroundColor Green
    Write-Host ""
  }
  
  default {
    Write-Host "Invalid option" -ForegroundColor Red
    exit 1
  }
}

Write-Host "Configuration complete!" -ForegroundColor Green
