import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

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

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    telegram_bot_token = Column(String, default="")
    telegram_chat_id = Column(String, default="")
    alert_threshold_aqi = Column(Float, default=150.0)


# Initialize DB and Seed Default Nodes
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if nodes exist, if less than 30 we upgrade to full Delhi-NCR grid
        existing_count = db.query(SensorNode).count()
        if existing_count < 30:
            if existing_count > 0:
                print("Upgrading database: reseeding with full Delhi-NCR monitoring grid...")
                db.query(SensorTelemetry).delete()
                db.query(TelemetryAnomaly).delete()
                db.query(AlertTicket).delete()
                db.query(SensorNode).delete()
                db.commit()

            default_nodes = [
                SensorNode(latitude=28.6139, longitude=77.2090, area_name="Connaught Place"),
                SensorNode(latitude=28.5750, longitude=77.2100, area_name="R.K. Puram"),
                SensorNode(latitude=28.5710, longitude=77.0710, area_name="Dwarka Sector 8"),
                SensorNode(latitude=28.6280, longitude=77.3700, area_name="Noida Sector 62"),
                SensorNode(latitude=28.4275, longitude=77.0656, area_name="Gurugram Sector 51"),
                SensorNode(latitude=28.7324, longitude=77.1199, area_name="Rohini Sector 16"),
                SensorNode(latitude=28.5450, longitude=77.2710, area_name="Okhla Phase 2"),
                SensorNode(latitude=28.6740, longitude=77.1310, area_name="Punjabi Bagh"),
                SensorNode(latitude=28.6304, longitude=77.2177, area_name="Mandir Marg"),
                SensorNode(latitude=28.5140, longitude=77.1800, area_name="Mehrauli"),
                SensorNode(latitude=28.6476, longitude=77.3158, area_name="Anand Vihar"),
                SensorNode(latitude=28.6289, longitude=77.2476, area_name="ITO Delhi"),
                SensorNode(latitude=28.6514, longitude=77.1581, area_name="Shadipur"),
                SensorNode(latitude=28.5504, longitude=77.2159, area_name="Siri Fort"),
                SensorNode(latitude=28.7324, longitude=77.1706, area_name="Jahangirpuri"),
                SensorNode(latitude=28.6997, longitude=77.1654, area_name="Wazirpur"),
                SensorNode(latitude=28.7972, longitude=77.1251, area_name="Bawana"),
                SensorNode(latitude=28.8228, longitude=77.1019, area_name="Narela"),
                SensorNode(latitude=28.8153, longitude=77.1500, area_name="Alipur"),
                SensorNode(latitude=28.6705, longitude=77.0727, area_name="Mundka"),
                SensorNode(latitude=28.5701, longitude=76.9337, area_name="Najafgarh"),
                SensorNode(latitude=28.6953, longitude=77.1816, area_name="Ashok Vihar"),
                SensorNode(latitude=28.7105, longitude=77.2494, area_name="Sonia Vihar"),
                SensorNode(latitude=28.6235, longitude=77.2872, area_name="Patparganj"),
                SensorNode(latitude=28.6723, longitude=77.3152, area_name="Vivek Vihar"),
                SensorNode(latitude=28.5678, longitude=77.2505, area_name="Nehru Nagar"),
                SensorNode(latitude=28.5919, longitude=77.2272, area_name="Lodhi Road"),
                SensorNode(latitude=28.6904, longitude=77.2066, area_name="DU North Campus"),
                SensorNode(latitude=28.5513, longitude=77.2735, area_name="Mathura Road CRRI"),
                SensorNode(latitude=28.5627, longitude=77.0913, area_name="IGI Airport T3"),
                SensorNode(latitude=28.4905, longitude=77.2648, area_name="Dr. Karni Singh Range"),
                SensorNode(latitude=28.6396, longitude=77.1503, area_name="Pusa Road"),
                SensorNode(latitude=28.6118, longitude=77.2377, area_name="Major Dhyan Chand Stadium"),
                SensorNode(latitude=28.5313, longitude=77.2025, area_name="Sri Aurobindo Marg"),
                SensorNode(latitude=28.4111, longitude=77.3125, area_name="Faridabad Sector 16"),
                SensorNode(latitude=28.7512, longitude=77.2810, area_name="Ghaziabad Loni")
            ]
            db.bulk_save_objects(default_nodes)
            db.commit()
            print("Database successfully seeded with 36 Delhi-NCR monitoring stations.")
        
        # Check if settings exist, if not seed them
        if db.query(SystemSettings).count() == 0:
            default_settings = SystemSettings(
                telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN", ""),
                telegram_chat_id=os.getenv("TELEGRAM_CHAT_ID", ""),
                alert_threshold_aqi=150.0
            )
            db.add(default_settings)
            db.commit()
            print("Database seeded with default system settings.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
