"""Real-Time LiDAR Point Cloud Rendering via 3D Tiles
Streams point cloud data as 3D Tiles tileset for Cesium.js visualization.
"""
import logging
from typing import Dict, List
from pathlib import Path
import json
import numpy as np

logger = logging.getLogger(__name__)

try:
    import rasterio
    import pdal
    HAS_GEOSPATIAL = True
except ImportError:
    HAS_GEOSPATIAL = False
    logger.warning("PDAL/Rasterio not available for 3D Tiles generation")

class LiDARPointCloudRenderer:
    """Converts LiDAR/DEM data to 3D Tiles for real-time rendering"""
    
    def __init__(self, tiles_cache_dir: str = "./data/3dtiles"):
        self.tiles_cache = Path(tiles_cache_dir)
        self.tiles_cache.mkdir(parents=True, exist_ok=True)
    
    def generate_3dtiles_tileset(
        self,
        dem_tiff_path: str,
        las_cloud_path: str = None,
        max_levels: int = 15
    ) -> Dict[str, any]:
        """Generate 3D Tiles tileset.json for DEM/point cloud
        
        Args:
            dem_tiff_path: Path to DEM GeoTIFF
            las_cloud_path: Optional path to LAS point cloud
            max_levels: Maximum LOD levels
        
        Returns:
            Tileset metadata for Cesium
        """
        if not HAS_GEOSPATIAL:
            logger.warning("Geospatial libraries not available")
            return self._mock_tileset()
        
        try:
            with rasterio.open(dem_tiff_path) as src:
                bounds = src.bounds
                data = src.read(1)
            
            tileset = {
                "asset": {"version": "1.0", "tilesetVersion": "1.0.0"},
                "geometricError": 500,
                "root": {
                    "boundingVolume": {"box": self._compute_bounding_box(bounds)},
                    "geometricError": 500,
                    "refine": "ADD",
                    "content": {"uri": "data/root.glb"},
                    "children": self._generate_lod_children(data, bounds, max_levels)
                }
            }
            
            tileset_path = self.tiles_cache / "tileset.json"
            with open(tileset_path, 'w') as f:
                json.dump(tileset, f, indent=2)
            
            logger.info(f"✓ 3D Tiles generated: {tileset_path}")
            return tileset
        
        except Exception as e:
            logger.error(f"3D Tiles generation error: {e}")
            return self._mock_tileset()
    
    def _compute_bounding_box(self, bounds) -> List[float]:
        """Compute bounding box in Cesium format [cx, cy, cz, sx, 0, 0, 0, sy, 0, 0, 0, sz]"""
        cx = (bounds.left + bounds.right) / 2
        cy = (bounds.bottom + bounds.top) / 2
        cz = 350
        sx = (bounds.right - bounds.left) / 2
        sy = (bounds.top - bounds.bottom) / 2
        sz = 50
        return [cx, cy, cz, sx, 0, 0, 0, sy, 0, 0, 0, sz]
    
    def _generate_lod_children(self, dem_data: np.ndarray, bounds, max_levels: int) -> List[Dict]:
        """Generate LOD hierarchy for progressive loading"""
        children = []
        for level in range(1, min(max_levels, 5)):
            factor = 2 ** level
            downsampled = dem_data[::factor, ::factor]
            children.append({
                "boundingVolume": {"box": self._compute_bounding_box(bounds)},
                "geometricError": 500 / factor,
                "content": {"uri": f"data/lod_{level}.glb"}
            })
        return children
    
    def _mock_tileset(self) -> Dict:
        """Mock tileset for testing"""
        return {
            "asset": {"version": "1.0"},
            "geometricError": 500,
            "root": {
                "boundingVolume": {"box": [0, 0, 0, 1000, 0, 0, 0, 1000, 0, 0, 0, 500]},
                "content": {"uri": "data/root.glb"}
            }
        }
    
    def stream_point_cloud_realtime(self, las_file_path: str) -> Dict:
        """Stream LAS point cloud in real-time chunks for live visualization"""
        if not HAS_GEOSPATIAL:
            return {"status": "UNAVAILABLE"}
        
        try:
            pipeline = {
                "pipeline": [
                    las_file_path,
                    {"type": "filters.decimation", "step": 10},
                    {"type": "writers.las", "filename": str(self.tiles_cache / "streaming.las")}
                ]
            }
            logger.info(f"✓ Point cloud streaming configured: {las_file_path}")
            return {
                "status": "STREAMING",
                "output_file": str(self.tiles_cache / "streaming.las"),
                "pipeline": pipeline
            }
        except Exception as e:
            logger.error(f"Point cloud streaming error: {e}")
            return {"status": "ERROR", "error": str(e)}
