# PTDT v23 GIS Integration Architecture
## Posey County, Indiana — High-Fidelity 3D Terrain & Infrastructure Model

---

## 🗺️ Overview: Multi-Source GIS Data Pipeline

This document defines how PTDT v23 ingests real-world Posey County data from:

1. **WTH GIS** (Posey County mapping service)
2. **ACRES.com Plat Maps** (parcel/cadastral data)
3. **USGS NED/3DEP** (National Elevation Data)
4. **USGS NHD** (National Hydrography Dataset)
5. **NRCS Soil Survey** (soil type/properties)
6. **State/Local Infrastructure** (roads, utilities, levees)
7. **LiDAR (if available)** (meter-scale terrain)

---

## 📊 Data Categories & Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    GIS Data Sources                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TERRAIN                    INFRASTRUCTURE                 │
│  ├─ DEM/Elevation          ├─ Roads (geometry)             │
│  ├─ LiDAR (if available)   ├─ Culverts (location/size)     │
│  ├─ Bathymetry             ├─ Levees (crest/profile)       │
│  └─ Flow direction         ├─ Pump stations (location)     │
│                             ├─ Bridges (span/height)       │
│  HYDROLOGY                 ├─ Power lines                  │
│  ├─ Stream network         ├─ Water mains                  │
│  ├─ Wetlands               ├─ Sewer lines                  │
│  ├─ Floodplain boundary    └─ Telecom conduits             │
│  └─ Flow direction grid                                    │
│                             CADASTRAL/PROPERTY             │
│  SOILS                     ├─ Parcel boundaries            │
│  ├─ Soil type/texture      ├─ Ownership                    │
│  ├─ Hydrologic Group       ├─ Zoning classification       │
│  ├─ Infiltration rates     ├─ Land use (NLCD)             │
│  ├─ Permeability           └─ Building footprints         │
│  └─ Cohesion/friction angle                               │
│                                                             │
│                  ↓↓↓ ALL FUSED INTO v23 ↓↓↓               │
│                                                             │
│        UNIFIED 3D SIMULATION MESH + STATE LAYERS           │
│        (Real terrain, real infrastructure, real soils)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core GIS Integration Modules

### 1. **WTH GIS Connector** (`core/terrain/wth_gis_bridge.py`)

```python
"""
WTH GIS API Bridge for Posey County
Fetches: parcel boundaries, infrastructure, cadastral data
"""

class WTHGISConnector:
    """
    Connects to Posey County WTH GIS service.
    Endpoint: https://poseyin.wthgis.com (via WMS/WFS if available)
    """
    
    def __init__(self, base_url="https://poseyin.wthgis.com"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def fetch_parcel_boundaries(self, bbox) -> GeoDataFrame:
        """
        Fetch parcel boundaries from WTH GIS.
        Returns: GeoDataFrame with geometry, parcel ID, owner, zoning
        """
        pass
    
    def fetch_infrastructure(self, bbox) -> Dict[str, GeoDataFrame]:
        """
        Fetch all infrastructure:
        - roads (LineString)
        - culverts (Point + diameter)
        - levees (LineString + profile)
        - pump_stations (Point + capacity)
        - bridges (Point + span)
        """
        return {
            'roads': self._fetch_roads(bbox),
            'culverts': self._fetch_culverts(bbox),
            'levees': self._fetch_levees(bbox),
            'pumps': self._fetch_pumps(bbox),
            'bridges': self._fetch_bridges(bbox),
        }
    
    def fetch_building_footprints(self, bbox) -> GeoDataFrame:
        """
        Fetch building outlines (for 3D visualization + damage assessment)
        """
        pass
    
    def fetch_zoning(self, bbox) -> GeoDataFrame:
        """
        Fetch zoning classifications and land use
        """
        pass
```

---

### 2. **ACRES Plat Map Parser** (`core/terrain/acres_plat_parser.py`)

```python
"""
ACRES.com Plat Map Integration
Fetches: parcel data, lot descriptions, property boundaries
"""

class ACRESPlatParser:
    """
    Scrapes/integrates ACRES.com plat mapping service.
    URL: https://www.acres.com/plat-map/map/in/posey-county-in
    """
    
    def __init__(self):
        self.base_url = "https://www.acres.com/plat-map/map/in/posey-county-in"
    
    def fetch_parcel_data(self, bbox) -> GeoDataFrame:
        """
        Fetch all parcel records in bounding box.
        Returns: GeoDataFrame with:
        - geometry (parcel boundary)
        - parcel_id (unique identifier)
        - owner_name (current owner)
        - owner_address
        - deed_volume_page
        - lot_number
        - quarter_section
        - acreage
        - property_value
        - land_use_code
        """
        pass
    
    def fetch_lot_descriptions(self, parcel_id: str) -> Dict:
        """
        Get detailed lot description for specific parcel.
        E.g., "NW 1/4 of SE 1/4 Section 12, Township 5S, Range 11W"
        """
        pass
    
    def get_property_history(self, parcel_id: str) -> List[Dict]:
        """
        Fetch deed history (optional, for historical analysis)
        """
        pass
```

---

### 3. **USGS NED/3DEP Elevation** (`core/terrain/usgs_elevation.py`)

```python
"""
USGS National Elevation Dataset (NED) + 3DEP integration
Fetches: 1m, 3m, or 10m resolution DEM for Posey County
"""

class USGSElevationFetcher:
    """
    Downloads NED/3DEP elevation data via OpenTopography or USGS API.
    Resolution: 1m (3DEP) or 10m (NED legacy)
    """
    
    def __init__(self, resolution_m=1):
        self.resolution = resolution_m
        self.api_base = "https://opendata.gis.arcgis.com/api"
    
    def fetch_dem(self, bbox: Tuple[float, float, float, float], 
                  output_path: str) -> str:
        """
        Download DEM for bounding box.
        Returns: Path to downloaded GeoTIFF file
        
        Args:
            bbox: (minx, miny, maxx, maxy) in WGS84
            output_path: Where to save GeoTIFF
        
        Returns:
            Path to DEM file
        """
        pass
    
    def fetch_hillshade(self, dem_path: str) -> ndarray:
        """
        Generate hillshade visualization from DEM
        """
        pass
    
    def fetch_slope(self, dem_path: str) -> ndarray:
        """
        Calculate slope (degrees) from DEM
        """
        pass
    
    def fetch_aspect(self, dem_path: str) -> ndarray:
        """
        Calculate aspect (0-360°) from DEM
        """
        pass
```

---

### 4. **USGS National Hydrography Dataset (NHD)** (`core/terrain/usgs_hydro.py`)

```python
"""
USGS National Hydrography Dataset (NHD) + NHDPlus integration
Fetches: streams, rivers, wetlands, flow direction
"""

class USGSHydrographyFetcher:
    """
    Downloads NHD data for Posey County.
    Sources: 
    - NHDPlus v2.1 (high resolution)
    - WBD (Watershed Boundary Dataset)
    """
    
    def fetch_flowlines(self, bbox) -> GeoDataFrame:
        """
        Fetch stream/river network.
        Returns: GeoDataFrame with:
        - geometry (LineString)
        - COMID (Common Identifier)
        - stream_order
        - flow_direction
        - mean_velocity
        - mean_depth
        """
        pass
    
    def fetch_waterbodies(self, bbox) -> GeoDataFrame:
        """
        Fetch lakes, ponds, reservoirs.
        Returns: GeoDataFrame with:
        - geometry (Polygon)
        - COMID
        - water_body_type
        - surface_area_km2
        """
        pass
    
    def fetch_wetlands(self, bbox) -> GeoDataFrame:
        """
        Fetch National Wetlands Inventory (NWI) data.
        Returns: GeoDataFrame with:
        - geometry (Polygon)
        - wetland_type (e.g., 'PEMA' = Palustrine Emergent Modifed)
        - water_regime
        """
        pass
    
    def fetch_watersheds(self, bbox) -> GeoDataFrame:
        """
        Fetch WBD watershed boundaries.
        Returns: GeoDataFrame with HUC codes at multiple levels
        """
        pass
    
    def fetch_flow_direction_grid(self, dem_path: str) -> Dict:
        """
        Generate D8 flow direction grid from DEM.
        Returns: {
            'flow_dir': ndarray (0-7 direction codes),
            'flow_accum': ndarray (cell count upstream)
        }
        """
        pass
```

---

### 5. **NRCS Soil Survey Data** (`core/terrain/nrcs_soil_data.py`)

```python
"""
NRCS (Natural Resources Conservation Service) Soil Survey
Fetches: soil type, hydrologic group, infiltration, cohesion, friction
"""

class NRCSSoilDataFetcher:
    """
    Downloads SSURGO (Soil Survey Geographic) data for Posey County.
    Resolution: ~10m grid
    
    Posey County SSURGO: Available from NRCS Web Soil Survey
    """
    
    def fetch_soil_survey(self, bbox) -> GeoDataFrame:
        """
        Fetch soil map units.
        Returns: GeoDataFrame with:
        - geometry (Polygon - soil polygon)
        - MUKEY (map unit key)
        - muname (soil series name, e.g., 'Ginat silt loam')
        - drclassdcd (drainage class: 'Well drained', etc.)
        - hydgrpdcd (hydrologic group: A, B, C, D)
        """
        pass
    
    def fetch_component_properties(self, mukey: str) -> Dict:
        """
        For a given soil map unit, fetch detailed properties:
        - ksat (hydraulic conductivity, mm/hr)
        - claytotal (clay %, affects cohesion)
        - sandtotal (sand %, affects friction)
        - silttotal (silt %)
        - om (organic matter %, affects compressibility)
        - dbthirdbar (bulk density, g/cm³)
        - fragvoltot (rock fragment %, affects bearing)
        """
        pass
    
    def fetch_interpretations(self, mukey: str) -> Dict:
        """
        Get soil interpretations relevant to engineering:
        - septic tank absorption field
        - construction material (road fill, etc.)
        - depth to water table
        - flooding frequency
        - depth to bedrock
        """
        pass
    
    def estimate_friction_angle(self, soil_series: str) -> float:
        """
        Estimate effective friction angle (degrees) from soil type.
        E.g., clay loam ~ 30°, sandy silt ~ 35°
        """
        pass
    
    def estimate_cohesion(self, soil_series: str) -> float:
        """
        Estimate undrained cohesion (kPa) from soil type.
        E.g., clay ~ 50-100 kPa, silt ~ 30-60 kPa
        """
        pass
```

---

### 6. **State/Local Infrastructure Data** (`core/terrain/local_infrastructure.py`)

```python
"""
Indiana DOT + Local Government Infrastructure
Fetches: roads, levees, pump stations, utilities
"""

class LocalInfrastructureFetcher:
    """
    Aggregates infrastructure from:
    - Indiana DOT (INDOT)
    - Posey County GIS
    - Local municipalities
    - USACE levee inventory (if available)
    """
    
    def fetch_roads(self, bbox) -> GeoDataFrame:
        """
        Fetch road network.
        Returns: GeoDataFrame with:
        - geometry (LineString)
        - road_name
        - road_class (highway, county, local)
        - surface_type (asphalt, gravel, etc.)
        - width_ft
        - elevation_ft (centerline)
        """
        pass
    
    def fetch_levees(self, bbox) -> GeoDataFrame:
        """
        Fetch levee centerlines and profiles.
        Returns: GeoDataFrame with:
        - geometry (LineString)
        - levee_id
        - crest_elevation_ft
        - crest_width_ft
        - toe_elevation_ft (base)
        - upstream_slope (H:V, e.g., 3:1)
        - downstream_slope
        - material (clay, sand, etc.)
        - condition_rating
        """
        pass
    
    def fetch_culverts(self, bbox) -> GeoDataFrame:
        """
        Fetch culvert locations and properties.
        Returns: GeoDataFrame with:
        - geometry (Point at culvert centerline)
        - culvert_id
        - inlet_elevation_ft
        - outlet_elevation_ft
        - diameter_ft (or width×height)
        - length_ft
        - material (concrete, metal, etc.)
        - condition_rating
        - upstream_invert
        - downstream_invert
        """
        pass
    
    def fetch_pump_stations(self, bbox) -> GeoDataFrame:
        """
        Fetch pumping station locations and curves.
        Returns: GeoDataFrame with:
        - geometry (Point)
        - pump_id
        - station_name
        - elevation_ft (intake)
        - design_discharge_cfs
        - pump_type (centrifugal, etc.)
        - number_of_pumps
        - power_source (electric, diesel)
        """
        pass
    
    def fetch_bridges(self, bbox) -> GeoDataFrame:
        """
        Fetch bridge inventory.
        Returns: GeoDataFrame with:
        - geometry (Point at bridge)
        - bridge_id
        - name
        - span_ft
        - height_clearance_ft
        - material (steel, concrete)
        - scour_critical (True/False)
        """
        pass
    
    def fetch_utilities(self, bbox) -> Dict[str, GeoDataFrame]:
        """
        Fetch utility lines (power, water, sewer, telecom).
        Returns: {
            'power_lines': GeoDataFrame,
            'water_mains': GeoDataFrame,
            'sewer_lines': GeoDataFrame,
            'telecom': GeoDataFrame,
        }
        """
        pass
```

---

### 7. **LiDAR Integration** (`core/terrain/lidar_processor.py`)

```python
"""
LiDAR Point Cloud Processing
If LiDAR available: Fetches/processes for meter-scale terrain accuracy
"""

class LiDARProcessor:
    """
    Processes LiDAR data (if available for Posey County).
    Sources:
    - OpenTopography
    - USGS 3DEP LiDAR
    - State/local collected LiDAR
    """
    
    def fetch_lidar_pointcloud(self, bbox, output_path) -> str:
        """
        Download LiDAR point cloud (LAZ format).
        Returns: Path to LAZ file
        """
        pass
    
    def process_pointcloud(self, laz_path: str) -> Dict:
        """
        Process LiDAR into products:
        Returns: {
            'dem': GeoTIFF (Digital Elevation Model, ground returns),
            'dsm': GeoTIFF (Digital Surface Model, first returns),
            'chm': GeoTIFF (Canopy Height Model, DSM - DEM),
            'intensity': GeoTIFF (return intensity),
        }
        """
        pass
    
    def classify_points(self, laz_path: str) -> str:
        """
        Classify point cloud (ground, vegetation, building, water, etc.).
        Returns: Path to classified LAS file
        """
        pass
    
    def extract_breaklines(self, laz_path: str) -> GeoDataFrame:
        """
        Extract hard breaklines (ridges, valleys, levee toes).
        Returns: GeoDataFrame of breakline geometries
        """
        pass
```

---

## 📈 Data Pipeline Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                  PTDT v23 GIS Data Ingest                      │
└────────────────────────────────────────────────────────────────┘

STEP 1: Define Study Area
  └─→ Bounding box: Posey County, IN (or specific Point Township area)
      Coordinates: ~(min_lon, min_lat, max_lon, max_lat) in WGS84

STEP 2: Fetch Base Terrain
  ├─→ USGS NED/3DEP DEM (1m resolution)
  ├─→ LiDAR (if available)
  └─→ USGS NHD streams/rivers/wetlands

STEP 3: Fetch Infrastructure
  ├─→ WTH GIS: Roads, culverts, levees, pump stations, bridges
  ├─→ ACRES: Parcel boundaries, ownership, zoning
  └─→ Local utilities: Power, water, sewer, telecom

STEP 4: Fetch Soil Data
  ├─→ NRCS SSURGO: Soil types, infiltration, friction angle, cohesion
  └─→ Interpret engineering properties

STEP 5: Fuse into Unified Mesh
  ├─→ DEM → mesh generator (triangulation + refinement)
  ├─→ Infrastructure → mesh features (breaklines, vertices)
  ├─→ Soil polygons → mesh cell properties (friction, cohesion, ksat)
  ├─→ Parcels → mesh metadata (ownership, zoning, land use)
  └─→ Output: High-fidelity 3D simulation mesh

STEP 6: Validate & Visualize
  ├─→ Check mesh quality (aspect ratio, edge lengths)
  ├─→ Overlay on satellite imagery (Google Imagery, USGS Ortho)
  ├─→ Export for dashboard (GeoJSON + 3D tiles)
  └─→ Ready for PTDT v23 simulation
```

---

## 🔗 Integration with PTDT v23 Core

```python
# In core/orchestrator/v23_gateway.py

from core.terrain.wth_gis_bridge import WTHGISConnector
from core.terrain.acres_plat_parser import ACRESPlatParser
from core.terrain.usgs_elevation import USGSElevationFetcher
from core.terrain.usgs_hydro import USGSHydrographyFetcher
from core.terrain.nrcs_soil_data import NRCSSoilDataFetcher
from core.terrain.local_infrastructure import LocalInfrastructureFetcher
from core.terrain.mesh_generator import UnifiedMeshGenerator

class PoseyCountyModel:
    """
    Master class that orchestrates full GIS → 3D mesh pipeline.
    """
    
    def __init__(self, study_area_bbox):
        self.bbox = study_area_bbox
        self.wth_gis = WTHGISConnector()
        self.acres = ACRESPlatParser()
        self.usgs_elev = USGSElevationFetcher(resolution_m=1)  # 1m DEM
        self.usgs_hydro = USGSHydrographyFetcher()
        self.nrcs_soil = NRCSSoilDataFetcher()
        self.infra = LocalInfrastructureFetcher()
    
    def build_complete_model(self, output_dir: str):
        """
        Orchestrate full pipeline: GIS → 3D mesh ready for v23 simulation.
        """
        
        # Step 1: Fetch all geospatial data
        print("[1/6] Fetching terrain data...")
        dem = self.usgs_elev.fetch_dem(self.bbox, f"{output_dir}/dem.tif")
        
        print("[2/6] Fetching hydrology...")
        streams = self.usgs_hydro.fetch_flowlines(self.bbox)
        wetlands = self.usgs_hydro.fetch_wetlands(self.bbox)
        flow_dir = self.usgs_hydro.fetch_flow_direction_grid(dem)
        
        print("[3/6] Fetching infrastructure...")
        roads = self.infra.fetch_roads(self.bbox)
        culverts = self.infra.fetch_culverts(self.bbox)
        levees = self.infra.fetch_levees(self.bbox)
        pumps = self.infra.fetch_pump_stations(self.bbox)
        bridges = self.infra.fetch_bridges(self.bbox)
        
        print("[4/6] Fetching cadastral data...")
        parcels = self.acres.fetch_parcel_data(self.bbox)
        zoning = self.wth_gis.fetch_zoning(self.bbox)
        buildings = self.wth_gis.fetch_building_footprints(self.bbox)
        
        print("[5/6] Fetching soil data...")
        soils = self.nrcs_soil.fetch_soil_survey(self.bbox)
        
        # Step 2: Generate unified 3D mesh
        print("[6/6] Generating unified 3D mesh...")
        mesh_generator = UnifiedMeshGenerator(dem)
        mesh_generator.add_infrastructure_breaklines(roads, culverts, levees)
        mesh_generator.add_soil_properties(soils, self.nrcs_soil)
        mesh_generator.add_parcel_metadata(parcels, buildings)
        mesh_generator.add_hydrologic_features(streams, wetlands)
        
        mesh = mesh_generator.generate_mesh()
        mesh.save(f"{output_dir}/ptdt_v23_mesh.h5")
        
        return mesh

# Usage:
if __name__ == "__main__":
    # Posey County bounding box (approximate, in WGS84)
    posey_bbox = (-87.8, 37.8, -87.4, 38.1)
    
    model = PoseyCountyModel(posey_bbox)
    mesh = model.build_complete_model("./gis_data/posey_county")
    
    print(f"\n✅ Mesh generated: {mesh.n_nodes} nodes, {mesh.n_elements} elements")
    print(f"   Terrain range: {mesh.z_min:.1f}m to {mesh.z_max:.1f}m")
    print(f"   Infrastructure: {len(mesh.culverts)} culverts, {len(mesh.levees)} levee reaches")
```

---

## 📂 Data Storage Structure

```
gis_data/
├─ raw/
│  ├─ usgs_dem_3deg_posey_county.tif          # 1m DEM
│  ├─ usgs_ned_dem_10m.tif                    # 10m backup
│  ├─ nhdplus_flowlines_posey.geojson         # Stream network
│  ├─ nhdplus_waterbodies_posey.geojson       # Lakes/reservoirs
│  ├─ nwi_wetlands_posey.geojson              # Wetlands
│  ├─ ssurgo_mupolygon_posey.geojson          # Soil polygons
│  ├─ wth_gis_export_parcels.geojson          # WTH GIS parcels
│  ├─ wth_gis_export_infrastructure.geojson   # WTH GIS roads/culverts
│  ├─ acres_parcel_data.csv                   # ACRES parcel records
│  ├─ lidar_pointcloud.laz                    # LiDAR (if available)
│  └─ metadata/
│     ├─ data_sources.txt
│     ├─ coordinate_systems.txt
│     └─ acquisition_dates.txt
│
├─ processed/
│  ├─ dem_1m_smooth.tif                       # Processed DEM
│  ├─ slope_degrees.tif
│  ├─ aspect_degrees.tif
│  ├─ flow_accumulation.tif
│  ├─ soil_properties.geojson                 # Enhanced with eng. properties
│  ├─ infrastructure_enriched.geojson         # With elevations/properties
│  └─ merged_gis_layers.geojson              # All layers combined
│
├─ mesh/
│  ├─ ptdt_v23_mesh.h5                        # Main mesh (HDF5 binary)
│  ├─ mesh_metadata.json
│  ├─ mesh_preview.geojson                    # Quick preview
│  └─ mesh_quality_report.txt
│
└─ validation/
   ├─ overlay_satellite_imagery.png           # QA overlay
   ├─ elevation_profile_checks.csv
   ├─ infrastructure_vs_ortho.txt
   └─ mesh_statistics.json
```

---

## 🎯 Data Accuracy Standards

### Target Resolution/Accuracy by Category

| Data Type | Resolution | Horizontal Accuracy | Vertical Accuracy | Source |
|-----------|-----------|-------------------|------------------|--------|
| **Terrain** | 1m grid | ±1-2m | ±0.15m (RMSE) | USGS 3DEP LiDAR |
| **Infrastructure** | Feature-level | ±1-5m | ±0.5m | WTH GIS / INDOT |
| **Soil Polygons** | ~10m grid equivalent | ±10m | N/A | NRCS SSURGO |
| **Parcels** | Boundary accuracy | ±2-10m | N/A | County/ACRES |
| **Streams** | 10m width | ±10-30m | ±0.5m | USGS NHD+ |
| **Buildings** | Feature-level | ±3-5m | ±1m | WTH GIS / Orthoimagery |

### Quality Assurance

1. **Overlay on Satellite Imagery**: Compare against Google Imagery, USGS Orthophoto
2. **Ground Truth Verification**: Spot-check key features (levee crest, pump location)
3. **Mesh Quality Checks**: Aspect ratio, edge lengths, element distortion
4. **Vertical Profile Validation**: Compare modeled cross-sections to survey data
5. **Infrastructure Spot Checks**: Verify culvert dimensions, levee heights, pump capacity

---

## 🚀 Implementation Roadmap

### Phase 1: Core Data Fetchers (Week 1-2)
- [ ] WTH GIS connector
- [ ] ACRES plat parser
- [ ] USGS elevation fetcher
- [ ] USGS hydrology fetcher

### Phase 2: Soil & Local Data (Week 2-3)
- [ ] NRCS soil data integration
- [ ] Local infrastructure fetcher
- [ ] LiDAR processor (if data available)

### Phase 3: Mesh Generation (Week 3-4)
- [ ] Unified mesh generator
- [ ] Infrastructure breakline insertion
- [ ] Soil property assignment
- [ ] Mesh quality optimization

### Phase 4: Integration & QA (Week 4-5)
- [ ] Integration with PTDT v23 core
- [ ] Quality assurance / validation
- [ ] Documentation & examples
- [ ] Performance optimization

---

## 📋 Data Sources & APIs

### WTH GIS (Posey County)
- **URL**: https://poseyin.wthgis.com
- **Data**: Parcels, roads, infrastructure, zoning
- **Access**: WMS/WFS (if available), or manual export

### ACRES Plat Map
- **URL**: https://www.acres.com/plat-map/map/in/posey-county-in
- **Data**: Parcel boundaries, ownership, lot descriptions
- **Access**: Web scraping or API (if available)

### USGS Elevation (NED/3DEP)
- **URL**: https://cloud.sdsc.edu/v1/AUTH_opentopography/Raster/NASADEM_HGT/NASADEM_HGT_srtm/NASADEM_HGT_srtm_srtm.zip
- **Data**: 1m DEM (3DEP), 10m DEM (NED legacy)
- **Access**: OpenTopography API, AWS S3, USGS

### USGS National Hydrography Dataset (NHD)
- **URL**: https://www.usgs.gov/programs/vhp/NHD_High_Resolution
- **Data**: Flowlines, waterbodies, wetlands
- **Access**: NHDPlus API, WMS, direct download

### NRCS SSURGO Soil Data
- **URL**: https://websoilsurvey.sc.egov.usda.gov/
- **Data**: Soil type, properties, infiltration
- **Access**: Web Soil Survey, NRCS FTP, AWS Harmonized SSURGO

### Indiana DOT (INDOT)
- **URL**: https://www.in.gov/indot/
- **Data**: State road network, bridge inventory
- **Access**: Contact INDOT, GIS data portal

### Posey County GIS (if available)
- **Contact**: Posey County Engineering/GIS office
- **Data**: Local infrastructure, utilities
- **Format**: Shapefile, GeoJSON, GeoTIFF

---

## 🔍 Validation Checklist

Before mesh is ready for PTDT v23 simulation:

- [ ] DEM matches satellite orthoimagery elevation cues
- [ ] Stream network aligns with NHD+ flowlines
- [ ] Infrastructure positions verified against ortho imagery
- [ ] Soil polygon boundaries match SSURGO
- [ ] Parcel boundaries match county records
- [ ] Culvert dimensions verified with as-built drawings
- [ ] Levee centerlines and profiles verified
- [ ] Pump locations verified with field inspection
- [ ] Building footprints match ortho imagery
- [ ] Mesh element quality acceptable (aspect ratio <20:1)
- [ ] Vertical datum consistent (NAD83, NAVD88)
- [ ] Coordinate system correct (UTM Zone 16N or projection)

---

## 📞 Next Steps

1. **Export GIS data** from WTH GIS and ACRES into standardized formats
2. **Create credentials/API access** for USGS, NRCS data sources
3. **Begin implementation** of data fetcher modules
4. **Start mesh generation** pipeline
5. **Validate** against ground truth and satellite imagery

**This GIS pipeline ensures PTDT v23 is built on real, accurate Point Township data — not simulated or approximated terrain.**

---

**Status**: 📐 **ARCHITECTURE READY** | Ready for GIS data export and fetcher implementation
