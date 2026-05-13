#!/bin/bash
# OptiLoad - Switch between local and production database for development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "========================================"
echo "OptiLoad Database Configuration"
echo "========================================"
echo ""
echo "1. Use LOCAL PostgreSQL (default)"
echo "2. Use PRODUCTION Neon DB (remote)"
echo ""
read -p "Select option (1 or 2): " choice

case $choice in
  1)
    echo ""
    echo "Configuring for LOCAL PostgreSQL..."
    echo ""
    
    # Update backend .env
    cat > "$BACKEND_DIR/.env" << 'EOF'
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
EOF
    
    echo "✓ Backend configured for LOCAL PostgreSQL"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure PostgreSQL is running locally on port 5432"
    echo "  2. Create database: createdb -U postgres optiload"
    echo "  3. Run migrations: cd backend && python -m alembic upgrade head"
    echo "  4. Start backend: OPTILOAD_ENVIRONMENT=local python -m uvicorn app.main:app --reload"
    echo "  5. Start frontend: cd frontend && npm run dev"
    echo ""
    ;;
    
  2)
    echo ""
    echo "Configuring for PRODUCTION Neon DB..."
    echo ""
    
    # Update backend .env to use Neon
    cat > "$BACKEND_DIR/.env" << 'EOF'
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
EOF
    
    echo "✓ Backend configured for PRODUCTION Neon DB"
    echo ""
    echo "WARNING: Using production database for local development!"
    echo "         Any changes will affect the production database."
    echo ""
    echo "Next steps:"
    echo "  1. Run migrations (if needed): cd backend && python -m alembic upgrade head"
    echo "  2. Start backend: OPTILOAD_ENVIRONMENT=local python -m uvicorn app.main:app --reload"
    echo "  3. Start frontend: cd frontend && npm run dev"
    echo ""
    echo "Access at: http://localhost:5173"
    echo ""
    ;;
    
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

echo "Configuration complete!"
