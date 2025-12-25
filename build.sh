#!/usr/bin/env bash
# build.sh - Build Docker images and containers for Social Network Application
# Usage: ./build.sh [options]
# Options:
#   --no-cache    Build without using cache
#   --clean       Remove existing containers and volumes before building
#   --help        Show this help message

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${BLUE}ℹ ${NC} $*"; }
success() { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $*"; }
error() { echo -e "${RED}❌${NC} $*" >&2; }

show_help() {
    cat << EOF
🐳 Social Network Application - Docker Build Script

Usage: ./build.sh [options]

Options:
    --no-cache      Build images without using cache
    --clean         Remove existing containers, images, and volumes before building
    --dev           Build development configuration (if available)
    --help, -h      Show this help message

Examples:
    ./build.sh                  # Standard build and start
    ./build.sh --no-cache       # Fresh build without cache
    ./build.sh --clean          # Clean build (removes everything first)

EOF
}

# Parse arguments
NO_CACHE=""
CLEAN_BUILD=false
DEV_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --dev)
            DEV_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main build process
main() {
    echo "🐳 Building Social Network Application Containers"
    echo "=================================================="
    echo ""

    # Check if Docker is running
    info "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    success "Docker is running"
    echo ""

    # Clean build if requested
    if [ "$CLEAN_BUILD" = true ]; then
        warn "Clean build requested - removing existing containers and volumes..."
        docker compose down -v --remove-orphans 2>/dev/null || true
        docker image rm gigabit-backend:latest 2>/dev/null || true
        docker image rm gigabit-frontend:latest 2>/dev/null || true
        success "Cleanup completed"
        echo ""
    fi

    # Stop existing containers if running
    info "Stopping existing containers (if any)..."
    docker compose down 2>/dev/null || true
    echo ""

    # Build images
    info "Building Docker images (this may take a few minutes)..."
    echo ""
    if docker compose build $NO_CACHE; then
        success "Docker images built successfully"
    else
        error "Failed to build Docker images"
        exit 1
    fi
    echo ""

    # Start containers
    info "Starting containers..."
    if docker compose up -d; then
        success "Containers started successfully"
    else
        error "Failed to start containers"
        exit 1
    fi
    echo ""

    # Wait for services to be healthy
    info "Waiting for services to be healthy (this may take 30-60 seconds)..."
    MAX_WAIT=120
    WAITED=0
    INTERVAL=5

    while [ $WAITED -lt $MAX_WAIT ]; do
        BACKEND_HEALTHY=$(docker inspect gigabit-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
        FRONTEND_HEALTHY=$(docker inspect gigabit-frontend --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
        
        if [ "$BACKEND_HEALTHY" = "healthy" ] && [ "$FRONTEND_HEALTHY" = "healthy" ]; then
            break
        fi
        
        echo -ne "   Backend: $BACKEND_HEALTHY | Frontend: $FRONTEND_HEALTHY | Waited: ${WAITED}s\r"
        sleep $INTERVAL
        WAITED=$((WAITED + INTERVAL))
    done
    echo ""
    echo ""

    # Check final health status
    BACKEND_HEALTHY=$(docker inspect gigabit-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    FRONTEND_HEALTHY=$(docker inspect gigabit-frontend --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

    echo "🏥 Health Check Results:"
    echo "========================"
    if [ "$BACKEND_HEALTHY" = "healthy" ]; then
        success "Backend:  healthy"
    else
        warn "Backend:  $BACKEND_HEALTHY (may still be starting)"
    fi

    if [ "$FRONTEND_HEALTHY" = "healthy" ]; then
        success "Frontend: healthy"
    else
        warn "Frontend: $FRONTEND_HEALTHY (may still be starting)"
    fi
    echo ""

    # Display container information
    echo "📦 Container Status:"
    echo "===================="
    docker compose ps
    echo ""

    # Display access information
    echo "🌐 Access URLs:"
    echo "==============="
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8080"
    echo "   Health:    http://localhost:8080/health"
    echo ""

    echo "📋 Useful Commands:"
    echo "==================="
    echo "   View logs:          docker compose logs -f"
    echo "   View backend logs:  docker compose logs -f backend"
    echo "   View frontend logs: docker compose logs -f frontend"
    echo "   Stop containers:    docker compose stop"
    echo "   Remove containers:  docker compose down"
    echo "   Remove all:         docker compose down -v"
    echo ""

    success "Build completed successfully! 🎉"
}

# Run main function
main