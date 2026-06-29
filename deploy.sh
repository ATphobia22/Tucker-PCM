#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "🌊 DEPLOYING POINT TOWNSHIP DIGITAL TWIN v21.0"
echo "================================================="
echo ""

# Run bootstrap if not already done
if [ ! -d "data" ]; then
    echo "Running bootstrap..."
    bash bootstrap.sh
else
    echo "✓ Environment already initialized"
fi

# Deploy with docker-compose
echo "✓ Deploying containerized services..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
    echo "✅ Deployment successful!"
    echo "   API available at: http://localhost:8000"
    echo "   Dashboard at:     http://localhost:3000"
elif command -v docker &> /dev/null; then
    echo "Using Docker (compose may not be installed)"
    docker compose up -d --build
else
    echo "❌ Docker not found. Install Docker and Docker Compose."
    exit 1
fi

echo ""
echo "📊 Available Endpoints:"
echo "  POST /api/v21/telemetry/pulse          - Ingest telemetry"
echo "  POST /api/v21/forecast/ensemble        - Get AI forecast"
echo "  POST /api/v21/risk/parcel-assessment   - Risk analysis"
echo "  POST /api/v21/emergency/dispatch       - Send alerts"
echo "  GET  /api/v21/timeseries/{station_id}  - Historical data"
echo "  GET  /api/v21/graph/propagation/{id}   - Flood propagation"
echo "  GET  /health                           - Health check"
echo ""
echo "✅ DEPLOYMENT COMPLETE"
echo ""
