# Point Township Digital Twin - Data Sources & APIs

## External Data Sources and APIs

This document outlines all external APIs and data sources integrated into the Point Township Digital Twin system.

### Indiana GIS & Geospatial Services

#### 1. GIS Data Server (ESRI ArcGIS REST)
**URL:** https://gisdata.in.gov/server/rest/services

**Purpose:** Access Indiana state-level GIS data services including:
- Land use/land cover (LULC) classifications
- State boundary and administrative divisions
- Transportation networks
- Elevation and terrain models
- Stream networks and watershed boundaries

**Integration:** PostGIS/PDAL pipeline for terrain analysis and flood propagation modeling

**Authentication:** Public access with optional rate limiting

---

#### 2. Indiana Map Portal - Historic Sites & Structures Dataset
**URL:** https://www.indianamap.org/datasets/INMap::idnr-surveyed-historic-sites-and-structures/about

**Purpose:** Historic preservation and infrastructure resilience:
- IDNR surveyed historic sites and structures
- Cultural heritage asset locations
- Infrastructure age and condition data
- Evacuation priority considerations for protected sites

**Integration:** Risk optimizer for emergency dispatch prioritization

**Data Format:** GeoJSON/REST API

**Update Frequency:** Quarterly

---

#### 3. Indiana University GIS Services
**URL:** https://gis.iu.edu/

**Purpose:** Academic research and advanced geospatial analysis:
- High-resolution LiDAR datasets (1m-3m resolution)
- Research-grade hydrological models
- Climate change projection layers
- Flood risk modeling archives

**Integration:** PDAL point cloud processing and physics-informed neural network training data

**Use Case:** Validation and calibration of terrain-based routing models

---

#### 4. Indiana GIS Data Harvest API
**URL:** https://dataharvest.gio.in.gov/api/search/definition/

**Purpose:** Comprehensive Indiana geospatial data repository:
- Statewide critical infrastructure layers
- Utility networks (water, gas, electric)
- Public facility locations
- Real-time data catalog and metadata

**API Endpoints:**
```bash
# Search available datasets
GET /api/search/definition/?keyword=flood

# Get dataset metadata
GET /api/search/definition/{dataset_id}

# Access data feeds
GET /api/data/{dataset_id}/download
```

**Integration Points:**
- Emergency dispatcher for critical infrastructure alerts
- Risk assessment for evacuation route optimization
- Real-time utility outage notifications

**Authentication:** API key required (request via gio.in.gov)

**Rate Limits:** 1,000 requests/hour

---

## USGS Water Data Integration

### National Water Information System (NWIS)
**Existing Integration:** Real-time streamflow and stage data

**Endpoints:**
```bash
# Real-time data
GET https://waterservices.usgs.gov/nwis/iv/

# Site information
GET https://waterservices.usgs.gov/nwis/site/

# Statistical data
GET https://waterservices.usgs.gov/nwis/stat/
```

---

## Data Pipeline Architecture

### Ingestion Workflow
```
┌─────────────────────────────────────────────────┐
│  External APIs (Indiana GIS + USGS)             │
├─────────────────────────────────────────────────┤
│  API Aggregation Layer (FastAPI)                │
├─────────────────────────────────────────────────┤
│  Data Normalization & Validation                │
├─────────────────────────────────────────────────┤
│  PostGIS/TimescaleDB (Primary Store)            │
├─────────────────────────────────────────────────┤
│  Spatial Indexing & Time-Series Aggregation     │
├─────────────────────────────────────────────────┤
│  Physics-Informed Models & Forecasting          │
├─────────────────────────────────────────────────┤
│  Real-Time Dashboard & Alerts                   │
└─────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables
```bash
# Indiana GIS Data Harvest
GIO_DATAHARVEST_API_KEY=your_api_key
GIO_DATAHARVEST_URL=https://dataharvest.gio.in.gov/api

# USGS NWIS
USGS_NWIS_URL=https://waterservices.usgs.gov/nwis

# ESRI GIS Data Server
ESRI_GIS_URL=https://gisdata.in.gov/server/rest/services

# Indiana University GIS
IU_GIS_URL=https://gis.iu.edu/

# Cache TTL (seconds)
GIS_DATA_CACHE_TTL=3600
```

---

## Data Refresh Schedule

| Source | Frequency | Latency | Priority |
|--------|-----------|---------|----------|
| USGS NWIS (Streamflow) | 15 minutes | Real-time | **CRITICAL** |
| GIS Data Harvest (Utility Data) | Daily | 1-6 hours | HIGH |
| Indiana Map Portal (Historic Sites) | Quarterly | 30 days | MEDIUM |
| ESRI GIS Services (Base Layers) | Monthly | 30 days | MEDIUM |
| IU LiDAR (Reference Data) | Annual | 365 days | LOW |

---

## Error Handling & Fallbacks

```python
# Automatic fallback strategy
1. Primary: Real-time API data
2. Secondary: Cached data (TTL-based)
3. Tertiary: Last-known-good data
4. Quaternary: Synthetic/modeled data

# Circuit breaker pattern
- Max retries: 3
- Timeout: 30 seconds
- Fallback: Alert operators, use cached data
```

---

## License & Attribution

### Data Sources Licensing
| Source | License | Attribution Required |
|--------|---------|----------------------|
| USGS NWIS | Public Domain | Yes |
| GIS Data Harvest | IDEM License | Yes |
| Indiana Map Portal | Creative Commons | Yes |
| ESRI Services | Terms of Service | Yes |
| IU GIS | Academic License | Yes |

All data integrations comply with respective licensing terms and attribution requirements.

---

## References & Support

- **GIS Data Harvest Support:** https://gio.in.gov/support
- **USGS Water Services:** https://waterservices.usgs.gov
- **Indiana Map Help:** https://www.indianamap.org/help
- **IU GIS Portal:** https://gis.iu.edu/about

---

**Last Updated:** 2026-07-02  
**Maintained By:** Point Township Digital Twin Team
