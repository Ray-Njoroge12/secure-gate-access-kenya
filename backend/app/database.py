from __future__ import annotations
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from .config import get_settings

settings = get_settings()

engine = None
SessionLocal = None

if settings.DATABASE_URL:
    # Enhanced connection pooling configuration
    connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

    # Production-ready connection pool settings
    pool_settings = {
        "poolclass": QueuePool,
        "pool_size": 10,  # Number of connections to keep in pool
        "max_overflow": 20,  # Maximum number of connections beyond pool_size
        "pool_timeout": 30,  # Seconds to wait for a connection
        "pool_recycle": 3600,  # Recycle connections after 1 hour
        "pool_pre_ping": True,  # Test connections before using them
        "echo": False,  # Disable SQL logging in production
    }

    # Adjust pool settings for SQLite (single-threaded)
    if settings.DATABASE_URL.startswith("sqlite"):
        pool_settings.update({
            "pool_size": 1,
            "max_overflow": 0,
            "connect_args": {"check_same_thread": False}
        })

    engine = create_engine(
        settings.DATABASE_URL,
        future=True,
        **pool_settings
    )

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True
    )


@contextmanager
def get_session():
    if SessionLocal is None:
        yield None
        return
    session: Session = SessionLocal()  # type: ignore
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
