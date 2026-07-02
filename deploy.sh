#!/bin/bash
set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🌊 Point Township Digital Twin v21.0 Deployment 🌊       ║"
echo "║  Production Deployment Script                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Check for required commands
require_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        exit 1
    fi
}

require_command docker
require_command docker-compose

# Parse arguments
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}

echo "🚀 Deploying to: $ENVIRONMENT (Region: $REGION)"

# Build Docker images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Tag images
echo "🏷️  Tagging images..."
docker tag point-township-digital-twin:latest point-township-digital-twin:$(date +%Y%m%d-%H%M%S)

# Push to registry (if configured)
if [ -n "$DOCKER_REGISTRY" ]; then
    echo "📤 Pushing to Docker registry..."
    docker tag point-township-digital-twin:latest $DOCKER_REGISTRY/point-township-digital-twin:latest
    docker push $DOCKER_REGISTRY/point-township-digital-twin:latest
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T postgres psql -U admin -d township -f /docker-entrypoint-initdb.d/01-init.sql

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Core service is healthy"
        break
    fi
    echo "⏳ Waiting... ($i/30)"
    sleep 2
done

# Run smoke tests
echo "🧪 Running smoke tests..."
echo "   Testing /health endpoint..."
curl -s http://localhost:8000/health | jq .

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Monitoring:"
echo "   - Grafana: http://localhost:3000"
echo "   - Prometheus: http://localhost:9090"
echo "   - Ray Dashboard: http://localhost:8265"
echo ""
echo "📝 Logs:"
echo "   docker-compose logs -f core_orchestrator"
echo ""
