FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN addgroup --system optiload && adduser --system --ingroup optiload optiload

COPY pyproject.toml /app/pyproject.toml
RUN pip install --no-cache-dir \
  fastapi>=0.115.0 \
  uvicorn>=0.30.0 \
  sqlalchemy>=2.0.30 \
  pydantic>=2.7.0 \
  pydantic-settings>=2.2.1 \
  passlib[bcrypt]>=1.7.4 \
  python-jose[cryptography]>=3.3.0 \
  email-validator>=2.1.1 \
  psycopg[binary]>=3.2.0

COPY app /app/app
COPY .env.example /app/.env.example

RUN chown -R optiload:optiload /app
USER optiload

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
