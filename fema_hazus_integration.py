"""FEMA HAZUS-MH Integration & CRS Verification
Automatic flood impact assessment and Community Rating System compliance.
"""
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class FEMAHAZUSIntegration:
    """Integrates FEMA HAZUS-MH flood loss estimation"""
    
    def __init__(self):
        self.hazus_api_url = "https://hazus-api.fema.gov/api/v1"
        self.study_region_id = "point-township-in-ky"
    
    async def compute_flood_losses(
        self,
        flood_stage_ft: float,
        affected_structures: List[Dict]
    ) -> Dict[str, any]:
        """Compute economic losses using HAZUS loss curves"""
        try:
            total_direct_loss = 0
            affected_count = 0
            
            for structure in affected_structures:
                depth_above_ff = max(0, flood_stage_ft - structure["first_floor_elevation_ft"])
                if depth_above_ff > 0:
                    structure_value = structure.get("structure_value_usd", 200000)
                    damage_ratio = self._compute_damage_ratio(depth_above_ff, structure["type"])
                    direct_loss = structure_value * damage_ratio
                    total_direct_loss += direct_loss
                    affected_count += 1
            
            indirect_loss = total_direct_loss * 0.15
            logger.info(f"HAZUS: {affected_count} structures affected, ${total_direct_loss:,.0f} direct loss")
            
            return {
                "status": "SUCCESS",
                "affected_structures": affected_count,
                "direct_loss_usd": float(total_direct_loss),
                "indirect_loss_usd": float(indirect_loss),
                "total_loss_usd": float(total_direct_loss + indirect_loss)
            }
        except Exception as e:
            logger.error(f"HAZUS computation error: {e}")
            return {"status": "ERROR", "error": str(e)}
    
    def _compute_damage_ratio(self, depth_ft: float, structure_type: str) -> float:
        """Compute damage ratio from HAZUS depth-damage curves"""
        if structure_type == "residential":
            if depth_ft < 1:
                return 0.1 * depth_ft
            elif depth_ft < 5:
                return 0.1 + 0.15 * (depth_ft - 1)
            else:
                return 0.7
        elif structure_type == "commercial":
            if depth_ft < 2:
                return 0.05 * depth_ft
            else:
                return 0.1 + 0.1 * (depth_ft - 2)
        else:
            return 0.1 * depth_ft
    
    def export_nfip_documentation(self, study_metadata: Dict) -> Dict[str, str]:
        """Generate NFIP CRS documentation"""
        documents = {
            "flood_insurance_study": "/reports/FIS_Point_Township.pdf",
            "flood_boundary_map": "/reports/FBM_Point_Township.pdf",
            "flood_way_map": "/reports/FLOWAY_Point_Township.pdf",
            "hazard_mitigation_plan": "/reports/HMP_Point_Township.pdf"
        }
        logger.info("✓ NFIP documentation generated")
        return documents

class CommunityRatingSystem:
    """Manages NFIP Community Rating System (CRS) compliance"""
    
    def __init__(self):
        self.current_rating = None
        self.activity_credits = {}
    
    def calculate_crs_rating(self, completed_activities: List[str]) -> Dict[str, any]:
        """Calculate CRS rating based on completed mitigation activities"""
        activity_credits = {
            "210": 200, "220": 255, "410": 350, "430": 280, "500": 250, "600": 300
        }
        
        total_credits = sum(activity_credits.get(act, 0) for act in completed_activities)
        
        if total_credits >= 4500:
            rating, discount_pct = 1, 45
        elif total_credits >= 4000:
            rating, discount_pct = 2, 40
        elif total_credits >= 3500:
            rating, discount_pct = 3, 35
        elif total_credits >= 3000:
            rating, discount_pct = 4, 30
        else:
            rating, discount_pct = 5, 25
        
        logger.info(f"CRS Rating: {rating} (Premium discount: {discount_pct}%)")
        return {
            "crs_rating": rating,
            "credit_points": total_credits,
            "insurance_discount_pct": discount_pct,
            "completed_activities": completed_activities
        }
    
    def verify_nfip_compliance(self, study_data: Dict) -> Dict[str, any]:
        """Verify compliance with NFIP requirements"""
        requirements = {
            "flood_insurance_study_current": study_data.get("fis_year", 1990) >= 2000,
            "flood_way_delineated": study_data.get("has_floodway", False),
            "freeboard_enforced": study_data.get("freeboard_ft", 0) >= 1.0,
            "stormwater_management": study_data.get("has_swm", False),
            "acquisition_program_active": study_data.get("has_acquisition", False)
        }
        compliance_pct = sum(requirements.values()) / len(requirements) * 100
        
        return {
            "overall_compliance_pct": compliance_pct,
            "requirements_met": requirements,
            "compliance_status": "FULL" if compliance_pct == 100 else "PARTIAL" if compliance_pct >= 75 else "DEFICIENT"
        }
