import logging
from typing import List
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import SessionLocal, init_db, SensorNode, SensorTelemetry, TelemetryAnomaly, AlertTicket
from validator import TelemetrySchema, validate_spatial_consistency
from predictor import run_aqi_forecast

# Setup Production Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("SmartAQI")

app = FastAPI(title="SmartAQI Backend Application", version="1.0.0")

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected to WebSocket. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected from WebSocket. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting WebSocket message: {message}")
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket client: {e}")

manager = ConnectionManager()

# Initialize SQLite database schema on startup
@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("Database schema initialized and seed verified.")

# DB Dependency helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Listen to incoming messages (keeps socket alive)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/telemetry", status_code=status.HTTP_201_CREATED)
async def ingest_telemetry(payload: TelemetrySchema, db: Session = Depends(get_db)):
    logger.info(f"Received telemetry payload for Node {payload.node_id}: AQI={payload.aqi}, CO={payload.co}")

    # 1. Verify node exists
    node = db.query(SensorNode).filter(SensorNode.id == payload.node_id).first()
    if not node:
        logger.warning(f"Ingestion rejected: Sensor node {payload.node_id} does not exist.")
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
        
        logger.warning(f"Telemetry quarantine: Anomaly detected on Node {payload.node_id}. Reason: {validation_msg}")

        # Broadcast anomaly over WebSockets
        await manager.broadcast({
            "type": "anomaly",
            "data": {
                "node_id": payload.node_id,
                "area_name": node.area_name,
                "pm25": payload.pm25,
                "pm10": payload.pm10,
                "co": payload.co,
                "aqi": payload.aqi,
                "reason": validation_msg,
                "timestamp": anomaly_record.timestamp.isoformat()
            }
        })

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
    
    logger.info(f"Telemetry ingested successfully for Node {payload.node_id}.")

    # Broadcast clean telemetry reading over WebSockets
    await manager.broadcast({
        "type": "telemetry",
        "data": {
            "node_id": payload.node_id,
            "area_name": node.area_name,
            "pm25": payload.pm25,
            "pm10": payload.pm10,
            "co": payload.co,
            "aqi": payload.aqi,
            "timestamp": telemetry_record.timestamp.isoformat()
        }
    })
    
    return {
        "status": "success",
        "message": "Telemetry reading successfully ingested and stored."
    }

@app.get("/api/nodes")
def get_nodes(db: Session = Depends(get_db)):
    return db.query(SensorNode).all()

@app.get("/api/telemetry/current")
def get_current_telemetry(db: Session = Depends(get_db)):
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
async def get_node_forecast(node_id: int, db: Session = Depends(get_db)):
    node = db.query(SensorNode).filter(SensorNode.id == node_id).first()
    if not node:
        logger.warning(f"Forecast rejected: Sensor node {node_id} does not exist.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor node with ID {node_id} does not exist"
        )
    
    # Track ticket database size before running forecast to identify if a new ticket is generated
    pre_ticket_count = db.query(AlertTicket).count()
    
    forecasted_aqi = run_aqi_forecast(db, node_id)
    
    # Broadcast new ticket if generated during forecast logic
    post_tickets = db.query(AlertTicket).order_by(AlertTicket.id.desc()).all()
    if len(post_tickets) > pre_ticket_count:
        new_ticket = post_tickets[0]
        logger.info(f"Broadcasting new GRAP Alert Ticket: {new_ticket.message}")
        await manager.broadcast({
            "type": "ticket",
            "data": {
                "id": new_ticket.id,
                "node_id": new_ticket.node_id,
                "severity": new_ticket.severity,
                "message": new_ticket.message,
                "status": new_ticket.status,
                "timestamp": new_ticket.timestamp.isoformat()
            }
        })
        
    return {
        "node_id": node_id,
        "area_name": node.area_name,
        "forecasted_aqi": forecasted_aqi,
        "forecast_timestamp": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }
