from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from db import SessionLocal, init_db, SensorNode, SensorTelemetry, TelemetryAnomaly, AlertTicket
from validator import TelemetrySchema, validate_spatial_consistency
from predictor import run_aqi_forecast

app = FastAPI(title="SmartAQI Backend Application", version="1.0.0")

# Initialize SQLite database schema on startup
@app.on_event("startup")
def startup_event():
    init_db()

# DB Dependency helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/telemetry", status_code=status.HTTP_201_CREATED)
def ingest_telemetry(payload: TelemetrySchema, db: Session = Depends(get_db)):
    # 1. Verify node exists
    node = db.query(SensorNode).filter(SensorNode.id == payload.node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Sensor node with id {payload.node_id} does not exist"
        )

    # 2. Run Spatial consistency checks
    is_valid, validation_msg = validate_spatial_consistency(
        db, payload.node_id, payload.aqi, payload.co
    )

    if not is_valid:
        # Save to TelemetryAnomaly table (quarantined)
        anomaly_record = TelemetryAnomaly(
            node_id=payload.node_id,
            pm25=payload.pm25,
            pm10=payload.pm10,
            co=payload.co,
            aqi=payload.aqi,
            reason=validation_msg,
            timestamp=datetime.utcnow()
        )
        db.add(anomaly_record)
        db.commit()
        return {
            "status": "quarantined",
            "message": f"Telemetry anomaly detected & logged: {validation_msg}"
        }

    # 3. Save to clean SensorTelemetry table
    telemetry_record = SensorTelemetry(
        node_id=payload.node_id,
        pm25=payload.pm25,
        pm10=payload.pm10,
        co=payload.co,
        aqi=payload.aqi,
        timestamp=datetime.utcnow()
    )
    db.add(telemetry_record)
    db.commit()
    
    return {
        "status": "success",
        "message": "Telemetry reading successfully ingested and stored."
    }

@app.get("/api/nodes")
def get_nodes(db: Session = Depends(get_db)):
    return db.query(SensorNode).all()

@app.get("/api/telemetry/current")
def get_current_telemetry(db: Session = Depends(get_db)):
    """
    Returns the latest clean telemetry entry for each monitoring node.
    """
    nodes = db.query(SensorNode).all()
    current_data = []
    
    for node in nodes:
        latest = db.query(SensorTelemetry)\
                   .filter(SensorTelemetry.node_id == node.id)\
                   .order_by(SensorTelemetry.timestamp.desc())\
                   .first()
        if latest:
            current_data.append({
                "node_id": node.id,
                "area_name": node.area_name,
                "latitude": node.latitude,
                "longitude": node.longitude,
                "pm25": latest.pm25,
                "pm10": latest.pm10,
                "co": latest.co,
                "aqi": latest.aqi,
                "timestamp": latest.timestamp
            })
        else:
            current_data.append({
                "node_id": node.id,
                "area_name": node.area_name,
                "latitude": node.latitude,
                "longitude": node.longitude,
                "pm25": None,
                "pm10": None,
                "co": None,
                "aqi": None,
                "timestamp": None
            })
            
    return current_data

@app.get("/api/tickets")
def get_tickets(db: Session = Depends(get_db)):
    return db.query(AlertTicket).order_by(AlertTicket.timestamp.desc()).all()

@app.get("/api/forecast/{node_id}")
def get_node_forecast(node_id: int, db: Session = Depends(get_db)):
    node = db.query(SensorNode).filter(SensorNode.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor node with ID {node_id} does not exist"
        )
    forecasted_aqi = run_aqi_forecast(db, node_id)
    return {
        "node_id": node_id,
        "area_name": node.area_name,
        "forecasted_aqi": forecasted_aqi,
        "forecast_timestamp": datetime.utcnow() + timedelta(hours=24)
    }
