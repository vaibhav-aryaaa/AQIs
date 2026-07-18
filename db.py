import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Setup SQLite Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///smartaqi.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SensorNode(Base):
    __tablename__ = "sensor_nodes"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_name = Column(String, nullable=False, unique=True)

    telemetry = relationship("SensorTelemetry", back_populates="node", cascade="all, delete-orphan")
    anomalies = relationship("TelemetryAnomaly", back_populates="node", cascade="all, delete-orphan")
    tickets = relationship("AlertTicket", back_populates="node", cascade="all, delete-orphan")

class SensorTelemetry(Base):
    __tablename__ = "sensor_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("sensor_nodes.id"), nullable=False)
    pm25 = Column(Float, nullable=False)
    pm10 = Column(Float, nullable=False)
    co = Column(Float, nullable=False)
    aqi = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    node = relationship("SensorNode", back_populates="telemetry")

class TelemetryAnomaly(Base):
    __tablename__ = "telemetry_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("sensor_nodes.id"), nullable=False)
    pm25 = Column(Float, nullable=False)
    pm10 = Column(Float, nullable=False)
    co = Column(Float, nullable=False)
    aqi = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    node = relationship("SensorNode", back_populates="anomalies")

class AlertTicket(Base):
    __tablename__ = "alert_tickets"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("sensor_nodes.id"), nullable=False)
    severity = Column(String, nullable=False)  # e.g., Moderate, Poor, Severe
    message = Column(String, nullable=False)   # Actionable advice / ticket details
    status = Column(String, default="Open")    # Open, In-Progress, Resolved
    timestamp = Column(DateTime, default=datetime.utcnow)

    node = relationship("SensorNode", back_populates="tickets")

# Initialize DB and Seed Default Nodes
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if nodes exist, if not seed them
        if db.query(SensorNode).count() == 0:
            default_nodes = [
                SensorNode(latitude=28.6139, longitude=77.2090, area_name="Connaught Place"),
                SensorNode(latitude=28.5750, longitude=77.2100, area_name="R.K. Puram"),
                SensorNode(latitude=28.5921, longitude=77.0463, area_name="Dwarka"),
                SensorNode(latitude=28.6280, longitude=77.3700, area_name="Noida Sector 62"),
                SensorNode(latitude=28.4595, longitude=77.0266, area_name="Gurugram Sector 29"),
                SensorNode(latitude=28.6990, longitude=77.1384, area_name="Rohini"),
                SensorNode(latitude=28.5450, longitude=77.2710, area_name="Okhla"),
                SensorNode(latitude=28.6517, longitude=77.1408, area_name="Punjabi Bagh"),
                SensorNode(latitude=28.6304, longitude=77.2177, area_name="Mandir Marg"),
                SensorNode(latitude=28.5300, longitude=77.1800, area_name="Mehrauli"),
            ]
            db.bulk_save_objects(default_nodes)
            db.commit()
            print("Database seeded with default Delhi-NCR monitoring nodes.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
