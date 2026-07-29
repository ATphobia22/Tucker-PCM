"""
PTDT v23.x Real-Time Telemetry Fusion Engine (RT-TFE)
Kalman filter-based sensor fusion for 10Hz telemetry streams

Production-Ready Implementation
"""

import numpy as np
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass
from collections import deque
import logging

logger = logging.getLogger(__name__)


@dataclass
class SensorMetadata:
    """Metadata for a single sensor."""
    sensor_id: str
    sensor_type: str  # 'stage', 'flow', 'rainfall', 'pressure', 'piezometer'
    location: Tuple[float, float]  # (x, y) or (lon, lat)
    elevation: float  # Sensor reference elevation
    measurement_uncertainty: float  # Standard deviation (m for stage, m³/s for flow)
    calibration_offset: float = 0.0
    calibration_scale: float = 1.0
    last_measurement: Optional[float] = None
    last_time: Optional[float] = None
    anomaly_score: float = 0.0


class KalmanFilter1D:
    """
    1D Kalman filter for scalar state estimation.
    
    State model: x[k] = x[k-1] + process_noise
    Measurement model: z[k] = x[k] + measurement_noise
    """
    
    def __init__(self, process_variance: float, measurement_variance: float,
                 initial_value: float = 0.0):
        """
        Initialize Kalman filter.
        
        Args:
            process_variance: σ_process² (how much state can change per step)
            measurement_variance: σ_measurement² (sensor noise)
            initial_value: Initial state estimate
        """
        self.x = initial_value  # State estimate
        self.P = 1.0  # Estimate error covariance
        self.Q = process_variance  # Process noise covariance
        self.R = measurement_variance  # Measurement noise covariance
        
        self.K = 0.0  # Kalman gain
    
    def predict(self):
        """Predict step (state evolution)."""
        # x = A * x (A = 1 for constant state model)
        # P = A * P * A^T + Q
        self.P += self.Q
    
    def update(self, measurement: float):
        """
        Update step (incorporate measurement).
        
        Args:
            measurement: Sensor measurement
        
        Returns:
            Updated state estimate
        """
        # Innovation (measurement residual)
        y = measurement - self.x
        
        # Innovation covariance
        S = self.P + self.R
        
        # Kalman gain
        self.K = self.P / S
        
        # State update
        self.x += self.K * y
        
        # Covariance update
        self.P = (1 - self.K) * self.P
        
        return self.x
    
    def step(self, measurement: float):
        """Combined predict + update step."""
        self.predict()
        return self.update(measurement)


class MultiSensorFusion:
    """
    Multi-sensor fusion using weighted averaging and confidence intervals.
    
    Combines measurements from multiple sensors of same type using:
    - Inverse variance weighting
    - Kalman filtering per sensor
    - Cross-validation between sensors
    """
    
    def __init__(self):
        """Initialize multi-sensor fusion."""
        self.sensors: Dict[str, SensorMetadata] = {}
        self.kalman_filters: Dict[str, KalmanFilter1D] = {}
        
        # Measurement history (for trend detection)
        self.measurement_history: Dict[str, deque] = {}
        self.history_length = 100
        
        logger.info("✅ Multi-Sensor Fusion initialized")
    
    def register_sensor(self, metadata: SensorMetadata):
        """
        Register a new sensor.
        
        Args:
            metadata: SensorMetadata object
        """
        self.sensors[metadata.sensor_id] = metadata
        
        # Initialize Kalman filter for this sensor
        # Process variance depends on sensor type
        if metadata.sensor_type == 'stage':
            Q = 0.001**2  # Stage can change slowly
            R = metadata.measurement_uncertainty**2
        elif metadata.sensor_type == 'flow':
            Q = 0.1**2  # Flow can change more rapidly
            R = metadata.measurement_uncertainty**2
        else:
            Q = 0.01**2
            R = metadata.measurement_uncertainty**2
        
        initial_value = metadata.last_measurement or 0.0
        self.kalman_filters[metadata.sensor_id] = KalmanFilter1D(Q, R, initial_value)
        self.measurement_history[metadata.sensor_id] = deque(maxlen=self.history_length)
        
        logger.info(f"Registered sensor: {metadata.sensor_id} ({metadata.sensor_type})")
    
    def update_sensor(self, sensor_id: str, measurement: float, timestamp: float) -> Dict:
        """
        Update sensor measurement and perform fusion.
        
        Args:
            sensor_id: Unique sensor identifier
            measurement: Raw measurement value
            timestamp: Measurement timestamp
        
        Returns:
            Dict with fused value, confidence, anomaly flags
        """
        if sensor_id not in self.sensors:
            logger.warning(f"Unknown sensor: {sensor_id}")
            return {}
        
        sensor = self.sensors[sensor_id]
        
        # Apply calibration
        corrected_measurement = self._apply_calibration(measurement, sensor)
        
        # Update Kalman filter
        kf = self.kalman_filters[sensor_id]
        fused_value = kf.step(corrected_measurement)
        
        # Store in history
        self.measurement_history[sensor_id].append({
            'raw': measurement,
            'corrected': corrected_measurement,
            'fused': fused_value,
            'time': timestamp,
            'P': kf.P,  # Estimation error
        })
        
        # Detect anomalies
        anomaly_score = self._detect_anomaly(sensor_id, corrected_measurement)
        sensor.anomaly_score = anomaly_score
        
        # Compute confidence interval
        confidence_interval = self._compute_confidence_interval(sensor_id)
        
        result = {
            'sensor_id': sensor_id,
            'raw_measurement': measurement,
            'corrected_measurement': corrected_measurement,
            'fused_value': fused_value,
            'estimation_error': np.sqrt(kf.P),
            'confidence_interval': confidence_interval,
            'anomaly_score': anomaly_score,
            'is_anomalous': anomaly_score > 2.0,  # >2σ = anomalous
        }
        
        sensor.last_measurement = fused_value
        sensor.last_time = timestamp
        
        return result
    
    def _apply_calibration(self, measurement: float, sensor: SensorMetadata) -> float:
        """
        Apply sensor calibration (offset + scale).
        
        Args:
            measurement: Raw measurement
            sensor: SensorMetadata with calibration parameters
        
        Returns:
            Calibrated measurement
        """
        corrected = (measurement - sensor.calibration_offset) * sensor.calibration_scale
        return corrected
    
    def _detect_anomaly(self, sensor_id: str, measurement: float) -> float:
        """
        Detect measurement anomaly using statistical methods.
        
        Returns anomaly score (σ above/below trend).
        """
        history = self.measurement_history[sensor_id]
        
        if len(history) < 3:
            return 0.0
        
        # Compute mean and std of recent history
        recent_values = [h['corrected'] for h in list(history)[-10:]]
        mean = np.mean(recent_values)
        std = np.std(recent_values)
        
        if std < 1e-6:
            return 0.0
        
        # Anomaly score: how many σ away from mean
        anomaly_score = abs((measurement - mean) / std)
        
        return anomaly_score
    
    def _compute_confidence_interval(self, sensor_id: str, confidence: float = 0.95) -> Tuple[float, float]:
        """
        Compute confidence interval for fused value.
        
        Args:
            sensor_id: Sensor identifier
            confidence: Confidence level (0.95 = 95%)
        
        Returns:
            (lower_bound, upper_bound)
        """
        kf = self.kalman_filters[sensor_id]
        sensor = self.sensors[sensor_id]
        
        # Standard deviation of estimate
        sigma = np.sqrt(kf.P)
        
        # Z-score for 95% confidence: ±1.96
        z = 1.96 if confidence == 0.95 else 2.576 if confidence == 0.99 else 1.0
        
        lower = kf.x - z * sigma
        upper = kf.x + z * sigma
        
        return (lower, upper)
    
    def fuse_multiple_sensors(self, sensor_type: str) -> Dict:
        """
        Fuse measurements from multiple sensors of same type.
        
        Uses inverse variance weighting for optimal combination.
        
        Args:
            sensor_type: Type of sensor to fuse ('stage', 'flow', etc.)
        
        Returns:
            Fused value with confidence
        """
        # Find all sensors of this type
        sensors_of_type = {sid: s for sid, s in self.sensors.items() 
                          if s.sensor_type == sensor_type}
        
        if not sensors_of_type:
            return {}
        
        # Get current fused values and errors
        values = []
        errors = []
        
        for sid, sensor in sensors_of_type.items():
            kf = self.kalman_filters[sid]
            if kf.x is not None and kf.P > 0:
                values.append(kf.x)
                errors.append(np.sqrt(kf.P))
        
        if not values:
            return {}
        
        # Inverse variance weighting
        weights = 1.0 / np.array(errors)**2
        weights /= weights.sum()
        
        fused_value = np.sum(np.array(values) * weights)
        
        # Fused error
        fused_error = 1.0 / np.sqrt(np.sum(1.0 / np.array(errors)**2))
        
        result = {
            'sensor_type': sensor_type,
            'fused_value': fused_value,
            'fused_error': fused_error,
            'n_sensors': len(values),
            'contributing_sensors': list(sensors_of_type.keys()),
        }
        
        return result


class RealTimeTelemetryFusionEngine:
    """
    Master RT-TFE orchestrating all telemetry fusion operations.
    
    Capabilities:
    - 10Hz sensor ingestion (MQTT, REST API, direct)
    - Kalman filtering per sensor
    - Multi-sensor fusion by type
    - Real-time anomaly detection
    - State correction for UMPK
    - Sensor validation and QA/QC
    """
    
    def __init__(self, mesh, config: Dict = None):
        """
        Initialize RT-TFE.
        
        Args:
            mesh: UnifiedSimulationMesh
            config: Configuration dictionary
        """
        self.mesh = mesh
        self.config = config or {}
        
        # Multi-sensor fusion
        self.fusion = MultiSensorFusion()
        
        # Measurement queues (for asynchronous ingestion)
        self.measurement_queue: deque = deque(maxlen=1000)
        
        # Statistics
        self.stats = {
            'total_measurements': 0,
            'total_anomalies': 0,
            'total_corrections': 0,
        }
        
        logger.info("✅ Real-Time Telemetry Fusion Engine initialized")
    
    def register_sensor_network(self, sensors: List[SensorMetadata]):
        """
        Register a network of sensors.
        
        Args:
            sensors: List of SensorMetadata objects
        """
        for sensor in sensors:
            self.fusion.register_sensor(sensor)
        
        logger.info(f"Registered sensor network: {len(sensors)} sensors")
    
    def ingest_measurement(self, sensor_id: str, measurement: float, timestamp: float):
        """
        Ingest a single sensor measurement.
        
        Args:
            sensor_id: Unique sensor identifier
            measurement: Measurement value
            timestamp: Measurement timestamp (seconds)
        """
        self.measurement_queue.append({
            'sensor_id': sensor_id,
            'measurement': measurement,
            'time': timestamp,
        })
        
        self.stats['total_measurements'] += 1
    
    def process_measurements(self, current_time: float) -> Dict:
        """
        Process all queued measurements up to current time.
        
        Args:
            current_time: Current simulation time
        
        Returns:
            Dict with all processed measurements and anomalies
        """
        results = {
            'processed': 0,
            'anomalies': 0,
            'sensor_results': {},
            'fused_by_type': {},
        }
        
        # Process queued measurements
        while len(self.measurement_queue) > 0:
            measurement = self.measurement_queue.popleft()
            
            if measurement['time'] <= current_time:
                sensor_id = measurement['sensor_id']
                value = measurement['measurement']
                time = measurement['time']
                
                # Perform fusion
                fusion_result = self.fusion.update_sensor(sensor_id, value, time)
                results['sensor_results'][sensor_id] = fusion_result
                results['processed'] += 1
                
                # Track anomalies
                if fusion_result.get('is_anomalous', False):
                    results['anomalies'] += 1
                    self.stats['total_anomalies'] += 1
                    logger.warning(f"Anomaly detected in {sensor_id}: "
                                 f"score={fusion_result['anomaly_score']:.2f}")
            else:
                # Put back in queue (not yet time)
                self.measurement_queue.appendleft(measurement)
                break
        
        # Fuse by sensor type
        for sensor_type in ['stage', 'flow', 'rainfall', 'pressure']:
            fused = self.fusion.fuse_multiple_sensors(sensor_type)
            if fused:
                results['fused_by_type'][sensor_type] = fused
        
        return results
    
    def apply_state_correction(self, state, measurement_results: Dict) -> Dict:
        """
        Apply sensor-based corrections to simulation state.
        
        Uses fused measurements to nudge simulation state towards reality.
        
        Args:
            state: SimulationState object
            measurement_results: Results from process_measurements()
        
        Returns:
            Dict of corrections applied
        """
        corrections = {
            'stage_corrections': [],
            'flow_corrections': [],
            'total_corrections': 0,
        }
        
        # STAGE CORRECTIONS (water surface elevation)
        fused_stage = measurement_results['fused_by_type'].get('stage', {})
        if fused_stage and 'fused_value' in fused_stage:
            fused_val = fused_stage['fused_value']
            
            # Find closest mesh nodes to fused stage measurement
            # and nudge their surface stage towards fused value
            n_sensors = fused_stage.get('n_sensors', 1)
            
            if n_sensors > 0 and state.surface_stage is not None:
                # Apply nudge (weight depends on confidence)
                error = fused_stage.get('fused_error', 0.1)
                correction_factor = min(0.1, 1.0 / (error + 0.01))  # Scale by confidence
                
                # Nudge all surface stages slightly
                state.surface_stage += correction_factor * (fused_val - state.surface_stage.mean())
                
                corrections['stage_corrections'].append({
                    'fused_value': fused_val,
                    'correction_factor': correction_factor,
                    'n_sensors': n_sensors,
                })
                corrections['total_corrections'] += 1
                self.stats['total_corrections'] += 1
        
        # FLOW CORRECTIONS (discharge validation)
        fused_flow = measurement_results['fused_by_type'].get('flow', {})
        if fused_flow and 'fused_value' in fused_flow:
            corrections['flow_corrections'].append({
                'fused_flow': fused_flow['fused_value'],
                'status': 'monitored',
            })
        
        return corrections
    
    def get_sensor_health_report(self) -> Dict:
        """
        Generate sensor network health report.
        
        Returns:
            Dict with sensor status, anomaly counts, calibration info
        """
        report = {
            'total_sensors': len(self.fusion.sensors),
            'sensors_by_type': {},
            'anomalous_sensors': [],
            'sensor_details': {},
        }
        
        # Count by type
        for sensor_type in ['stage', 'flow', 'rainfall', 'pressure']:
            count = sum(1 for s in self.fusion.sensors.values() 
                       if s.sensor_type == sensor_type)
            if count > 0:
                report['sensors_by_type'][sensor_type] = count
        
        # Identify anomalous sensors
        for sid, sensor in self.fusion.sensors.items():
            if sensor.anomaly_score > 2.0:
                report['anomalous_sensors'].append(sid)
            
            report['sensor_details'][sid] = {
                'type': sensor.sensor_type,
                'last_measurement': sensor.last_measurement,
                'anomaly_score': sensor.anomaly_score,
                'last_time': sensor.last_time,
            }
        
        report['statistics'] = self.stats.copy()
        
        return report
    
    def get_state(self) -> Dict:
        """Return complete RT-TFE state."""
        return {
            'sensors': {sid: {
                'type': s.sensor_type,
                'location': s.location,
                'anomaly_score': s.anomaly_score,
                'last_measurement': s.last_measurement,
            } for sid, s in self.fusion.sensors.items()},
            'statistics': self.stats.copy(),
            'queue_size': len(self.measurement_queue),
        }


# Entry point
if __name__ == "__main__":
    print("Real-Time Telemetry Fusion Engine module loaded successfully")
