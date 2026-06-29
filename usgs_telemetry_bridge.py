"""Real-time USGS Water Data Integration
Connects to USGS NWIS real-time streamflow API (Station 03377500 - Wabash R. at Mt. Carmel)
"""
import logging
import asyncio
from typing import Dict, Optional
import httpx

logger = logging.getLogger(__name__)

class USGSBridge:
    """Live telemetry ingestion from USGS monitoring stations"""
    
    def __init__(self):
        self.base_url = "https://waterservices.usgs.gov/nwis/iv/"
        self.stations = {
            "03377500": "Wabash R. at Mt. Carmel (main gauge)",
            "03378000": "Little Wabash R. at St. Francisville",
            "03377200": "White R. at Petersburg"
        }
        self.alert_threshold_cfs = 80000
    
    async def fetch_live_flow(self, station_id: str = "03377500") -> Optional[Dict[str, float]]:
        """Fetch real-time flow data from USGS NWIS"""
        try:
            params = {
                "format": "json",
                "sites": station_id,
                "parameterCd": "00060,00065",
                "siteStatus": "all"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                ts_data = data["value"]["timeSeries"]
                flow_cfs = None
                stage_ft = None
                timestamp = None
                
                for ts in ts_data:
                    param_code = ts["sourceInfo"]["variable"]["variableCode"]["value"]
                    value = ts["values"][0]["value"][0]
                    
                    if param_code == "00060":
                        flow_cfs = float(value["value"])
                        timestamp = value["dateTime"]
                    elif param_code == "00065":
                        stage_ft = float(value["value"])
                
                if flow_cfs is not None and stage_ft is not None:
                    logger.info(f"✓ USGS {station_id}: {flow_cfs:.0f} cfs @ {stage_ft:.2f} ft")
                    return {
                        "station_id": station_id,
                        "flow_cfs": flow_cfs,
                        "stage_ft": stage_ft,
                        "timestamp": timestamp,
                        "alert_triggered": flow_cfs > self.alert_threshold_cfs
                    }
                return None
        except Exception as e:
            logger.error(f"USGS connection error: {e}")
            return None
    
    async def fetch_all_stations(self) -> Dict[str, Dict]:
        """Fetch data from all configured stations"""
        results = {}
        tasks = [self.fetch_live_flow(sid) for sid in self.stations.keys()]
        responses = await asyncio.gather(*tasks)
        
        for station_id, data in zip(self.stations.keys(), responses):
            if data:
                results[station_id] = data
        
        return results
