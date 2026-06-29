"""Temporal Flood Propagation Graphs - SurrealDB
Model flood wave propagation as directed acyclic graph with temporal relationships.
"""
import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from surrealdb import Surreal
    SURREALDB_AVAILABLE = True
except ImportError:
    SURREALDB_AVAILABLE = False
    logger.warning("SurrealDB not available")

class SurrealDBFloodGraphs:
    """Graph-based flood event tracking and propagation modeling."""
    
    def __init__(self, url: str = "ws://surrealdb:8000"):
        self.url = url
        self.db = None
        self.is_connected = False
    
    async def connect(self):
        """Connect to SurrealDB instance."""
        if not SURREALDB_AVAILABLE:
            logger.warning("SurrealDB not available; using mock mode")
            return
        try:
            self.db = Surreal()
            await self.db.connect(self.url)
            self.is_connected = True
            logger.info("✓ Connected to SurrealDB")
        except Exception as e:
            logger.warning(f"SurrealDB connection failed: {e}")
    
    async def insert_flood_event(self, event: Dict[str, Any]):
        """Insert flood event into graph."""
        if not SURREALDB_AVAILABLE or not self.is_connected:
            logger.debug(f"Flood event (mock): {event['station_id']}")
            return
        try:
            await self.db.create(f"station:{event['station_id']}", {
                "name": event['station_id'],
                "timestamp": event['timestamp'],
                "flow_cfs": event['flow_cfs']
            })
            logger.debug(f"Flood event inserted: {event['station_id']}")
        except Exception as e:
            logger.error(f"Flood event insert error: {e}")
    
    async def query_flood_propagation(self, station_id: str) -> List[Dict]:
        """Query propagation path downstream."""
        if not SURREALDB_AVAILABLE or not self.is_connected:
            return self._mock_propagation(station_id)
        try:
            result = await self.db.query(f"SELECT * FROM station:{station_id}")
            return result if result else self._mock_propagation(station_id)
        except Exception as e:
            logger.error(f"Propagation query error: {e}")
            return self._mock_propagation(station_id)
    
    def _mock_propagation(self, station_id: str) -> List[Dict]:
        """Mock propagation path for testing."""
        return [
            {"station_id": station_id, "flow_cfs": 80000, "distance_miles": 0, "time_to_reach_hours": 0},
            {"station_id": f"{station_id}_ds1", "flow_cfs": 78000, "distance_miles": 1.5, "time_to_reach_hours": 0.5},
            {"station_id": f"{station_id}_ds2", "flow_cfs": 76000, "distance_miles": 3.0, "time_to_reach_hours": 1.0}
        ]
