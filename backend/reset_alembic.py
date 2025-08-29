#!/usr/bin/env python3
"""Reset alembic migration state"""

from sqlalchemy import create_engine, text

def reset_alembic():
    try:
        engine = create_engine('postgresql://securegate_user:securegate_pass@localhost:5432/securegate')

        with engine.connect() as conn:
            # Drop alembic version table if it exists
            conn.execute(text('DROP TABLE IF EXISTS alembic_version'))
            conn.commit()
            print("✅ Alembic version table dropped")

    except Exception as e:
        print(f"❌ Failed to reset alembic: {e}")

if __name__ == "__main__":
    reset_alembic()
