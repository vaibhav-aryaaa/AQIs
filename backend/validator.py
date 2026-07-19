from math import radians, cos, sin, asin, sqrt
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from db import SensorNode, SensorTelemetry

# Pydantic Schema for incoming telemetry
class TelemetrySchema(BaseModel):
    node_id: int = Field(..., description="ID of the sensor node")
    pm25: float = Field(..., ge=0, description="PM2.5 value in ug/m3")
    pm10: float = Field(..., ge=0, description="PM10 value in ug/m3")
    co: float = Field(..., ge=0, description="Carbon Monoxide value in mg/m3")
    aqi: float = Field(..., ge=0, description="Calculated overall Air Quality Index")

# Haversine distance calculator
def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def validate_spatial_consistency(db: Session, node_id: int, candidate_aqi: float, candidate_co: float) -> tuple[bool, str]:
    """
    Validates if the node's reading is consistent with its geographical neighbors within a 2 km radius.
    Flags as anomaly if the candidate reading deviates by more than 3 standard deviations (or absolute limits).
    """
    # 1. Fetch current node
    node = db.query(SensorNode).filter(SensorNode.id == node_id).first()
    if not node:
        return False, "Node ID not found"

    # Absolute bounds sanity check (to catch extreme outliers immediately)
    if candidate_aqi > 800.0:
        return False, f"AQI {candidate_aqi} exceeds absolute physical limit (800)"
    if candidate_co > 50.0:
        return False, f"CO reading {candidate_co} mg/m3 exceeds absolute physical limit (50)"

    # 2. Find neighbors within 2 km
    all_nodes = db.query(SensorNode).filter(SensorNode.id != node_id).all()
    neighbors = []
    for other in all_nodes:
        dist = haversine(node.longitude, node.latitude, other.longitude, other.latitude)
        if dist <= 2.0:
            neighbors.append(other)

    # 3. If there are neighbors, check their latest readings (last 60 mins)
    if len(neighbors) >= 2:
        neighbor_ids = [n.id for n in neighbors]
        time_limit = datetime.utcnow() - timedelta(minutes=60)
        
        # Get latest reading for each neighbor
        neighbor_readings = []
        for n_id in neighbor_ids:
            latest = db.query(SensorTelemetry)\
                       .filter(SensorTelemetry.node_id == n_id)\
                       .order_by(SensorTelemetry.timestamp.desc())\
                       .first()
            if latest and latest.timestamp >= time_limit:
                neighbor_readings.append(latest.aqi)

        # 4. Run standard deviation check if we have enough active readings
        if len(neighbor_readings) >= 2:
            import numpy as np
            mean_aqi = np.mean(neighbor_readings)
            std_aqi = np.std(neighbor_readings)
            
            # Use a minimum standard deviation of 15 to avoid false flags when neighbors are perfectly quiet
            threshold_std = max(std_aqi, 15.0)
            deviation = abs(candidate_aqi - mean_aqi)
            
            if deviation > 3 * threshold_std:
                return False, f"Spatial anomaly detected. Node AQI is {candidate_aqi}, but neighbors average {mean_aqi:.2f} (std={threshold_std:.2f}). Deviation is {deviation:.2f} (>3σ)."

    return True, "Valid"
