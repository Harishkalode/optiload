FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OPTILOAD_ENVIRONMENT=production \
    OPTILOAD_JWT_SECRET_KEY=E1zZo1KiEFHF9srVaR1ZLfakYGBRTn1zvHOz3jrdI8-HDqBfbd69vAaoUdAbV-v1 \
    OPTILOAD_REDIS_URL=redis://default:c3o1Yl4iMvhVpzj8jZFjRszzbmqH5GMW@redis-15167.c239.us-east-1-2.ec2.cloud.redislabs.com:15167 \
    OPTILOAD_DATABASE_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require \
    OPTILOAD_DATABASE_READ_URL=postgresql://neondb_owner:npg_bqD7k6ScMjgW@ep-winter-shadow-aj3tdqfj.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require \
    OPTILOAD_SEED_ON_STARTUP=true

WORKDIR /app

RUN groupadd -r optiload && \
    useradd -r -g optiload -d /app -s /sbin/nologin optiload

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY app /app/app
COPY alembic.ini /app/alembic.ini
COPY migrations /app/migrations
COPY seed_data.json /app/seed_data.json

RUN chown -R optiload:optiload /app && \
    chmod -R 555 /app

USER optiload

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/meta/health')" || exit 1

EXPOSE 8000

ENV UVICORN_WORKERS=4
CMD sh -c "python -c \"import os, urllib.parse, psycopg2; u=urllib.parse.urlparse(os.environ['OPTILOAD_DATABASE_URL'].split('+')[0] if '+' in os.environ['OPTILOAD_DATABASE_URL'] else os.environ['OPTILOAD_DATABASE_URL']); c=psycopg2.connect(host=u.hostname, port=u.port or 5432, dbname=u.path[1:], user=u.username, password=u.password, sslmode='require'); c.autocommit=True; c.execute('CREATE SCHEMA IF NOT EXISTS public'); c.close()\" && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS} --timeout-graceful-shutdown 30"
