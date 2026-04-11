"""Database session management with environment-driven pool configuration."""

from collections.abc import Generator

from app.core.config import settings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

connect_args = {}
if "postgresql" in settings.database_url and settings.db_statement_timeout_ms:
    connect_args["options"] = f"-c statement_timeout={settings.db_statement_timeout_ms}"

engine = create_engine(
    settings.database_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)

read_engine = engine
if settings.database_read_url and settings.is_production:
    pool_half = max(1, (settings.db_pool_size or 5) // 2)
    overflow_half = max(1, (settings.db_max_overflow or 10) // 2)
    read_engine = create_engine(
        settings.database_read_url,
        pool_size=pool_half,
        max_overflow=overflow_half,
        pool_timeout=settings.db_pool_timeout,
        pool_recycle=settings.db_pool_recycle,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_read_db() -> Generator[Session, None, None]:
    db = sessionmaker(bind=read_engine, autoflush=False, autocommit=False, class_=Session)()
    try:
        yield db
    finally:
        db.close()


def health_check_db() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
