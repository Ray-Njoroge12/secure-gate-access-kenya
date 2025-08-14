# PowerShell Deployment Script for Windows
# Secure Gate Access - Windows Deployment

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "test", "deploy", "rollback", "health", "backup")]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development"
)

# Configuration
$DOCKER_REGISTRY = "your-registry.com"
$IMAGE_NAME = "secure-gate-access"
$COMPOSE_FILE = "docker-compose.yml"

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

# Check dependencies
function Test-Dependencies {
    Write-InfoLog "Checking dependencies..."
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-ErrorLog "Docker is required but not installed. Aborting."
        exit 1
    }
    
    if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-ErrorLog "Docker Compose is required but not installed. Aborting."
        exit 1
    }
    
    Write-SuccessLog "Dependencies check passed"
}

# Environment setup
function Set-Environment {
    param([string]$Env)
    Write-InfoLog "Setting up environment: $Env"
    
    switch ($Env) {
        "development" {
            $env:NODE_ENV = "development"
            $env:COMPOSE_FILE = "docker-compose.yml;docker-compose.dev.yml"
        }
        "staging" {
            $env:NODE_ENV = "staging"
            $env:COMPOSE_FILE = "docker-compose.yml;docker-compose.staging.yml"
        }
        "production" {
            $env:NODE_ENV = "production"
            $env:COMPOSE_FILE = "docker-compose.yml;docker-compose.prod.yml"
        }
        default {
            Write-ErrorLog "Unknown environment: $Env"
            exit 1
        }
    }
    
    # Load environment variables
    $envFile = ".env.$Env"
    if (Test-Path $envFile) {
        Write-InfoLog "Loading environment variables from $envFile"
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    } else {
        Write-WarningLog "Environment file $envFile not found"
    }
}

# Build application
function Build-App {
    Write-InfoLog "Building application..."
    
    # Build Docker image
    docker build -t "${IMAGE_NAME}:latest" .
    
    # Tag for registry if specified
    if ($DOCKER_REGISTRY) {
        $gitHash = git rev-parse --short HEAD
        docker tag "${IMAGE_NAME}:latest" "${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
        docker tag "${IMAGE_NAME}:latest" "${DOCKER_REGISTRY}/${IMAGE_NAME}:$gitHash"
    }
    
    Write-SuccessLog "Application build completed"
}

# Run tests
function Invoke-Tests {
    Write-InfoLog "Running tests..."
    
    # Run unit tests
    npm run test:unit
    if ($LASTEXITCODE -ne 0) { throw "Unit tests failed" }
    
    # Run integration tests
    npm run test:integration
    if ($LASTEXITCODE -ne 0) { throw "Integration tests failed" }
    
    # Run security tests
    npm run test:security
    if ($LASTEXITCODE -ne 0) { throw "Security tests failed" }
    
    Write-SuccessLog "All tests passed"
}

# Deploy application
function Deploy-App {
    param([string]$Env)
    Write-InfoLog "Deploying to $Env environment..."
    
    # Pull latest images
    docker-compose pull
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    # Wait for health checks
    Write-InfoLog "Waiting for health checks..."
    Start-Sleep -Seconds 30
    
    # Verify deployment
    $healthyContainers = docker-compose ps | Where-Object { $_ -match "Up.*healthy" }
    if ($healthyContainers) {
        Write-SuccessLog "Deployment to $Env completed successfully"
    } else {
        Write-ErrorLog "Deployment failed - containers not healthy"
        docker-compose logs
        exit 1
    }
}

# Database migration
function Invoke-Migrations {
    Write-InfoLog "Running database migrations..."
    
    # Run Supabase migrations
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        supabase db push
        Write-SuccessLog "Database migrations completed"
    } else {
        Write-WarningLog "Supabase CLI not found, skipping migrations"
    }
}

# Health check
function Test-Health {
    Write-InfoLog "Performing health check..."
    
    $healthUrl = "http://localhost/health"
    $maxAttempts = 10
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-SuccessLog "Health check passed"
                return
            }
        } catch {
            # Continue to retry
        }
        
        Write-InfoLog "Health check attempt $attempt/$maxAttempts failed, retrying in 5s..."
        Start-Sleep -Seconds 5
        $attempt++
    }
    
    Write-ErrorLog "Health check failed after $maxAttempts attempts"
    exit 1
}

# Rollback deployment
function Invoke-Rollback {
    Write-WarningLog "Rolling back deployment..."
    
    # Get previous image tag
    $images = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -match $IMAGE_NAME }
    if ($images.Count -gt 1) {
        $previousTag = ($images[1] -split ':')[1]
        Write-InfoLog "Rolling back to tag: $previousTag"
        
        # Update image tag in docker-compose
        (Get-Content docker-compose.yml) -replace "image: ${IMAGE_NAME}:.*", "image: ${IMAGE_NAME}:${previousTag}" | Set-Content docker-compose.yml
        
        # Redeploy
        docker-compose up -d
        
        Write-SuccessLog "Rollback completed"
    } else {
        Write-ErrorLog "No previous version found for rollback"
        exit 1
    }
}

# Backup data
function Backup-Data {
    Write-InfoLog "Creating data backup..."
    
    $backupDir = "backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Backup volumes
    docker run --rm `
        -v secure-gate-access-kenya_redis_data:/source:ro `
        -v "${PWD}\${backupDir}:/backup" `
        alpine tar czf /backup/redis_data.tar.gz -C /source .
    
    Write-SuccessLog "Backup created in $backupDir"
}

# Main execution
try {
    switch ($Command) {
        "build" {
            Test-Dependencies
            Set-Environment $Environment
            Build-App
        }
        "test" {
            Test-Dependencies
            Invoke-Tests
        }
        "deploy" {
            Test-Dependencies
            Set-Environment $Environment
            Backup-Data
            Build-App
            Invoke-Tests
            Invoke-Migrations
            Deploy-App $Environment
            Test-Health
        }
        "rollback" {
            Test-Dependencies
            Set-Environment $Environment
            Invoke-Rollback
            Test-Health
        }
        "health" {
            Test-Health
        }
        "backup" {
            Backup-Data
        }
    }
} catch {
    Write-ErrorLog $_.Exception.Message
    exit 1
}
