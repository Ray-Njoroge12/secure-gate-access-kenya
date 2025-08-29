#!/bin/bash
# SecureGate Kenya - Complete Environment Setup Script
# This script sets up the entire development environment from scratch

set -e

echo "🚀 SecureGate Kenya - Complete Environment Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "\n${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup PostgreSQL
setup_postgresql() {
    print_header "Setting up PostgreSQL Database"

    if ! command_exists psql; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL first."
        print_status "On Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        print_status "On macOS: brew install postgresql"
        print_status "On Windows: Download from https://www.postgresql.org/download/windows/"
        exit 1
    fi

    print_status "Starting PostgreSQL service..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql 2>/dev/null || true
        sudo systemctl enable postgresql 2>/dev/null || true
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql 2>/dev/null || true
    fi

    print_status "Creating database user and database..."
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER postgres CREATEDB;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE securegate OWNER postgres;" 2>/dev/null || true

    print_success "PostgreSQL setup completed"
}

# Function to setup Python environment
setup_python_env() {
    print_header "Setting up Python Environment"

    cd backend

    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi

    print_status "Activating virtual environment and installing dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt

    print_success "Python environment setup completed"
    cd ..
}

# Function to setup Node.js environment
setup_node_env() {
    print_header "Setting up Node.js Environment"

    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        print_status "Download from https://nodejs.org/"
        exit 1
    fi

    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    print_status "Installing frontend dependencies..."
    npm install

    print_success "Node.js environment setup completed"
}

# Function to initialize database
initialize_database() {
    print_header "Initializing Database"

    cd backend
    source venv/bin/activate

    print_status "Creating database tables..."
    python -c "
from app.database import engine
from app.models import Base
from app.config import get_settings
import sys

settings = get_settings()
if not settings.DATABASE_URL:
    print('❌ DATABASE_URL not set in environment')
    sys.exit(1)

try:
    print('Creating tables...')
    Base.metadata.create_all(bind=engine)
    print('✅ All tables created successfully!')
except Exception as e:
    print(f'❌ Error creating tables: {e}')
    sys.exit(1)
"

    print_success "Database initialization completed"
    cd ..
}

# Function to create environment files
create_env_files() {
    print_header "Creating Environment Configuration Files"

    # Frontend .env file
    if [ ! -f ".env" ]; then
        print_status "Creating frontend .env file..."
        cat > .env << 'EOF'
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=SecureGate Kenya
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development

# Database (for frontend components that need direct DB access)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/securegate

# JWT Secret (for development - CHANGE IN PRODUCTION)
JWT_SECRET=dev_jwt_secret_key_change_in_production_32bytes!!!

# Server Port
PORT=3000

# Environment
NODE_ENV=development
EOF
        print_success "Frontend .env file created"
    else
        print_warning "Frontend .env file already exists"
    fi

    # Backend .env file
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend .env file..."
        cat > backend/.env << 'EOF'
# Backend Environment Configuration
ENV=development
PORT=8000
API_PREFIX=/api
APP_ENCRYPTION_KEY=dev_app_encryption_key_32bytes_!!!!
ACCESS_CODE_MODE=prod
ACCESS_CODE_TTL_HOURS=24
INTERNAL_API_KEY=dev_internal_api_key_change_in_prod
RS256_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB...\n-----END PRIVATE KEY-----
RS256_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7VJTUt9Us8cKB...\n-----END PUBLIC KEY-----
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/securegate

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Security Settings
SECRET_KEY=dev_secret_key_change_in_production_32bytes!!!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration (Optional - for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
EOF
        print_success "Backend .env file created"
    else
        print_warning "Backend .env file already exists"
    fi
}

# Function to run database migrations
run_migrations() {
    print_header "Running Database Migrations"

    cd backend
    source venv/bin/activate

    if [ -f "alembic.ini" ]; then
        print_status "Running Alembic migrations..."
        alembic upgrade head
        print_success "Migrations completed"
    else
        print_warning "No Alembic configuration found, skipping migrations"
    fi

    cd ..
}

# Function to seed database with sample data
seed_database() {
    print_header "Seeding Database with Sample Data"

    cd backend
    source venv/bin/activate

    print_status "Creating sample users and data..."
    python -c "
from app.database import get_session
from app.models import User, Profile, Invitation
from datetime import datetime, timedelta, UTC
import uuid

with get_session() as session:
    # Create sample admin user
    admin_user = User(
        id=str(uuid.uuid4()),
        email='admin@securegate.com',
        password='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fEtTT2/Dm'  # password: admin123
    )
    session.merge(admin_user)

    # Create admin profile
    admin_profile = Profile(
        id=str(uuid.uuid4()),
        user_id=admin_user.id,
        email=admin_user.email,
        full_name='System Administrator',
        unit_number='ADMIN',
        role='admin'
    )
    session.merge(admin_profile)

    # Create sample resident user
    resident_user = User(
        id=str(uuid.uuid4()),
        email='resident@securegate.com',
        password='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fEtTT2/Dm'  # password: resident123
    )
    session.merge(resident_user)

    # Create resident profile
    resident_profile = Profile(
        id=str(uuid.uuid4()),
        user_id=resident_user.id,
        email=resident_user.email,
        full_name='John Resident',
        unit_number='A101',
        phone='+254712345678',
        role='resident'
    )
    session.merge(resident_profile)

    # Create sample invitation
    sample_invitation = Invitation(
        resident_id=resident_user.id,
        visitor_full_name='Jane Doe',
        visitor_email='jane.doe@example.com',
        visitor_phone_number='+254798765432',
        visit_date=datetime.now(UTC) + timedelta(days=1),
        visit_purpose='Business Meeting',
        visit_duration_hours=2,
        invitation_token='sample-token-' + str(uuid.uuid4())[:8],
        token_expires_at=datetime.now(UTC) + timedelta(hours=25),
        status='pending'
    )
    session.merge(sample_invitation)

    session.commit()
    print('✅ Sample data created successfully!')
    print('📧 Admin login: admin@securegate.com / admin123')
    print('📧 Resident login: resident@securegate.com / resident123')
"

    cd ..
}

# Function to build frontend
build_frontend() {
    print_header "Building Frontend Application"

    print_status "Installing dependencies and building..."
    npm run build

    print_success "Frontend build completed"
}

# Function to test the setup
test_setup() {
    print_header "Testing Complete Setup"

    print_status "Testing database connection..."
    cd backend
    source venv/bin/activate
    python -c "
from app.config import get_settings
from app.database import engine
from sqlalchemy import text

settings = get_settings()
print(f'📊 Database URL: {settings.DATABASE_URL}')

try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1'))
        print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"
    cd ..

    print_status "Testing frontend build..."
    if [ -d "dist" ]; then
        print_success "Frontend build verified"
    else
        print_error "Frontend build failed"
        exit 1
    fi

    print_success "All tests passed!"
}

# Function to show next steps
show_next_steps() {
    print_header "🎉 Setup Complete! Next Steps"

    echo ""
    print_success "Your SecureGate Kenya development environment is ready!"
    echo ""
    echo "📋 To start developing:"
    echo ""
    echo "1. Start the backend API server:"
    echo "   cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
    echo ""
    echo "2. In another terminal, start the frontend development server:"
    echo "   npm run dev"
    echo ""
    echo "3. Open your browser and navigate to:"
    echo "   http://localhost:5173 (frontend)"
    echo "   http://localhost:8000/docs (API documentation)"
    echo ""
    echo "🔐 Sample login credentials:"
    echo "   Admin: admin@securegate.com / admin123"
    echo "   Resident: resident@securegate.com / resident123"
    echo ""
    echo "📚 Useful commands:"
    echo "   • npm run build     - Build frontend for production"
    echo "   • npm run test      - Run frontend tests"
    echo "   • cd backend && python -m pytest - Run backend tests"
    echo "   • docker-compose up - Start all services with Docker"
    echo ""
    print_warning "⚠️  Remember to change default passwords in production!"
    echo ""
}

# Main execution function
main() {
    echo "🔧 This script will set up the complete SecureGate Kenya development environment"
    echo "   including PostgreSQL, Python backend, Node.js frontend, and database initialization."
    echo ""

    # Confirm before proceeding
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled by user"
        exit 0
    fi

    # Execute setup steps
    create_env_files
    setup_postgresql
    setup_python_env
    setup_node_env
    initialize_database
    run_migrations
    seed_database
    build_frontend
    test_setup
    show_next_steps

    print_success "🎉 SecureGate Kenya setup completed successfully!"
}

# Run main function with all arguments
main "$@"
