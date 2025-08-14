#!/bin/bash

# Secure Gate Access - Deployment Script
# This script handles deployment to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="your-registry.com"
IMAGE_NAME="secure-gate-access"
COMPOSE_FILE="docker-compose.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    
    log_success "Dependencies check passed"
}

# Environment setup
setup_environment() {
    local env=$1
    log_info "Setting up environment: $env"
    
    case $env in
        "development")
            export NODE_ENV=development
            export COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"
            ;;
        "staging")
            export NODE_ENV=staging
            export COMPOSE_FILE="docker-compose.yml:docker-compose.staging.yml"
            ;;
        "production")
            export NODE_ENV=production
            export COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml"
            ;;
        *)
            log_error "Unknown environment: $env"
            exit 1
            ;;
    esac
    
    # Load environment variables
    if [ -f ".env.${env}" ]; then
        log_info "Loading environment variables from .env.${env}"
        set -a
        source ".env.${env}"
        set +a
    else
        log_warning "Environment file .env.${env} not found"
    fi
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Build Docker image
    docker build -t "${IMAGE_NAME}:latest" .
    
    # Tag for registry if specified
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        docker tag "${IMAGE_NAME}:latest" "${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
        docker tag "${IMAGE_NAME}:latest" "${DOCKER_REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD)"
    fi
    
    log_success "Application build completed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run unit tests
    npm run test:unit
    
    # Run integration tests
    npm run test:integration
    
    # Run security tests
    npm run test:security
    
    log_success "All tests passed"
}

# Deploy application
deploy_app() {
    local env=$1
    log_info "Deploying to $env environment..."
    
    # Pull latest images
    docker-compose pull
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    # Wait for health checks
    log_info "Waiting for health checks..."
    sleep 30
    
    # Verify deployment
    if docker-compose ps | grep -q "Up (healthy)"; then
        log_success "Deployment to $env completed successfully"
    else
        log_error "Deployment failed - containers not healthy"
        docker-compose logs
        exit 1
    fi
}

# Database migration
run_migrations() {
    log_info "Running database migrations..."
    
    # Run Supabase migrations
    if command -v supabase >/dev/null 2>&1; then
        supabase db push
        log_success "Database migrations completed"
    else
        log_warning "Supabase CLI not found, skipping migrations"
    fi
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local health_url="http://localhost/health"
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 5s..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Get previous image tag
    local previous_tag=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "${IMAGE_NAME}" | sed -n '2p' | cut -d':' -f2)
    
    if [ ! -z "$previous_tag" ]; then
        log_info "Rolling back to tag: $previous_tag"
        
        # Update image tag in docker-compose
        sed -i "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${previous_tag}|g" docker-compose.yml
        
        # Redeploy
        docker-compose up -d
        
        log_success "Rollback completed"
    else
        log_error "No previous version found for rollback"
        exit 1
    fi
}

# Backup data
backup_data() {
    log_info "Creating data backup..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup volumes
    docker run --rm \
        -v secure-gate-access-kenya_redis_data:/source:ro \
        -v "$(pwd)/$backup_dir":/backup \
        alpine tar czf /backup/redis_data.tar.gz -C /source .
    
    log_success "Backup created in $backup_dir"
}

# Main deployment function
main() {
    local command=$1
    local environment=${2:-development}
    
    case $command in
        "build")
            check_dependencies
            setup_environment "$environment"
            build_app
            ;;
        "test")
            check_dependencies
            run_tests
            ;;
        "deploy")
            check_dependencies
            setup_environment "$environment"
            backup_data
            build_app
            run_tests
            run_migrations
            deploy_app "$environment"
            health_check
            ;;
        "rollback")
            check_dependencies
            setup_environment "$environment"
            rollback
            health_check
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_data
            ;;
        *)
            echo "Usage: $0 {build|test|deploy|rollback|health|backup} [environment]"
            echo "Environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
