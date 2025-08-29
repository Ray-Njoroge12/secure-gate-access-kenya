#!/bin/bash
# SecureGate Kenya - Environment Verification Script
# This script checks if the development environment is properly configured

set -e

echo "🔍 SecureGate Kenya - Environment Verification"
echo "=============================================="

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify system requirements
check_system_requirements() {
    echo ""
    print_status "Checking system requirements..."

    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed"
    fi

    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm is not installed"
    fi

    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python installed: $PYTHON_VERSION"
    else
        print_error "Python3 is not installed"
    fi

    # Check PostgreSQL
    if command_exists psql; then
        PG_VERSION=$(psql --version | head -n1)
        print_success "PostgreSQL installed: $PG_VERSION"
    else
        print_error "PostgreSQL is not installed"
    fi
}

# Verify environment files
check_environment_files() {
    echo ""
    print_status "Checking environment configuration..."

    # Check frontend .env
    if [ -f ".env" ]; then
        print_success "Frontend .env file exists"
        if grep -q "VITE_API_BASE_URL" .env; then
            print_success "Frontend API base URL configured"
        else
            print_warning "Frontend API base URL not found in .env"
        fi
    else
        print_error "Frontend .env file missing"
    fi

    # Check backend .env
    if [ -f "backend/.env" ]; then
        print_success "Backend .env file exists"
        if grep -q "DATABASE_URL" backend/.env; then
            print_success "Backend database URL configured"
        else
            print_warning "Backend database URL not found in .env"
        fi
    else
        print_error "Backend .env file missing"
    fi
}

# Verify dependencies
check_dependencies() {
    echo ""
    print_status "Checking dependencies..."

    # Check frontend dependencies
    if [ -d "node_modules" ]; then
        print_success "Frontend dependencies installed"
    else
        print_warning "Frontend dependencies not installed (run: npm install)"
    fi

    # Check backend dependencies
    if [ -d "backend/venv" ]; then
        print_success "Backend virtual environment exists"
        if [ -f "backend/requirements.txt" ]; then
            print_success "Backend requirements.txt found"
        fi
    else
        print_warning "Backend virtual environment not found"
    fi
}

# Test database connection
test_database_connection() {
    echo ""
    print_status "Testing database connection..."

    if [ -f "backend/.env" ]; then
        # Extract database URL from backend .env
        DB_URL=$(grep "DATABASE_URL" backend/.env | cut -d '=' -f2-)

        if [ ! -z "$DB_URL" ]; then
            print_status "Testing connection to: $DB_URL"

            # Try to connect (this is a simple test)
            if timeout 5 bash -c "</dev/tcp/localhost/5432" 2>/dev/null; then
                print_success "PostgreSQL service is running on port 5432"
            else
                print_warning "PostgreSQL service may not be running on port 5432"
            fi
        else
            print_error "DATABASE_URL not found in backend/.env"
        fi
    else
        print_error "Backend .env file not found"
    fi
}

# Check build status
check_build_status() {
    echo ""
    print_status "Checking build status..."

    if [ -d "dist" ]; then
        print_success "Frontend build exists (dist/ directory found)"
    else
        print_warning "Frontend not built yet (run: npm run build)"
    fi

    if [ -d "backend/app/__pycache__" ]; then
        print_success "Backend appears to have been run (Python cache found)"
    else
        print_status "Backend not yet initialized"
    fi
}

# Show status summary
show_summary() {
    echo ""
    echo "📋 Environment Verification Summary"
    echo "==================================="
    echo ""
    echo "✅ System Requirements Check: Complete"
    echo "✅ Environment Files Check: Complete"
    echo "✅ Dependencies Check: Complete"
    echo "✅ Database Connection Test: Complete"
    echo "✅ Build Status Check: Complete"
    echo ""
    print_success "Environment verification completed!"
    echo ""
    echo "🚀 Ready to start development:"
    echo "   1. Backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
    echo "   2. Frontend: npm run dev"
    echo "   3. Open: http://localhost:5173"
}

# Main execution
main() {
    check_system_requirements
    check_environment_files
    check_dependencies
    test_database_connection
    check_build_status
    show_summary
}

# Run main function
main "$@"
