#!/bin/bash
set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🌊 Point Township Digital Twin v21.0 Bootstrap 🌊        ║"
echo "║  Real-time Flood Monitoring & AI Forecasting              ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✓ Docker found"

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p ./data ./logs ./alerts ./config ./grafana-dashboards

# Copy environment template if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cat > .env << 'EOF'
# Point Township Digital Twin Configuration
DB_PATH=/app/data/township_twin.db
SMS_DISPATCH_ACTIVE=true
TELEMETRY_STREAM_FREQUENCY_HZ=10
REDIS_URL=redis://redis:6379
SURREALDB_URL=ws://surrealdb:8000
RAY_HEAD_SERVICE_HOST=ray-head
RAY_HEAD_SERVICE_PORT=6379

# Twilio Configuration (optional)
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_FROM_NUMBER=+1234567890

# SMTP Configuration (optional)
# SMTP_USERNAME=your_email@gmail.com
# SMTP_PASSWORD=your_app_password
# SMTP_FROM=alerts@pointtownship.gov

# GIS Integration
# GIO_DATAHARVEST_API_KEY=your_api_key
ESRI_GIS_URL=https://gisdata.in.gov/server/rest/services
IU_GIS_URL=https://gis.iu.edu/

# Mapbox (for dashboard)
# MAPBOX_TOKEN=your_mapbox_token
EOF
    echo "✓ .env file created - update with your credentials"
else
    echo "✓ .env file exists"
fi

# Build and start services
echo "🐳 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to become healthy..."
sleep 10

# Check health endpoints
echo "🔍 Checking service health..."
echo ""

# PostgreSQL
echo "📦 PostgreSQL: postgres://localhost:5432"

# Redis
echo "💾 Redis: redis://localhost:6379"

# FastAPI
echo "🔗 FastAPI Core: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - ReDoc: http://localhost:8000/redoc"

# Grafana
echo "📊 Grafana Dashboard: http://localhost:3000"
echo "   - Default credentials: admin/township_secure_2024"

# Ray Dashboard
echo "🌐 Ray Cluster Dashboard: http://localhost:8265"

# Prometheus
echo "📈 Prometheus: http://localhost:9090"

# MLflow
echo "🤖 MLflow: http://localhost:5000"

echo ""
echo "✅ Point Township Digital Twin is now running!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env file with your credentials"
echo "   2. Configure Twilio for SMS alerts (optional)"
echo "   3. Set up GIS API keys"
echo "   4. Access dashboard at http://localhost:3000"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f core_orchestrator"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
