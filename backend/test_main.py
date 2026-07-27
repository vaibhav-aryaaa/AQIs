import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db import Base, SensorNode, SensorTelemetry, TelemetryAnomaly, AlertTicket, SystemSettings
from main import app, get_db

# Set up an in-memory SQLite database for test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency to point to the test db
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    # Create tables before each test
    Base.metadata.create_all(bind=engine)
    
    # Seed nodes for test database
    db = TestingSessionLocal()
    if db.query(SensorNode).count() == 0:
        db.bulk_save_objects([
            SensorNode(id=1, latitude=28.6139, longitude=77.2090, area_name="Connaught Place"),
            SensorNode(id=2, latitude=28.5750, longitude=77.2100, area_name="R.K. Puram"),
            SensorNode(id=3, latitude=28.5921, longitude=77.0463, area_name="Dwarka"),
        ])
        db.commit()
    db.close()
    
    yield
    
    # Drop tables after each test to ensure clean isolations
    Base.metadata.drop_all(bind=engine)

def test_get_nodes():
    response = client.get("/api/nodes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert data[0]["area_name"] == "Connaught Place"

def test_ingest_telemetry_valid():
    payload = {
        "node_id": 1,
        "pm25": 45.0,
        "pm10": 80.0,
        "co": 1.1,
        "aqi": 65.0
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"

def test_ingest_telemetry_invalid_node():
    payload = {
        "node_id": 999, # Nonexistent node ID
        "pm25": 45.0,
        "pm10": 80.0,
        "co": 1.1,
        "aqi": 65.0
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 404

def test_ingest_telemetry_negative_values():
    payload = {
        "node_id": 1,
        "pm25": -5.0, # Negative validation failure
        "pm10": 80.0,
        "co": 1.1,
        "aqi": 65.0
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 422

def test_spatial_anomaly_quarantine():
    # 1. Seed nodes 2 and 3 with low AQI readings to establish neighbor baselines
    db = TestingSessionLocal()
    now = datetime.utcnow()
    db.bulk_save_objects([
        SensorTelemetry(node_id=2, pm25=30.0, pm10=60.0, co=0.8, aqi=50.0, timestamp=now),
        SensorTelemetry(node_id=3, pm25=32.0, pm10=65.0, co=0.9, aqi=52.0, timestamp=now)
    ])
    db.commit()
    db.close()

    # 2. Ingest an extreme outlier (AQI = 750) on Node 1 (adjacent to nodes 2 & 3 within 2km)
    payload = {
        "node_id": 1,
        "pm25": 600.0,
        "pm10": 1100.0,
        "co": 95.0, # Exceeds absolute CO threshold of 50
        "aqi": 750.0
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    
    # Verify server quarantines the anomalous readings
    assert data["status"] == "quarantined"
    assert "anomaly detected" in data["message"].lower()

def test_get_current_telemetry():
    # Seed one clean telemetry log
    db = TestingSessionLocal()
    db.add(SensorTelemetry(node_id=1, pm25=30.0, pm10=60.0, co=0.8, aqi=50.0, timestamp=datetime.utcnow()))
    db.commit()
    db.close()

    response = client.get("/api/telemetry/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    node1_data = next(item for item in data if item["node_id"] == 1)
    assert node1_data["aqi"] == 50.0

def test_get_tickets():
    # Seed an alert ticket
    db = TestingSessionLocal()
    db.add(AlertTicket(node_id=1, severity="Poor", message="Test warning details", status="Open", timestamp=datetime.utcnow()))
    db.commit()
    db.close()

    response = client.get("/api/tickets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["message"] == "Test warning details"

def test_settings_endpoints():
    # Test GET settings default value
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "telegram_bot_token" in data
    assert data["alert_threshold_aqi"] == 150.0

    # Test POST settings
    payload = {
        "telegram_bot_token": "test_token_123",
        "telegram_chat_id": "test_chat_456",
        "alert_threshold_aqi": 180.0
    }
    post_res = client.post("/api/settings", json=payload)
    assert post_res.status_code == 200
    
    # Verify values are updated
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    updated_data = get_res.json()
    assert updated_data["telegram_bot_token"] == "test_token_123"
    assert updated_data["telegram_chat_id"] == "test_chat_456"
    assert updated_data["alert_threshold_aqi"] == 180.0
