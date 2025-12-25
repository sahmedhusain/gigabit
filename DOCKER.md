# Docker Setup Guide

This document explains the Docker architecture and usage for GigaBit.

## Architecture Overview

The application uses **Docker containers** to run two separate services:

```
┌─────────────────────────────────────────────┐
│         Docker Environment                   │
│                                             │
│  ┌─────────────┐      ┌─────────────┐     │
│  │  Frontend   │      │  Backend    │     │
│  │  Container  │◄────►│  Container  │     │
│  │             │      │             │     │
│  │  Next.js    │      │  Go/Gin     │     │
│  │  Port: 3000 │      │  Port: 8080 │     │
│  └─────────────┘      └─────────────┘     │
│        │                     │             │
│        │                     │             │
│        │              ┌──────▼──────┐      │
│        │              │   Volumes   │      │
│        │              │  (Database  │      │
│        │              │   & Uploads)│      │
│        │              └─────────────┘      │
└─────────────────────────────────────────────┘
         │
         ▼
   Bridge Network
  (gigabit)
```

### Key Concepts

- **Images**: Blueprints for containers (read-only templates)
- **Containers**: Running instances of images (isolated environments)
- **Volumes**: Persistent storage for database and uploads
- **Networks**: Communication channel between containers

## Container Details

### Backend Container
- **Name**: `gigabit-backend`
- **Image**: `gigabit-backend:latest`
- **Port**: 8080
- **Technology**: Go 1.23 + Gin framework
- **Volumes**:
  - `backend_data`: Database storage
  - `backend_uploads`: User uploaded files

### Frontend Container
- **Name**: `gigabit-frontend`
- **Image**: `gigabit-frontend:latest`
- **Port**: 3000
- **Technology**: Next.js 14 + React
- **Depends on**: Backend (waits for backend to be healthy)

## Quick Start

### Build and Start Containers

```bash
# Option 1: Using build.sh (recommended)
./build.sh

# Option 2: Using run.sh
./run.sh docker:build

# Option 3: Direct docker compose
docker compose build
docker compose up -d
```

### Stop Containers

```bash
# Stop containers but keep data
docker compose stop

# Stop and remove containers (keeps volumes)
docker compose down

# Remove everything including data
docker compose down -v
```

## Available Commands

### Build Script (build.sh)

```bash
./build.sh                  # Standard build and start
./build.sh --no-cache       # Fresh build without cache
./build.sh --clean          # Remove everything first, then build
./build.sh --help           # Show help
```

### Run Script (run.sh) - Docker Commands

```bash
# Container Management
./run.sh docker:build       # Build and start containers
./run.sh docker:up          # Start existing containers
./run.sh docker:down        # Stop containers
./run.sh docker:restart     # Restart containers

# Monitoring
./run.sh docker:status      # Show container status and health
./run.sh docker:logs        # View logs for all containers
./run.sh docker:logs backend    # View backend logs only
./run.sh docker:logs frontend   # View frontend logs only

# Access
./run.sh docker:shell       # Open shell in backend container
./run.sh docker:shell backend   # Open shell in backend container
./run.sh docker:shell frontend  # Open shell in frontend container

# Cleanup
./run.sh docker:clean       # Remove all containers, images, and volumes
```

## Direct Docker Commands

### Container Operations

```bash
# List running containers
docker compose ps

# View logs
docker compose logs -f              # All containers
docker compose logs -f backend      # Backend only
docker compose logs -f frontend     # Frontend only

# Restart a specific service
docker compose restart backend
docker compose restart frontend

# Execute commands in containers
docker exec -it gigabit-backend /bin/sh
docker exec -it gigabit-frontend /bin/sh
```

### Health Checks

```bash
# Check container health
docker inspect gigabit-backend --format='{{.State.Health.Status}}'
docker inspect gigabit-frontend --format='{{.State.Health.Status}}'

# Test endpoints
curl http://localhost:8080/health    # Backend health
curl http://localhost:3000           # Frontend
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volumes
docker volume inspect gigabit-backend-data
docker volume inspect gigabit-backend-uploads

# Backup database
docker run --rm -v gigabit-backend-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore database
docker run --rm -v gigabit-backend-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/backup-20241028.tar.gz -C /data
```

## Troubleshooting

### Containers won't start

```bash
# Check Docker is running
docker info

# View detailed logs
docker compose logs

# Rebuild from scratch
./build.sh --clean
```

### Port conflicts

If ports 3000 or 8080 are already in use, you can change them in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8081:8080"  # Change host port to 8081
  frontend:
    ports:
      - "3001:3000"  # Change host port to 3001
```

### Database issues

```bash
# Reset database by removing volume
docker compose down -v
docker compose up -d
```

### Container not healthy

```bash
# Check health status
docker inspect gigabit-backend --format='{{json .State.Health}}'

# View recent logs
docker logs --tail 50 gigabit-backend

# Restart container
docker compose restart backend
```

## Development vs Production

### Current Setup (Production)

The current `docker-compose.yml` is configured for production with:
- Optimized builds
- Health checks
- Automatic restarts
- Log rotation

### Development Setup

For development, use the regular dev commands:

```bash
# Run without Docker (local development)
./run.sh dev
```

This starts:
- Frontend with hot-reload on port 3000
- Backend with live reload on port 8080

## Environment Variables

You can customize the behavior by setting environment variables:

```bash
# In docker-compose.yml or via .env file
BACKEND_PORT=8080
FRONTEND_PORT=3000
NODE_ENV=production
GIN_MODE=release
DB_PATH=/data/social_network.db
```

## Performance Optimization

### Image Sizes

The multi-stage builds keep images small:
- **Backend**: ~20MB (Alpine + Go binary)
- **Frontend**: ~150MB (Node Alpine + Next.js)

### Build Cache

Docker caches layers for faster rebuilds. To use cache:

```bash
docker compose build  # Uses cache
```

To force fresh build:

```bash
./build.sh --no-cache
```

## Security Best Practices

1. **Non-root user**: Frontend runs as non-root user (nextjs)
2. **Minimal images**: Using Alpine Linux for smaller attack surface
3. **Health checks**: Automatic detection of unhealthy containers
4. **Network isolation**: Containers communicate via private network
5. **Volume permissions**: Proper permissions on mounted volumes

## Monitoring

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats gigabit-backend
```

### Logs

```bash
# Follow logs in real-time
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Logs since timestamp
docker compose logs --since 2024-10-28T10:00:00
```

## CI/CD Integration

The Docker setup is ready for CI/CD pipelines:

```bash
# Build
docker compose build

# Run tests in containers
docker compose run --rm backend go test ./...
docker compose run --rm frontend npm test

# Deploy
docker compose up -d
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
