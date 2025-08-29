#!/usr/bin/env python3
"""Test database connection and check existing tables"""

from sqlalchemy import create_engine, text
import sys

def test_database():
    try:
        # Create engine
        engine = create_engine('postgresql://securegate_user:securegate_pass@localhost:5432/securegate')

        print("Testing database connection...")

        with engine.connect() as conn:
            print("✅ Database connection successful!")

            # Check existing tables
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]

            print(f"📋 Existing tables: {tables}")

            if not tables:
                print("ℹ️  No tables found. Running alembic migration...")
                return False
            else:
                print("✅ Tables already exist!")
                return True

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
