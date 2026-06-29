"""Municipal Parcel Risk Optimizer
Prioritize evacuations based on financial exposure and accessibility
"""
import numpy as np
import logging
from typing import Dict, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class Parcel:
    """Municipal parcel with risk characteristics"""
    parcel_id: str
    latitude: float
    longitude: float
    elevation_ft: float
    structure_value_usd: float
    occupants: int
    accessibility_score: float
    distance_to_route_miles: float
    floor_elevation_ft: float

class ParcelRiskOptimizer:
    """Optimize municipal response to flooding"""
    
    def __init__(self, num_parcels_demo: int = 500):
        self.parcels = self._generate_demo_parcels(num_parcels_demo)
        self.evacuation_time_hours = 6
        self.people_per_vehicle = 4
        self.vehicles_available = 50
    
    def _generate_demo_parcels(self, n: int) -> List[Parcel]:
        """Generate synthetic parcel data"""
        parcels = []
        base_lat, base_lon = 37.8575, -87.9944
        
        for i in range(n):
            parcel = Parcel(
                parcel_id=f"65-12-36-200-{i:06d}.000-012",
                latitude=base_lat + np.random.uniform(-0.05, 0.05),
                longitude=base_lon + np.random.uniform(-0.05, 0.05),
                elevation_ft=350 + np.random.uniform(-20, 40),
                structure_value_usd=200000 + np.random.exponential(150000),
                occupants=int(np.random.poisson(2.5)),
                accessibility_score=np.random.uniform(0.3, 1.0),
                distance_to_route_miles=np.random.uniform(0.1, 5.0),
                floor_elevation_ft=350 + np.random.uniform(0, 20)
            )
            parcels.append(parcel)
        
        return parcels
    
    def evaluate_all_parcels(self, flood_stage_elevation: float, compound_risk: bool = True) -> List[Dict]:
        """Evaluate flood risk for all parcels"""
        risk_assessments = []
        
        for parcel in self.parcels:
            inundation_depth = max(0, flood_stage_elevation - parcel.floor_elevation_ft)
            
            if inundation_depth <= 0:
                risk_score = 0.0
            else:
                inundation_risk = min(1.0, inundation_depth / 6.0)
                life_safety = parcel.occupants / max(self.people_per_vehicle, 1)
                financial = min(parcel.structure_value_usd / 1e6, 1.0)
                accessibility = 1.0 - parcel.accessibility_score
                
                compound_mult = 1.3 if compound_risk and inundation_depth > 3 else 1.0
                
                risk_score = compound_mult * (
                    0.4 * inundation_risk + 0.3 * life_safety +
                    0.2 * financial + 0.1 * accessibility
                )
            
            assessment = {
                "parcel_id": parcel.parcel_id,
                "latitude": parcel.latitude,
                "longitude": parcel.longitude,
                "risk_score": float(min(risk_score, 1.0)),
                "inundation_depth_ft": float(inundation_depth),
                "occupants": parcel.occupants,
                "structure_value_usd": float(parcel.structure_value_usd),
                "financial_exposure": float(parcel.structure_value_usd * risk_score),
                "evacuation_priority": "CRITICAL" if risk_score > 0.8 else "HIGH" if risk_score > 0.6 else "MODERATE" if risk_score > 0.3 else "LOW"
            }
            risk_assessments.append(assessment)
        
        risk_assessments.sort(key=lambda x: x["risk_score"], reverse=True)
        
        logger.info(f"Risk assessment complete: {len(risk_assessments)} parcels")
        logger.info(f"High priority (>0.7): {sum(1 for p in risk_assessments if p['risk_score'] > 0.7)}")
        
        return risk_assessments
