#!/usr/bin/env python3
"""Create database tables directly from SQLAlchemy models"""

from sqlalchemy import create_engine, text
from app.models import Base
import sys

def create_tables():
    try:
        print("Creating database tables from SQLAlchemy models...")

        # Create engine
        engine = create_engine('postgresql://securegate_user:securegate_pass@localhost:5432/securegate')

        # Create all tables
        Base.metadata.create_all(bind=engine)

        print("✅ Database tables created successfully!")

        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 Created tables: {tables}")

        return True

    except Exception as e:
        print(f"Failed to create tables: {e}")
        return False

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)
