#!/usr/bin/env bash
# run.sh - Unified runner for development, build, testing and Docker workflows
# Usage: ./run.sh <command> [options]
# Commands:
#   help                Show this help
#   dev                 Start frontend dev server and backend in dev mode (concurrently)
#   build               Build frontend and backend artifacts for production
#   start               Start production artifacts (frontend static/server + backend binary)
#   
#   Docker Commands:
#   docker:build        Build Docker containers (same as ./build.sh)
#   docker:up           Start Docker containers
#   docker:down         Stop Docker containers
#   docker:restart      Restart Docker containers
#   docker:logs         View container logs (all or specific service)
#   docker:status       Show container status
#   docker:shell        Open shell in backend or frontend container
#   docker:clean        Remove all containers, images, and volumes
#   
#   test                Run frontend and backend tests
#   lint                Run linters for frontend (if configured)
#   fmt                 Format code (frontend/backend if configured)
#   clean               Remove build artifacts
#   debug               Run backend in debug mode (if debugger configured)
#
# Environment variables you can set:
#   FRONTEND_PORT     Default: 3000 (dev) / 3003 (when 3000 in use)
#   BACKEND_PORT      Default: 8080
#   DOCKER_COMPOSE    Default: docker-compose.yml
#   NODE_ENV          Default: development
#
# Make executable: chmod +x run.sh

set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/Frontend"
BACKEND_DIR="$ROOT_DIR/Backend"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE:-$ROOT_DIR/docker-compose.yml}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
NODE_ENV="${NODE_ENV:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${BLUE}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

show_help() {
  sed -n '1,200p' "$0"
}

# Safety checks
check_prereqs() {
  if [ "$1" = "docker" ] || [ "$1" = "docker-up" ] || [ "$1" = "docker-build" ]; then
    if ! command_exists docker; then
      err "Docker is not installed. Install Docker Desktop or the Docker engine."
      exit 1
    fi
  fi

  if [ "$1" = "dev" ] || [ "$1" = "build" ] || [ "$1" = "lint" ] || [ "$1" = "test" ]; then
    if ! command_exists node && ! command_exists npm; then
      warn "Node/npm not found. Frontend commands will fail without them."
    fi
  fi

  if [ "$1" = "build" ] || [ "$1" = "start" ] || [ "$1" = "debug" ] || [ "$1" = "dev" ]; then
    if ! command_exists go; then
      warn "Go not found. Backend build/run will fail without Go."
    fi
  fi
}

# Frontend helpers
install_frontend_deps() {
  if [ -d "$FRONTEND_DIR" ]; then
    info "Installing frontend dependencies..."
    (cd "$FRONTEND_DIR" && npm ci)
  else
    warn "Frontend directory not found at $FRONTEND_DIR"
  fi
}

dev_frontend() {
  if [ -d "$FRONTEND_DIR" ]; then
    info "Starting frontend dev server (Next.js)..."
    (cd "$FRONTEND_DIR" && npm run dev)
  else
    warn "Frontend directory not found"
  fi
}

build_frontend() {
  if [ -d "$FRONTEND_DIR" ]; then
    info "Building frontend (production)..."
    (cd "$FRONTEND_DIR" && npm run build)
  else
    warn "Frontend directory not found"
  fi
}

start_frontend_prod() {
  if [ -d "$FRONTEND_DIR" ]; then
    info "Starting frontend in production mode (next start)..."
    (cd "$FRONTEND_DIR" && NODE_ENV=production npm run start)
  else
    warn "Frontend directory not found"
  fi
}

# Backend helpers
build_backend() {
  if [ -d "$BACKEND_DIR" ]; then
    info "Building backend binary..."
    (cd "$BACKEND_DIR" && go build -o "$ROOT_DIR/bin/social-backend" .)
    info "Backend binary saved to $ROOT_DIR/bin/social-backend"
  else
    warn "Backend directory not found"
  fi
}

run_backend() {
  if [ -f "$ROOT_DIR/bin/social-backend" ]; then
    info "Running backend binary..."
    "$ROOT_DIR/bin/social-backend"
  elif [ -d "$BACKEND_DIR" ]; then
    info "Running backend with 'go run' (development)"
    (cd "$BACKEND_DIR" && go run .)
  else
    warn "Backend not found"
  fi
}

debug_backend() {
  if command_exists dlv; then
    info "Starting backend with Delve (debugger)..."
    (cd "$BACKEND_DIR" && dlv debug --headless --listen=:2345 --api-version=2 --accept-multiclient)
  else
    warn "Delve (dlv) not installed. Install it to use debug command."
  fi
}

# Docker helpers
docker_build_containers() {
  info "Building Docker containers using docker-compose..."
  if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    err "docker-compose.yml not found at $DOCKER_COMPOSE_FILE"
    exit 1
  fi
  
  info "Building images and creating containers..."
  docker compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
  success "Docker containers built successfully"
  
  info "Starting containers..."
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d
  success "Containers started"
  
  info "Container status:"
  docker compose -f "$DOCKER_COMPOSE_FILE" ps
}

docker_compose_up() {
  info "Starting Docker containers..."
  if ! docker compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d
    success "Containers started"
  else
    warn "Containers are already running"
  fi
  docker compose -f "$DOCKER_COMPOSE_FILE" ps
}

docker_compose_down() {
  info "Stopping Docker containers..."
  docker compose -f "$DOCKER_COMPOSE_FILE" down
  success "Containers stopped"
}

docker_compose_restart() {
  info "Restarting Docker containers..."
  docker compose -f "$DOCKER_COMPOSE_FILE" restart
  success "Containers restarted"
  docker compose -f "$DOCKER_COMPOSE_FILE" ps
}

docker_compose_logs() {
  local service="${1:-}"
  if [ -n "$service" ]; then
    info "Showing logs for $service..."
    docker compose -f "$DOCKER_COMPOSE_FILE" logs -f "$service"
  else
    info "Showing logs for all containers..."
    docker compose -f "$DOCKER_COMPOSE_FILE" logs -f
  fi
}

docker_compose_status() {
  info "Container status:"
  docker compose -f "$DOCKER_COMPOSE_FILE" ps
  echo ""
  info "Health status:"
  docker inspect social-network-backend --format='Backend: {{.State.Health.Status}}' 2>/dev/null || echo "Backend: not running"
  docker inspect social-network-frontend --format='Frontend: {{.State.Health.Status}}' 2>/dev/null || echo "Frontend: not running"
}

docker_compose_shell() {
  local service="${1:-backend}"
  info "Opening shell in $service container..."
  if [ "$service" = "backend" ]; then
    docker exec -it social-network-backend /bin/sh
  elif [ "$service" = "frontend" ]; then
    docker exec -it social-network-frontend /bin/sh
  else
    err "Invalid service. Use 'backend' or 'frontend'"
    exit 1
  fi
}

docker_compose_clean() {
  warn "This will remove ALL containers, images, and volumes for this project!"
  read -p "Are you sure? (yes/no): " -r
  if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    info "Removing containers and volumes..."
    docker compose -f "$DOCKER_COMPOSE_FILE" down -v --remove-orphans
    
    info "Removing images..."
    docker image rm social-network-backend:latest 2>/dev/null || true
    docker image rm social-network-frontend:latest 2>/dev/null || true
    
    success "Docker cleanup completed"
  else
    info "Cleanup cancelled"
  fi
}

run_tests() {
  info "Running frontend tests (if configured)..."
  if [ -d "$FRONTEND_DIR" ]; then
    (cd "$FRONTEND_DIR" && npm test)
  else
    warn "Frontend not found - skipping frontend tests"
  fi

  info "Running backend tests..."
  if [ -d "$BACKEND_DIR" ]; then
    (cd "$BACKEND_DIR" && go test ./...)
  else
    warn "Backend not found - skipping backend tests"
  fi
}

run_lint() {
  info "Running frontend linter (if configured)..."
  if [ -d "$FRONTEND_DIR" ]; then
    (cd "$FRONTEND_DIR" && npm run lint || true)
  else
    warn "Frontend not found - skipping lint"
  fi
}

run_fmt() {
  info "Formatting backend (gofmt)..."
  if [ -d "$BACKEND_DIR" ]; then
    (cd "$BACKEND_DIR" && gofmt -w . || true)
  fi
  info "Formatting frontend (prettier if configured)..."
  if [ -d "$FRONTEND_DIR" ]; then
    (cd "$FRONTEND_DIR" && npm run format || true)
  fi
}

clean() {
  info "Cleaning build artifacts..."
  rm -rf "$ROOT_DIR/bin" || true
  if [ -d "$FRONTEND_DIR/.next" ]; then
    rm -rf "$FRONTEND_DIR/.next"
  fi
  info "Clean complete."
}

# Entrypoint
main() {
  if [ $# -lt 1 ]; then
    show_help
    exit 0
  fi

  cmd="$1"; shift || true
  check_prereqs "$cmd"

  case "$cmd" in
    help|-h|--help)
      show_help
      ;;

    dev)
      info "Starting development environment (frontend + backend)."
      # Start backend in background and frontend in foreground.
      # Any additional flags passed after the command (e.g. --mock --clear) will be forwarded to the backend process.
      # Use subshells so user can see logs. User can also run in separate terminals.
      (
        cd "$BACKEND_DIR" && \
        info "Starting backend (go run) in background (forwarding flags to backend)..." && \
        # forward positional args ($@) to the backend program; go run supports '--' to separate run flags
        (go run . -- "$@" &)
      ) &
      # Start frontend in current terminal
      (cd "$FRONTEND_DIR" && npm run dev)
      ;;

    build)
      info "Building frontend and backend for production..."
      install_frontend_deps
      build_frontend
      build_backend
      info "Build finished."
      ;;

    start)
      info "Starting production artifacts (build must be run first)."
      # Try to start backend binary in background and frontend production server
      if [ -f "$ROOT_DIR/bin/social-backend" ]; then
        # Forward any additional flags (e.g. --mock --clear) to the backend binary
        ( "$ROOT_DIR/bin/social-backend" "$@" & )
      else
        warn "Backend binary not found. Run './run.sh build' first."
      fi
      start_frontend_prod
      ;;

    docker:build)
      docker_build_containers
      ;;

    docker:up)
      docker_compose_up
      ;;

    docker:down)
      docker_compose_down
      ;;

    docker:restart)
      docker_compose_restart
      ;;

    docker:logs)
      docker_compose_logs "${1:-}"
      ;;

    docker:status)
      docker_compose_status
      ;;

    docker:shell)
      docker_compose_shell "${1:-backend}"
      ;;

    docker:clean)
      docker_compose_clean
      ;;
    
    # Legacy support for old commands
    docker-build)
      warn "Command 'docker-build' is deprecated. Use 'docker:build' instead."
      docker_build_containers
      ;;

    docker-up)
      warn "Command 'docker-up' is deprecated. Use 'docker:up' instead."
      docker_compose_up
      ;;

    docker-down)
      warn "Command 'docker-down' is deprecated. Use 'docker:down' instead."
      docker_compose_down
      ;;

    test)
      run_tests
      ;;

    lint)
      run_lint
      ;;

    fmt)
      run_fmt
      ;;

    clean)
      clean
      ;;

    debug)
      debug_backend
      ;;

    *)
      err "Unknown command: $cmd"
      show_help
      exit 2
      ;;
  esac
}

main "$@"
