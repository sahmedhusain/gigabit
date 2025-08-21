#!/bin/bash

echo "🐳 Building Social Network Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
backend_health=$(docker-compose ps | grep backend | grep healthy)
frontend_health=$(docker-compose ps | grep frontend | grep healthy)

if [[ -n "$backend_health" && -n "$frontend_health" ]]; then
    echo "✅ All services are healthy!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8080"
    echo "📊 Health Check: http://localhost:8080/health"
else
    echo "⚠️  Services may still be starting. Check status with: docker-compose ps"
fi

echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"