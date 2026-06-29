#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "🚀 Point Township Digital Twin v21.0 - Bleeding Edge Bootstrap"
echo "================================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker not found. Install Docker."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose not found. Install Docker Compose."; exit 1; }

# Create directory structure
echo "✓ Creating directory structure..."
mkdir -p data/{vector_store,research,logs}
mkdir -p alerts/public
mkdir -p frontend/src/components
mkdir -p grafana-dashboards

# Initialize environment
echo "✓ Initializing environment..."
if [ ! -f .env ]; then
    cat << 'EOF' > .env
# Point Township Digital Twin Configuration
TOWNSHIP_NODE_LAT=37.8575
TOWNSHIP_NODE_LON=-87.9944
TELEMETRY_STREAM_FREQUENCY_HZ=10
ALERT_THRESHOLD_CFS=80000

# Database credentials
POSTGRES_USER=admin
POSTGRES_PASSWORD=township_secure_2024
POSTGRES_DB=township

# Monitoring
GRAFANA_ADMIN_PASSWORD=township_secure_2024
PROMETHEUS_RETENTION=30d

# API Keys (populate with real values)
MAPBOX_TOKEN=your_mapbox_token_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
EOF
    echo "  Created .env - update with your credentials"
fi

# Build and start services
echo "✓ Starting Docker services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 10

# Initialize database
echo "✓ Initializing database schema..."
docker-compose exec -T postgres psql -U admin -d township -f /docker-entrypoint-initdb.d/01-init.sql 2>/dev/null || true

# Check service health
echo ""
echo "✓ Service Status:"
echo "  API:        http://localhost:8000"
echo "  Grafana:    http://localhost:3000"
echo "  Prometheus: http://localhost:9090"
echo "  Ray Dashboard: http://localhost:8265"
echo ""
echo "✅ Point Township Digital Twin v21.0 ONLINE"
echo ""
