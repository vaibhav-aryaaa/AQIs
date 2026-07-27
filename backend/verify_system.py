import sys
from datetime import datetime, timedelta
from db import SessionLocal, init_db, SensorNode, SensorTelemetry, TelemetryAnomaly, AlertTicket
from validator import validate_spatial_consistency
from predictor import run_aqi_forecast, fetch_weather_forecast

def run_integration_tests():
    print("====================================================")
    print("      SmartAQI System Integration Verification      ")
    print("====================================================\n")

    # 1. Database Initialization
    print("Step 1: Initializing Database & Seed Verification...")
    init_db()
    db = SessionLocal()
    
    try:
        node_count = db.query(SensorNode).count()
        print(f"📊 Seed Check: Found {node_count} registered monitoring nodes in db.")
        if node_count != 36:
            print("❌ Seed Check Failed: Expected 36 seeded nodes.")
            sys.exit(1)
        print("✅ Database initialized and seeded successfully.\n")

        # 2. Test Ingestion Spatial Consistency (Valid Case)
        print("Step 2: Testing Valid Telemetry Validation...")
        # Add basic recent mock values for nodes 2 and 3 to establish a neighborhood baseline
        now = datetime.utcnow()
        db.bulk_save_objects([
            SensorTelemetry(node_id=2, pm25=35.0, pm10=70.0, co=0.9, aqi=55.0, timestamp=now),
            SensorTelemetry(node_id=3, pm25=38.0, pm10=75.0, co=1.0, aqi=58.0, timestamp=now)
        ])
        db.commit()

        # Validate normal reading on Node 1 (adjacent to R.K. Puram and Connaught Place)
        is_valid, msg = validate_spatial_consistency(db, node_id=1, candidate_aqi=60.0, candidate_co=1.1)
        print(f"👉 Candidate Node 1 (AQI=60.0, CO=1.1) -> Validation: {is_valid} ({msg})")
        if not is_valid:
            print("❌ Validation Failed: Normal reading was flagged as invalid.")
            sys.exit(1)
        print("✅ Valid telemetry check passed.\n")

        # 3. Test Spatial Anomaly Detection (Quarantine Case)
        print("Step 3: Testing Anomaly Quarantine Validation...")
        # Nodes 2 and 3 read ~55-58. Attempt to submit AQI=750 ( अहमदाबाद peak equivalent) on Node 1.
        is_valid, msg = validate_spatial_consistency(db, node_id=1, candidate_aqi=750.0, candidate_co=95.0)
        print(f"👉 Candidate Node 1 (AQI=750.0, CO=95.0) -> Validation: {is_valid} ({msg})")
        if is_valid:
            print("❌ Validation Failed: Extreme spatial anomaly was not quarantined.")
            sys.exit(1)
        print("✅ Spatial anomaly detection & quarantine check passed.\n")

        # 4. Test Weather Retrieval & Offline Baseline Fallback
        print("Step 4: Testing Weather Forecast Service...")
        node1 = db.query(SensorNode).filter(SensorNode.id == 1).first()
        weather = fetch_weather_forecast(node1.latitude, node1.longitude)
        print(f"👉 Latitude: {node1.latitude}, Longitude: {node1.longitude}")
        print(f"👉 Weather output: Temp={weather['temp']}°C, Humidity={weather['humidity']}%, Wind Speed={weather['wind_speed']}m/s, Wind Dir={weather['wind_dir']}°")
        if not isinstance(weather, dict) or "temp" not in weather:
            print("❌ Weather Forecast Service check failed.")
            sys.exit(1)
        print("✅ Weather retrieval service check passed.\n")

        # 5. Test AI Forecasting Engine & Ticket Creation
        print("Step 5: Testing AI Forecasting Engine...")
        # Clear existing tickets
        db.query(AlertTicket).delete()
        db.commit()

        # Seed Node 1 with 24 hours of clean telemetry to enable ML inference
        history_points = []
        for i in range(24):
            history_points.append(
                SensorTelemetry(
                    node_id=1,
                    pm25=120.0 + (i * 2), # high pm2.5 to force high forecast
                    pm10=220.0,
                    co=3.5,
                    aqi=190.0,
                    timestamp=now - timedelta(hours=24-i)
                )
            )
        db.bulk_save_objects(history_points)
        db.commit()

        predicted_aqi = run_aqi_forecast(db, node_id=1)
        print(f"👉 Node 1 t+24 Forecasted AQI: {predicted_aqi}")
        
        # Check if high AQI forecast correctly generated a GRAP alert ticket
        ticket = db.query(AlertTicket).filter(AlertTicket.node_id == 1).first()
        if ticket:
            print(f"👉 Triggered Ticket: ID={ticket.id}, Severity={ticket.severity}, Message={ticket.message}, Status={ticket.status}")
        else:
            print("❌ Forecasting Engine Failed: High forecast did not create a GRAP alert ticket.")
            sys.exit(1)
        print("✅ AI forecasting engine & alert ticket checks passed.\n")

        print("====================================================")
        print("      VERIFICATION COMPLETED: ALL TESTS PASSED      ")
        print("====================================================")

    finally:
        # Cleanup test data to keep SQLite clean for simulator run
        db.query(SensorTelemetry).delete()
        db.query(TelemetryAnomaly).delete()
        db.query(AlertTicket).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    run_integration_tests()
