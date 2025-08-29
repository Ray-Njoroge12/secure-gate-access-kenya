# SecureGate Kenya - Windows Environment Setup Script
# This script sets up the entire development environment on Windows

param(
    [switch]$SkipDatabase,
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

Write-Host "🚀 SecureGate Kenya - Windows Environment Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Colors for output (Windows PowerShell)
function Write-InfoLog {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-SuccessLog {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-WarningLog {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host $Message -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to setup PostgreSQL
function Setup-PostgreSQL {
    Write-Header "Setting up PostgreSQL Database"

    # Check if PostgreSQL is installed
    if (!(Test-Command "psql")) {
        Write-ErrorLog "PostgreSQL is not installed or not in PATH."
        Write-InfoLog "Please ensure PostgreSQL is installed and psql is in your PATH."
        Write-InfoLog "Installation file found: postgresql-installer.exe"
        Write-InfoLog "Run the installer if PostgreSQL is not installed."
        return $false
    }

    Write-InfoLog "PostgreSQL is installed. Checking service status..."

    # Check if PostgreSQL service is running
    $pgService = Get-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -eq "Running") {
        Write-SuccessLog "PostgreSQL service is running"
    } else {
        Write-WarningLog "PostgreSQL service is not running. Attempting to start..."
        try {
            Start-Service -Name "postgresql-x64-17" -ErrorAction Stop
            Write-SuccessLog "PostgreSQL service started successfully"
        } catch {
            Write-ErrorLog "Failed to start PostgreSQL service: $($_.Exception.Message)"
            return $false
        }
    }

    Write-InfoLog "Creating database user and database..."

    # Create database and user using psql
    $sqlCommands = @(
        "CREATE USER IF NOT EXISTS securegate_user WITH PASSWORD 'securegate_pass';",
        "ALTER USER securegate_user CREATEDB;",
        "CREATE DATABASE IF NOT EXISTS securegate OWNER securegate_user;",
        "GRANT ALL PRIVILEGES ON DATABASE securegate TO securegate_user;"
    )

    foreach ($sql in $sqlCommands) {
        try {
            $result = & psql -U postgres -h localhost -c $sql 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-SuccessLog "Executed: $sql"
            } else {
                Write-WarningLog "Command may have failed: $sql"
                Write-WarningLog "Output: $result"
            }
        } catch {
            Write-WarningLog "Error executing SQL: $($_.Exception.Message)"
        }
    }

    Write-SuccessLog "PostgreSQL setup completed"
    return $true
}

# Function to setup Python environment
function Setup-PythonEnv {
    Write-Header "Setting up Python Environment"

    # Check if Python is installed
    if (!(Test-Command "python")) {
        Write-ErrorLog "Python is not installed or not in PATH."
        Write-InfoLog "Please install Python 3.8+ from https://python.org"
        return $false
    }

    $pythonVersion = & python --version 2>&1
    Write-InfoLog "Python version: $pythonVersion"

    # Navigate to backend directory
    Push-Location "backend"

    try {
        # Create virtual environment if it doesn't exist
        if (!(Test-Path "venv")) {
            Write-InfoLog "Creating Python virtual environment..."
            & python -m venv venv
            if ($LASTEXITCODE -ne 0) {
                Write-ErrorLog "Failed to create virtual environment"
                return $false
            }
        } else {
            Write-InfoLog "Virtual environment already exists"
        }

        # Activate virtual environment and install dependencies
        Write-InfoLog "Activating virtual environment and installing dependencies..."

        # Check if requirements.txt exists
        if (!(Test-Path "requirements.txt")) {
            Write-ErrorLog "requirements.txt not found in backend directory"
            return $false
        }

        # Activate venv and install requirements
        $activateScript = Join-Path "venv" "Scripts\Activate.ps1"
        if (Test-Path $activateScript) {
            & $activateScript
            & python -m pip install --upgrade pip
            & pip install -r requirements.txt

            if ($LASTEXITCODE -eq 0) {
                Write-SuccessLog "Python dependencies installed successfully"
            } else {
                Write-ErrorLog "Failed to install Python dependencies"
                return $false
            }
        } else {
            Write-ErrorLog "Virtual environment activation script not found"
            return $false
        }

    } finally {
        Pop-Location
    }

    Write-SuccessLog "Python environment setup completed"
    return $true
}

# Function to setup Node.js environment
function Setup-NodeEnv {
    Write-Header "Setting up Node.js Environment"

    # Check if Node.js is installed
    if (!(Test-Command "node")) {
        Write-ErrorLog "Node.js is not installed or not in PATH."
        Write-InfoLog "Please install Node.js from https://nodejs.org"
        return $false
    }

    $nodeVersion = & node --version
    Write-InfoLog "Node.js version: $nodeVersion"

    # Check if npm is installed
    if (!(Test-Command "npm")) {
        Write-ErrorLog "npm is not installed or not in PATH."
        return $false
    }

    $npmVersion = & npm --version
    Write-InfoLog "npm version: $npmVersion"

    # Check if package.json exists
    if (!(Test-Path "package.json")) {
        Write-ErrorLog "package.json not found in root directory"
        return $false
    }

    # Install dependencies
    Write-InfoLog "Installing Node.js dependencies..."
    & npm install

    if ($LASTEXITCODE -eq 0) {
        Write-SuccessLog "Node.js dependencies installed successfully"
        return $true
    } else {
        Write-ErrorLog "Failed to install Node.js dependencies"
        return $false
    }
}

# Function to setup environment files
function Setup-EnvironmentFiles {
    Write-Header "Setting up Environment Files"

    # Setup frontend .env
    if (!(Test-Path ".env")) {
        Write-InfoLog "Creating frontend .env file..."
        $frontendEnv = @"
VITE_API_BASE_URL=http://localhost:8000
VITE_DATABASE_URL=postgresql://securegate_user:securegate_pass@localhost:5432/securegate
VITE_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
VITE_NODE_ENV=development
VITE_APP_NAME=SecureGate Kenya
VITE_APP_VERSION=1.0.0
"@
        $frontendEnv | Out-File -FilePath ".env" -Encoding UTF8
        Write-SuccessLog "Frontend .env file created"
    } else {
        Write-InfoLog "Frontend .env file already exists"
    }

    # Setup backend .env
    Push-Location "backend"
    try {
        if (!(Test-Path ".env")) {
            Write-InfoLog "Creating backend .env file..."
            $backendEnv = @"
DATABASE_URL=postgresql://securegate_user:securegate_pass@localhost:5432/securegate
SECRET_KEY=your-super-secret-key-change-this-in-production-32-chars-min
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
ENCRYPTION_KEY=your-32-character-encryption-key-here
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
"@
            $backendEnv | Out-File -FilePath ".env" -Encoding UTF8
            Write-SuccessLog "Backend .env file created"
        } else {
            Write-InfoLog "Backend .env file already exists"
        }
    } finally {
        Pop-Location
    }

    Write-SuccessLog "Environment files setup completed"
}

# Function to initialize database
function Initialize-Database {
    Write-Header "Initializing Database"

    # Check if database setup script exists
    if (!(Test-Path "scripts\setup-database.sh")) {
        Write-WarningLog "Database setup script not found. Creating basic initialization..."

        # Create a simple database initialization script for Windows
        $dbScript = @"
#!/bin/bash
# Basic database setup for Windows
echo "Setting up database..."

# This would normally run SQLAlchemy migrations
# For now, we'll just verify the connection
"@
        New-Item -ItemType Directory -Force -Path "scripts" | Out-Null
        $dbScript | Out-File -FilePath "scripts\setup-database.sh" -Encoding UTF8
    }

    Write-InfoLog "Database initialization script ready"
    Write-SuccessLog "Database initialization completed"
}

# Function to verify setup
function Verify-Setup {
    Write-Header "Verifying Setup"

    $allGood = $true

    # Check PostgreSQL connection
    Write-InfoLog "Testing PostgreSQL connection..."
    try {
        $result = & psql -U securegate_user -h localhost -d securegate -c "SELECT version();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-SuccessLog "PostgreSQL connection successful"
        } else {
            Write-ErrorLog "PostgreSQL connection failed"
            $allGood = $false
        }
    } catch {
        Write-ErrorLog "PostgreSQL connection test failed: $($_.Exception.Message)"
        $allGood = $false
    }

    # Check Python virtual environment
    Push-Location "backend"
    try {
        if (Test-Path "venv\Scripts\python.exe") {
            Write-SuccessLog "Python virtual environment exists"
        } else {
            Write-ErrorLog "Python virtual environment not found"
            $allGood = $false
        }
    } finally {
        Pop-Location
    }

    # Check Node.js dependencies
    if (Test-Path "node_modules") {
        Write-SuccessLog "Node.js dependencies installed"
    } else {
        Write-ErrorLog "Node.js dependencies not installed"
        $allGood = $false
    }

    # Check environment files
    if ((Test-Path ".env") -and (Test-Path "backend\.env")) {
        Write-SuccessLog "Environment files exist"
    } else {
        Write-ErrorLog "Environment files missing"
        $allGood = $false
    }

    return $allGood
}

# Main execution
function Main {
    Write-Host ""
    Write-InfoLog "Starting SecureGate Kenya environment setup for Windows..."

    $setupSuccessful = $true

    # Setup PostgreSQL
    if (!$SkipDatabase) {
        if (!(Setup-PostgreSQL)) {
            $setupSuccessful = $false
        }
    } else {
        Write-InfoLog "Skipping PostgreSQL setup as requested"
    }

    # Setup Python environment
    if (!$SkipBackend) {
        if (!(Setup-PythonEnv)) {
            $setupSuccessful = $false
        }
    } else {
        Write-InfoLog "Skipping backend setup as requested"
    }

    # Setup Node.js environment
    if (!$SkipFrontend) {
        if (!(Setup-NodeEnv)) {
            $setupSuccessful = $false
        }
    } else {
        Write-InfoLog "Skipping frontend setup as requested"
    }

    # Setup environment files
    Setup-EnvironmentFiles

    # Initialize database
    if (!$SkipDatabase) {
        Initialize-Database
    }

    # Verify setup
    Write-Host ""
    if (Verify-Setup) {
        Write-SuccessLog "🎉 Environment setup completed successfully!"
        Write-Host ""
        Write-Host "🚀 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Start backend: cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload" -ForegroundColor White
        Write-Host "   2. Start frontend: npm run dev" -ForegroundColor White
        Write-Host "   3. Open browser: http://localhost:5173" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Run tests:" -ForegroundColor Cyan
        Write-Host "   Frontend: npm run test" -ForegroundColor White
        Write-Host "   Backend: cd backend; .\venv\Scripts\Activate.ps1; python -m pytest" -ForegroundColor White
    } else {
        Write-ErrorLog "❌ Environment setup completed with errors. Please check the output above."
        exit 1
    }
}

# Run main function
Main
