"""USGS Telemetry Bridge - Real-time streamflow and stage data integration"""
import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import httpx
import json
import redis

logger = logging.getLogger(__name__)

class USGSConfig:
    NWIS_BASE_URL = "https://waterservices.usgs.gov/nwis"
    REQUEST_TIMEOUT = 30
    MAX_RETRIES = 3
    REDIS_HOST = "redis"
    REDIS_PORT = 6379
    CACHE_TTL_MINUTES = 15
    DEFAULT_STATIONS = ["03374500", "03372500", "03374000"]

class USGSTelemetryBridge:
    def __init__(self, config: USGSConfig = None):
        self.config = config or USGSConfig()
        self.redis_client = redis.Redis(
            host=self.config.REDIS_HOST,
            port=self.config.REDIS_PORT,
            decode_responses=True
        )
        self.http_client = httpx.AsyncClient(timeout=self.config.REQUEST_TIMEOUT)
    
    async def get_instantaneous_values(self, site_code: str, parameter_code: str = "00060,00065"):
        cache_key = f"usgs_instantaneous:{site_code}"
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        
        try:
            url = f"{self.config.NWIS_BASE_URL}/iv"
            params = {"sites": site_code, "parameterCd": parameter_code, "format": "json"}
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            processed = self._process_nwis_response(data)
            await self._cache_data(cache_key, processed)
            logger.info(f"Fetched instantaneous data for site {site_code}")
            return processed
        except Exception as e:
            logger.error(f"Error fetching instantaneous values: {e}")
            return {"error": str(e), "site_code": site_code}
    
    def _process_nwis_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = {"timestamp": datetime.utcnow().isoformat(), "values": []}
            if "value" in data and "timeSeries" in data["value"]:
                for series in data["value"]["timeSeries"]:
                    if "values" in series and len(series["values"]) > 0:
                        time_series = series["values"][0]
                        for value in time_series.get("value", []):
                            result["values"].append({
                                "dateTime": value.get("dateTime"),
                                "value": value.get("value")
                            })
            return result
        except Exception as e:
            logger.error(f"Error processing NWIS response: {e}")
            return {"error": str(e)}
    
    async def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        try:
            cached_json = self.redis_client.get(cache_key)
            if cached_json:
                return json.loads(cached_json)
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        return None
    
    async def _cache_data(self, cache_key: str, data: Dict[str, Any]):
        try:
            ttl = self.config.CACHE_TTL_MINUTES * 60
            self.redis_client.setex(cache_key, ttl, json.dumps(data))
        except Exception as e:
            logger.error(f"Cache storage error: {e}")

_bridge_instance = None

def get_usgs_bridge(config: USGSConfig = None) -> USGSTelemetryBridge:
    global _bridge_instance
    if _bridge_instance is None:
        _bridge_instance = USGSTelemetryBridge(config)
    return _bridge_instance
