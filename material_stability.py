"""Material Stability Verification - Engineering compliance checking"""
import logging
from typing import Dict, List, Any
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)

class MaterialStabilityConfig:
    MIN_LEVEE_HEIGHT_FT = 8.0
    MIN_BERM_WIDTH_FT = 12.0
    MIN_SLOPE_RATIO = 3.0
    MAX_SEEPAGE_RATE_GALLONS_MIN = 0.5
    DESIGN_FLOOD_STAGE = 58.5

class MaterialStabilityVerifier:
    def __init__(self, config: MaterialStabilityConfig = None):
        self.config = config or MaterialStabilityConfig()
    
    def verify_levee_structural_integrity(
        self,
        levee_id: str,
        height_ft: float,
        berm_width_ft: float,
        slope_ratio: float,
        last_inspection_date: datetime = None
    ) -> Dict[str, Any]:
        """Verify levee structural integrity against design standards"""
        results = {
            "levee_id": levee_id,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {},
            "compliant": True
        }
        
        # Height check
        height_ok = height_ft >= self.config.MIN_LEVEE_HEIGHT_FT
        results["checks"]["height"] = {
            "required": self.config.MIN_LEVEE_HEIGHT_FT,
            "actual": height_ft,
            "compliant": height_ok
        }
        
        # Berm width check
        berm_ok = berm_width_ft >= self.config.MIN_BERM_WIDTH_FT
        results["checks"]["berm_width"] = {
            "required": self.config.MIN_BERM_WIDTH_FT,
            "actual": berm_width_ft,
            "compliant": berm_ok
        }
        
        # Slope ratio check
        slope_ok = slope_ratio >= self.config.MIN_SLOPE_RATIO
        results["checks"]["slope_ratio"] = {
            "required": self.config.MIN_SLOPE_RATIO,
            "actual": slope_ratio,
            "compliant": slope_ok
        }
        
        results["compliant"] = height_ok and berm_ok and slope_ok
        return results
    
    def verify_seepage_rate(
        self,
        levee_id: str,
        current_stage_ft: float,
        seepage_rate_gallons_min: float
    ) -> Dict[str, Any]:
        """Verify seepage rate is within acceptable limits"""
        results = {
            "levee_id": levee_id,
            "timestamp": datetime.utcnow().isoformat(),
            "current_stage": current_stage_ft,
            "seepage_rate_gallons_min": seepage_rate_gallons_min,
            "acceptable_rate": self.config.MAX_SEEPAGE_RATE_GALLONS_MIN,
            "compliant": seepage_rate_gallons_min <= self.config.MAX_SEEPAGE_RATE_GALLONS_MIN
        }
        
        if not results["compliant"]:
            results["alert"] = "SEEPAGE_RATE_EXCEEDED"
            results["recommendation"] = "Increase monitoring frequency and inspect for piping"
        
        return results
    
    def verify_design_flood_capacity(self, current_stage_ft: float) -> Dict[str, Any]:
        """Verify current water stage is below design flood elevation"""
        safety_margin = self.config.DESIGN_FLOOD_STAGE - current_stage_ft
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "design_flood_stage": self.config.DESIGN_FLOOD_STAGE,
            "current_stage": current_stage_ft,
            "safety_margin_ft": safety_margin,
            "percent_capacity": (current_stage_ft / self.config.DESIGN_FLOOD_STAGE) * 100,
            "status": "SAFE" if safety_margin > 1.0 else "WARNING" if safety_margin > 0 else "CRITICAL"
        }

_verifier_instance = None

def get_material_stability_verifier(config: MaterialStabilityConfig = None) -> MaterialStabilityVerifier:
    global _verifier_instance
    if _verifier_instance is None:
        _verifier_instance = MaterialStabilityVerifier(config)
    return _verifier_instance
