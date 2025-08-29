#!/bin/bash
# SecureGate Kenya - Database Initialization Script
# This script sets up the PostgreSQL database with all required tables and configurations

set -e

echo "🔧 SecureGate Kenya - Database Initialization"
echo "=============================================="

# Database configuration
DB_NAME="securegate"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."
    if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER >/dev/null 2>&1; then
        print_error "PostgreSQL is not running or not accessible"
        print_status "Please ensure PostgreSQL is running on $DB_HOST:$DB_PORT"
        exit 1
    fi
    print_success "PostgreSQL is running"
}

# Create database if it doesn't exist
create_database() {
    print_status "Creating database '$DB_NAME' if it doesn't exist..."

    # Connect to postgres database to create the target database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

    if [ $? -eq 0 ]; then
        print_success "Database '$DB_NAME' created or already exists"
    else
        print_warning "Could not create database (might already exist)"
    fi
}

# Run database migrations/schema setup
setup_schema() {
    print_status "Setting up database schema..."

    # Use environment variable or default to the backend directory
    SCHEMA_DIR="$(dirname "$0")/../backend/app"

    if [ -f "$SCHEMA_DIR/models.py" ]; then
        print_status "Found SQLAlchemy models in $SCHEMA_DIR"

        # Create tables using SQLAlchemy
        cd "$(dirname "$0")/../backend"
        python -c "
from app.database import engine
from app.models import Base
import sys

try:
    print('Creating tables...')
    Base.metadata.create_all(bind=engine)
    print('✅ All tables created successfully!')
except Exception as e:
    print(f'❌ Error creating tables: {e}')
    sys.exit(1)
"
    else
        print_warning "SQLAlchemy models not found, using manual SQL setup..."

        # Manual SQL setup as fallback
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    unit_number VARCHAR(50),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'resident',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    full_name_ct VARCHAR(512) NOT NULL,
    id_number_ct VARCHAR(256) NOT NULL,
    phone_ct VARCHAR(256) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER REFERENCES visitors(id) ON DELETE CASCADE,
    pin_hash VARCHAR(255) NOT NULL,
    qr_token VARCHAR(2048),
    jti VARCHAR(64),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    resident_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    visitor_full_name VARCHAR(255) NOT NULL,
    visitor_email VARCHAR(255) NOT NULL,
    visitor_phone_number VARCHAR(50) NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    visit_purpose VARCHAR(500),
    visit_duration_hours INTEGER,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_resident ON invitations(resident_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_access_codes_visitor ON access_codes(visitor_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_jti ON access_codes(jti);

-- Insert sample data for testing
INSERT INTO users (id, email, password) VALUES
('user-1', 'admin@securegate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fEtTT2/Dm')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, user_id, email, full_name, unit_number, role) VALUES
('profile-1', 'user-1', 'admin@securegate.com', 'System Administrator', 'ADMIN', 'admin')
ON CONFLICT DO NOTHING;

EOF
    fi
}

# Insert sample data
insert_sample_data() {
    print_status "Inserting sample data for testing..."

    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Sample data insertion (only if tables are empty)
INSERT INTO users (id, email, password)
SELECT 'user-1', 'admin@securegate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fEtTT2/Dm'
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

INSERT INTO profiles (id, user_id, email, full_name, unit_number, role)
SELECT 'profile-1', 'user-1', 'admin@securegate.com', 'System Administrator', 'ADMIN', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Sample invitation for testing
INSERT INTO invitations (resident_id, visitor_full_name, visitor_email, visitor_phone_number, visit_date, visit_purpose, invitation_token, token_expires_at, status)
SELECT 'user-1', 'John Doe', 'john.doe@example.com', '+254712345678', NOW() + INTERVAL '1 day', 'Business Meeting', 'sample-token-123', NOW() + INTERVAL '25 hours', 'pending'
WHERE NOT EXISTS (SELECT 1 FROM invitations LIMIT 1);
EOF

    print_success "Sample data inserted"
}

# Verify setup
verify_setup() {
    print_status "Verifying database setup..."

    # Check table existence
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt" >/dev/null

    if [ $? -eq 0 ]; then
        print_success "Database tables created successfully"

        # Show table count
        TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | xargs)
        print_status "Created $TABLE_COUNT tables"

        # Show sample data
        USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM users;" | xargs)
        print_status "Users in database: $USER_COUNT"

    else
        print_error "Failed to verify database setup"
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 Starting SecureGate Kenya database initialization..."
    echo ""

    check_postgres
    create_database
    setup_schema
    insert_sample_data
    verify_setup

    echo ""
    print_success "🎉 Database initialization completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Start the backend server: cd backend && python -m uvicorn app.main:app --reload"
    echo "  2. Start the frontend: npm run dev"
    echo "  3. Access the application at http://localhost:3000"
    echo ""
    print_status "Database connection string: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
}

# Run main function
main "$@"
