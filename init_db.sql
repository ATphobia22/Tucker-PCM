-- Initialize TimescaleDB hypertables for 10Hz telemetry
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- Main telemetry table (10Hz, 1M+ rows/day)
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL,
    timestamp TIMESTAMP NOT NULL,
    station_id VARCHAR(50) NOT NULL,
    flow_rate_cfs FLOAT NOT NULL,
    stage_ft FLOAT NOT NULL,
    temperature_c FLOAT,
    turbidity_ntu FLOAT,
    ph FLOAT,
    dissolved_oxygen_mg_l FLOAT,
    location GEOGRAPHY(POINT, 4326)
);

-- Convert to TimescaleDB hypertable for fast aggregation
SELECT create_hypertable('telemetry', 'timestamp', if_not_exists => TRUE);
CREATE INDEX ON telemetry (station_id, timestamp DESC);
CREATE INDEX ON telemetry (timestamp DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    station_id VARCHAR(50),
    alert_level VARCHAR(20),
    message TEXT,
    affected_parcels TEXT[]
);

SELECT create_hypertable('alerts', 'timestamp', if_not_exists => TRUE);

-- Municipal parcels
CREATE TABLE IF NOT EXISTS parcels (
    parcel_id VARCHAR(50) PRIMARY KEY,
    center_location GEOGRAPHY(POINT, 4326),
    elevation_ft FLOAT,
    property_value_usd FLOAT,
    residential_units INT,
    commercial_sqft INT,
    industrial_sqft INT
);

CREATE INDEX ON parcels USING GIST(center_location);

-- Forecast table
CREATE TABLE IF NOT EXISTS forecasts (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    station_id VARCHAR(50),
    forecast_json JSONB,
    peak_cfs FLOAT,
    peak_time_hours FLOAT
);

SELECT create_hypertable('forecasts', 'timestamp', if_not_exists => TRUE);
