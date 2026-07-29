"""GIS Data Aggregator - Integration with Indiana GIS APIs
Fetches and caches geospatial data from multiple Indiana GIS sources.
"""
import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import httpx
import json
import redis
from pydantic import BaseModel
import geopandas as gpd
from shapely.geometry import Point, Polygon

logger = logging.getLogger(__name__)

# ============================================================================
# ENUMS & DATA MODELS
# ============================================================================

class GISDataSource(str, Enum):
    ESRI_GISDATA = "esri_gisdata"
    INDIANA_MAP = "indiana_map"
    IU_GIS = "iu_gis"
    GIO_DATAHARVEST = "gio_dataharvest"

class FeatureType(str, Enum):
    TERRAIN = "terrain"
    UTILITIES = "utilities"
    HISTORIC_SITES = "historic_sites"
    CRITICAL_INFRASTRUCTURE = "critical_infrastructure"
    FLOOD_ZONES = "flood_zones"
    LAND_USE = "land_use"

class GISFeature(BaseModel):
    """GIS feature with properties and geometry"""
    feature_id: str
    feature_type: FeatureType
    source: GISDataSource
    geometry: Dict[str, Any]  # GeoJSON geometry
    properties: Dict[str, Any]
    timestamp: datetime
    cached_until: Optional[datetime] = None

# ============================================================================
# CONFIGURATION
# ============================================================================

class GISAggregatorConfig:
    """Configuration for GIS data aggregator"""
    
    # API Endpoints
    ESRI_GIS_URL = "https://gisdata.in.gov/server/rest/services"
    INDIANA_MAP_URL = "https://www.indianamap.org/datasets"
    IU_GIS_URL = "https://gis.iu.edu/arcgis/rest/services"
    GIO_DATAHARVEST_URL = "https://dataharvest.gio.in.gov/api"
    
    # Authentication
    GIO_API_KEY = None
    ESRI_API_TOKEN = None
    
    # Caching
    REDIS_HOST = "redis"
    REDIS_PORT = 6379
    CACHE_TTL_HOURS = 24
    
    # Request settings
    REQUEST_TIMEOUT = 30
    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 5
    
    @classmethod
    def from_env(cls, env_vars: Dict[str, Any]):
        """Load config from environment variables"""
        cls.GIO_API_KEY = env_vars.get("GIO_DATAHARVEST_API_KEY")
        cls.ESRI_API_TOKEN = env_vars.get("ESRI_API_TOKEN")
        return cls

# ============================================================================
# GIS DATA AGGREGATOR
# ============================================================================

class GISDataAggregator:
    """Aggregates geospatial data from multiple Indiana GIS sources"""
    
    def __init__(self, config: GISAggregatorConfig = None):
        """Initialize GIS data aggregator"""
        self.config = config or GISAggregatorConfig()
        self.redis_client = redis.Redis(
            host=self.config.REDIS_HOST,
            port=self.config.REDIS_PORT,
            decode_responses=True
        )
        self.http_client = httpx.AsyncClient(timeout=self.config.REQUEST_TIMEOUT)
    
    # ========================================================================
    # PUBLIC API
    # ========================================================================
    
    async def get_terrain_data(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 5.0
    ) -> Dict[str, Any]:
        """Fetch terrain and elevation data for a location
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_miles: Search radius in miles
        
        Returns:
            Terrain features including elevation, slope, aspect
        """
        cache_key = f"terrain:{latitude:.4f}:{longitude:.4f}:{radius_miles}"
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        
        features = {
            "source": GISDataSource.IU_GIS.value,
            "type": FeatureType.TERRAIN.value,
            "location": {"latitude": latitude, "longitude": longitude},
            "radius_miles": radius_miles,
            "features": []
        }
        
        try:
            # Query IU GIS for elevation data
            elevation_data = await self._fetch_iu_lidar(latitude, longitude, radius_miles)
            if elevation_data:
                features["features"].append(elevation_data)
            
            # Query ESRI for terrain services
            terrain_data = await self._fetch_esri_terrain(latitude, longitude, radius_miles)
            if terrain_data:
                features["features"].extend(terrain_data)
            
            features["timestamp"] = datetime.utcnow().isoformat()
            await self._cache_data(cache_key, features)
            
        except Exception as e:
            logger.error(f"Error fetching terrain data: {e}")
            features["error"] = str(e)
        
        return features
    
    async def get_utility_networks(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 5.0,
        utility_types: List[str] = None
    ) -> Dict[str, Any]:
        """Fetch utility network locations (water, gas, electric)
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_miles: Search radius in miles
            utility_types: Filter by utility type
        
        Returns:
            Utility feature locations and properties
        """
        if not utility_types:
            utility_types = ["water", "electric", "gas", "telecommunications"]
        
        cache_key = f"utilities:{latitude:.4f}:{longitude:.4f}:{radius_miles}"
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        
        features = {
            "source": GISDataSource.GIO_DATAHARVEST.value,
            "type": FeatureType.UTILITIES.value,
            "location": {"latitude": latitude, "longitude": longitude},
            "utilities": {}
        }
        
        try:
            # Query GIO Data Harvest for utility data
            utility_data = await self._fetch_gio_utilities(
                latitude, longitude, radius_miles, utility_types
            )
            features["utilities"] = utility_data
            features["timestamp"] = datetime.utcnow().isoformat()
            await self._cache_data(cache_key, features)
            
        except Exception as e:
            logger.error(f"Error fetching utility networks: {e}")
            features["error"] = str(e)
        
        return features
    
    async def get_historic_sites(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 5.0
    ) -> Dict[str, Any]:
        """Fetch historic sites and structures for protection planning
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_miles: Search radius in miles
        
        Returns:
            Historic site locations and details
        """
        cache_key = f"historic_sites:{latitude:.4f}:{longitude:.4f}:{radius_miles}"
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        
        features = {
            "source": GISDataSource.INDIANA_MAP.value,
            "type": FeatureType.HISTORIC_SITES.value,
            "location": {"latitude": latitude, "longitude": longitude},
            "sites": []
        }
        
        try:
            # Query Indiana Map for historic sites
            sites = await self._fetch_indiana_map_historic_sites(latitude, longitude, radius_miles)
            features["sites"] = sites
            features["timestamp"] = datetime.utcnow().isoformat()
            await self._cache_data(cache_key, features)
            
        except Exception as e:
            logger.error(f"Error fetching historic sites: {e}")
            features["error"] = str(e)
        
        return features
    
    async def get_critical_infrastructure(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 5.0,
        infrastructure_types: List[str] = None
    ) -> Dict[str, Any]:
        """Fetch critical infrastructure locations
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_miles: Search radius in miles
            infrastructure_types: Types of infrastructure (hospitals, police, etc)
        
        Returns:
            Critical infrastructure features
        """
        if not infrastructure_types:
            infrastructure_types = ["hospitals", "fire_stations", "police", "schools", "utilities"]
        
        cache_key = f"critical_infra:{latitude:.4f}:{longitude:.4f}:{radius_miles}"
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        
        features = {
            "source": GISDataSource.GIO_DATAHARVEST.value,
            "type": FeatureType.CRITICAL_INFRASTRUCTURE.value,
            "location": {"latitude": latitude, "longitude": longitude},
            "infrastructure": {}
        }
        
        try:
            # Query multiple sources for critical infrastructure
            infra = await self._fetch_critical_infrastructure(
                latitude, longitude, radius_miles, infrastructure_types
            )
            features["infrastructure"] = infra
            features["timestamp"] = datetime.utcnow().isoformat()
            await self._cache_data(cache_key, features)
            
        except Exception as e:
            logger.error(f"Error fetching critical infrastructure: {e}")
            features["error"] = str(e)
        
        return features
    
    async def get_flood_zones(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float = 5.0
    ) -> Dict[str, Any]:
        """Fetch FEMA flood zone data
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_miles: Search radius in miles
        
        Returns:
            Flood zone features and risk levels
        """
        cache_key = f"flood_zones:{latitude:.4f}:{longitude:.4f}:{radius_miles}"
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        
        features = {
            "source": "FEMA",
            "type": FeatureType.FLOOD_ZONES.value,
            "location": {"latitude": latitude, "longitude": longitude},
            "zones": []
        }
        
        try:
            # This would integrate with FEMA flood zone services
            zones = await self._fetch_flood_zones(latitude, longitude, radius_miles)
            features["zones"] = zones
            features["timestamp"] = datetime.utcnow().isoformat()
            await self._cache_data(cache_key, features)
            
        except Exception as e:
            logger.error(f"Error fetching flood zones: {e}")
            features["error"] = str(e)
        
        return features
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get health status of all data sources"""
        status = {
            "timestamp": datetime.utcnow().isoformat(),
            "sources": {}
        }
        
        # Test each source
        sources_to_test = [
            (GISDataSource.ESRI_GISDATA, self.config.ESRI_GIS_URL),
            (GISDataSource.IU_GIS, self.config.IU_GIS_URL),
            (GISDataSource.GIO_DATAHARVEST, self.config.GIO_DATAHARVEST_URL),
        ]
        
        for source, url in sources_to_test:
            try:
                async with self.http_client.head(url, timeout=5) as response:
                    status["sources"][source.value] = {
                        "status": "ONLINE" if response.status_code < 400 else "OFFLINE",
                        "status_code": response.status_code
                    }
            except Exception as e:
                status["sources"][source.value] = {
                    "status": "OFFLINE",
                    "error": str(e)
                }
        
        status["redis_connected"] = self._test_redis_connection()
        return status
    
    # ========================================================================
    # PRIVATE METHODS - DATA FETCHING
    # ========================================================================
    
    async def _fetch_iu_lidar(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float
    ) -> Optional[Dict[str, Any]]:
        """Fetch LiDAR elevation data from IU GIS"""
        try:
            url = f"{self.config.IU_GIS_URL}/elevation/query"
            params = {
                "f": "json",
                "lat": latitude,
                "lon": longitude,
                "radius": radius_miles
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                "source": GISDataSource.IU_GIS.value,
                "type": "lidar_elevation",
                "data": data
            }
        except Exception as e:
            logger.error(f"Error fetching IU LiDAR data: {e}")
            return None
    
    async def _fetch_esri_terrain(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float
    ) -> List[Dict[str, Any]]:
        """Fetch terrain data from ESRI GIS server"""
        try:
            url = f"{self.config.ESRI_GIS_URL}/Elevation/ImageServer/query"
            params = {
                "f": "json",
                "geometry": f'{{"x":{longitude},"y":{latitude}}}',
                "geometryType": "esriGeometryPoint",
                "returnGeometry": True
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return [
                {
                    "source": GISDataSource.ESRI_GISDATA.value,
                    "type": "terrain",
                    "data": data
                }
            ]
        except Exception as e:
            logger.error(f"Error fetching ESRI terrain data: {e}")
            return []
    
    async def _fetch_gio_utilities(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float,
        utility_types: List[str]
    ) -> Dict[str, Any]:
        """Fetch utility network data from GIO Data Harvest"""
        utilities = {}
        
        for util_type in utility_types:
            try:
                url = f"{self.config.GIO_DATAHARVEST_URL}/search/definition/"
                params = {
                    "keyword": util_type,
                    "lat": latitude,
                    "lon": longitude,
                    "radius": radius_miles,
                    "api_key": self.config.GIO_API_KEY
                }
                
                response = await self.http_client.get(url, params=params)
                response.raise_for_status()
                utilities[util_type] = response.json()
            except Exception as e:
                logger.error(f"Error fetching {util_type} utilities: {e}")
                utilities[util_type] = {"error": str(e)}
        
        return utilities
    
    async def _fetch_indiana_map_historic_sites(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float
    ) -> List[Dict[str, Any]]:
        """Fetch historic sites from Indiana Map"""
        try:
            url = "https://www.indianamap.org/datasets/INMap::idnr-surveyed-historic-sites-and-structures/arcgis/rest/services/query"
            
            # Convert radius to degrees (approximate)
            radius_deg = radius_miles / 69.0
            
            params = {
                "where": f"1=1",
                "geometry": f'{{"xmin":{longitude-radius_deg},"ymin":{latitude-radius_deg},"xmax":{longitude+radius_deg},"ymax":{latitude+radius_deg},"spatialReference":{{"wkid":4326}}}}',
                "geometryType": "esriGeometryEnvelope",
                "spatialRel": "esriSpatialRelIntersects",
                "outFields": "*",
                "returnGeometry": True,
                "f": "json"
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return data.get("features", [])
        except Exception as e:
            logger.error(f"Error fetching Indiana Map historic sites: {e}")
            return []
    
    async def _fetch_critical_infrastructure(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float,
        infrastructure_types: List[str]
    ) -> Dict[str, Any]:
        """Fetch critical infrastructure data"""
        infrastructure = {}
        
        for infra_type in infrastructure_types:
            try:
                url = f"{self.config.GIO_DATAHARVEST_URL}/search/definition/"
                params = {
                    "keyword": infra_type,
                    "lat": latitude,
                    "lon": longitude,
                    "radius": radius_miles,
                    "api_key": self.config.GIO_API_KEY
                }
                
                response = await self.http_client.get(url, params=params)
                response.raise_for_status()
                infrastructure[infra_type] = response.json()
            except Exception as e:
                logger.error(f"Error fetching {infra_type} infrastructure: {e}")
                infrastructure[infra_type] = {"error": str(e)}
        
        return infrastructure
    
    async def _fetch_flood_zones(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float
    ) -> List[Dict[str, Any]]:
        """Fetch FEMA flood zone data (placeholder)"""
        try:
            # This would integrate with FEMA's flood zone services
            zones = []
            logger.info(f"Fetched flood zones for {latitude}, {longitude}")
            return zones
        except Exception as e:
            logger.error(f"Error fetching flood zones: {e}")
            return []
    
    # ========================================================================
    # PRIVATE METHODS - CACHING
    # ========================================================================
    
    async def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve data from Redis cache"""
        try:
            cached_json = self.redis_client.get(cache_key)
            if cached_json:
                return json.loads(cached_json)
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        return None
    
    async def _cache_data(self, cache_key: str, data: Dict[str, Any]):
        """Store data in Redis cache"""
        try:
            ttl = self.config.CACHE_TTL_HOURS * 3600
            self.redis_client.setex(cache_key, ttl, json.dumps(data))
        except Exception as e:
            logger.error(f"Cache storage error: {e}")
    
    def _test_redis_connection(self) -> bool:
        """Test Redis connectivity"""
        try:
            self.redis_client.ping()
            return True
        except Exception:
            return False


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_aggregator_instance = None

def get_gis_aggregator(config: GISAggregatorConfig = None) -> GISDataAggregator:
    """Get singleton GIS aggregator instance"""
    global _aggregator_instance
    if _aggregator_instance is None:
        _aggregator_instance = GISDataAggregator(config)
    return _aggregator_instance
