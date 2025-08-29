#!/usr/bin/env python3
"""Clean up database and reset for fresh migration"""

from sqlalchemy import create_engine, text

def cleanup_database():
    try:
        engine = create_engine('postgresql://securegate_user:securegate_pass@localhost:5432/securegate')

        with engine.connect() as conn:
            print("🧹 Cleaning up existing database objects...")

            # Drop existing tables if they exist
            tables_to_drop = ['access_codes', 'visitors', 'alembic_version']
            for table in tables_to_drop:
                try:
                    conn.execute(text(f'DROP TABLE IF EXISTS {table} CASCADE'))
                    print(f"✅ Dropped table: {table}")
                except Exception as e:
                    print(f"⚠️  Could not drop {table}: {e}")

            # Drop existing indexes if they exist
            indexes_to_drop = ['ix_access_codes_jti', 'ix_access_codes_visitor_id']
            for index in indexes_to_drop:
                try:
                    conn.execute(text(f'DROP INDEX IF EXISTS {index}'))
                    print(f"✅ Dropped index: {index}")
                except Exception as e:
                    print(f"⚠️  Could not drop {index}: {e}")

            conn.commit()
            print("✅ Database cleanup completed")

    except Exception as e:
        print(f"❌ Database cleanup failed: {e}")

if __name__ == "__main__":
    cleanup_database()
