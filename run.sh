#!/usr/bin/env bash
# run.sh - Unified runner for development, build, testing and docker workflows
# Usage: ./run.sh <command> [options]
# Commands:
#   help            Show this help
#   dev             Start frontend dev server and backend in dev mode (concurrently)
#   build           Build frontend and backend artifacts for production
#   start           Start production artifacts (frontend static/server + backend binary)
#   docker-build    Build Docker images for frontend and backend
#   docker-up       Run docker-compose up -d --build
#   docker-down     Run docker-compose down
#   test            Run frontend and backend tests
#   lint            Run linters for frontend (if configured)
#   fmt             Format code (frontend/backend if configured)
#   clean           Remove build artifacts
#   debug           Run backend in debug mode (if debugger configured)
#
# Environment variables you can set:
#   FRONTEND_PORT     Default: 3000 (dev) / 3003 (when 3000 in use)
#   BACKEND_PORT      Default: 3001
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
BACKEND_PORT="${BACKEND_PORT:-3001}"
NODE_ENV="${NODE_ENV:-development}"

# Helper: print header
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

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
docker_build_images() {
  info "Building Docker images (frontend/backend) using Dockerfile(s)..."
  if [ -d "$FRONTEND_DIR" ]; then
    docker build -t social-network-frontend "$FRONTEND_DIR"
  fi
  if [ -d "$BACKEND_DIR" ]; then
    docker build -t social-network-backend "$BACKEND_DIR"
  fi
  info "Docker images built."
}

docker_compose_up() {
  info "Starting containers with docker-compose ($DOCKER_COMPOSE_FILE)..."
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build
}

docker_compose_down() {
  info "Stopping containers with docker-compose..."
  docker compose -f "$DOCKER_COMPOSE_FILE" down
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

    docker-build)
      docker_build_images
      ;;

    docker-up)
      docker_compose_up
      ;;

    docker-down)
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
