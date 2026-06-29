"""Material Stability & "No-Rise" Compliance Verification
Ensures levee/berm materials meet structural and hydrological standards.
"""
import logging
from typing import Dict
import math

logger = logging.getLogger(__name__)

class MaterialStabilityEngine:
    """Verify structural and geotechnical stability of levee materials"""
    
    def __init__(self):
        self.no_rise_safety_margin = 1.20
        self.minimum_factor_of_safety = 1.5
    
    def verify_no_rise_compliance(
        self,
        excavated_volume_m3: float,
        structural_volume_m3: float,
        water_level_baseline_m: float,
        water_level_design_m: float
    ) -> Dict[str, any]:
        """Verify "No-Rise" requirement: compensatory storage >= 1.2x excavation"""
        required_compensatory = excavated_volume_m3 * self.no_rise_safety_margin
        available_compensatory = structural_volume_m3 * (water_level_design_m - water_level_baseline_m)
        compliant = available_compensatory >= required_compensatory
        
        logger.info(f"No-Rise Check: Required={required_compensatory:.0f}m³, Available={available_compensatory:.0f}m³, Compliant={compliant}")
        
        return {
            "compliant": compliant,
            "excavated_m3": excavated_volume_m3,
            "required_compensatory_m3": required_compensatory,
            "available_compensatory_m3": available_compensatory,
            "margin_m3": available_compensatory - required_compensatory,
            "compliance_ratio": available_compensatory / required_compensatory if required_compensatory > 0 else 0
        }
    
    def evaluate_soil_stability(
        self,
        cohesion_kpa: float = 15.0,
        friction_angle_deg: float = 28.0,
        slope_height_m: float = 6.0,
        slope_angle_deg: float = 35.0
    ) -> Dict[str, float]:
        """Evaluate slope stability using infinite slope analysis"""
        gamma = 18.0  # Unit weight kN/m³
        
        beta_rad = math.radians(slope_angle_deg)
        phi_rad = math.radians(friction_angle_deg)
        
        numerator = (
            cohesion_kpa +
            (gamma * slope_height_m * math.cos(beta_rad) ** 2 * math.tan(phi_rad))
        )
        denominator = gamma * slope_height_m * math.sin(beta_rad) * math.cos(beta_rad)
        
        fs = numerator / denominator if denominator > 0 else 0.0
        
        if fs >= 1.5:
            stability = "SAFE"
        elif fs >= 1.2:
            stability = "MARGINAL"
        else:
            stability = "UNSTABLE"
        
        logger.info(f"Slope Stability: FOS = {fs:.2f} ({stability})")
        
        return {
            "factor_of_safety": float(fs),
            "minimum_required": self.minimum_factor_of_safety,
            "stability_class": stability,
            "cohesion_kpa": cohesion_kpa,
            "friction_angle_deg": friction_angle_deg,
            "slope_angle_deg": slope_angle_deg
        }
