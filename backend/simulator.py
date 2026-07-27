import time
import random
import requests
from datetime import datetime

BACKEND_URL = "http://127.0.0.1:8000/api/telemetry"

# Sensor nodes metadata mapping (must match database seed IDs)
SENSORS = [
    {"id": 1, "name": "Connaught Place"},
    {"id": 2, "name": "R.K. Puram"},
    {"id": 3, "name": "Dwarka"},
    {"id": 4, "name": "Noida Sector 62"},
    {"id": 5, "name": "Gurugram Sector 29"},
    {"id": 6, "name": "Rohini"},
    {"id": 7, "name": "Okhla"},
    {"id": 8, "name": "Punjabi Bagh"},
    {"id": 9, "name": "Mandir Marg"},
    {"id": 10, "name": "Mehrauli"}
]

def get_diurnal_factor():
    """
    Computes a scaling factor based on the current hour of the day
    to mimic urban traffic/commute patterns (morning & evening rush hours).
    """
    current_hour = datetime.now().hour
    
    # Peak traffic hours: 08:00 - 10:00 and 18:00 - 21:00
    if 8 <= current_hour <= 10:
        return 2.2 + random.uniform(-0.3, 0.3)
    elif 18 <= current_hour <= 21:
        return 2.5 + random.uniform(-0.4, 0.4)
    elif 23 <= current_hour or current_hour <= 4:
        # Nighttime lows
        return 0.6 + random.uniform(-0.1, 0.1)
    else:
        # Standard baseline
        return 1.2 + random.uniform(-0.2, 0.2)

def generate_telemetry(sensor_id, inject_anomaly=False):
    """
    Generates synthetic pollutant logs for a sensor.
    If inject_anomaly is True, forces a massive spike to test spatial validation.
    """
    if inject_anomaly:
        # Extreme telemetry failure (similar to historical Ahmedabad 2049 AQI spike)
        return {
            "node_id": sensor_id,
            "pm25": float(random.randint(600, 999)),
            "pm10": float(random.randint(800, 1500)),
            "co": float(random.uniform(90.0, 140.0)),
            "aqi": float(random.randint(650, 2049))
        }

    # Standard generation with diurnal cycle scale
    scale = get_diurnal_factor()
    
    base_pm25 = random.uniform(30.0, 80.0) * scale
    base_pm10 = random.uniform(60.0, 140.0) * scale
    base_co = random.uniform(0.6, 1.8) * scale

    def calculate_us_epa_aqi(pm25: float, pm10: float) -> float:
        def aqi_pm25(c):
            if c <= 12.0:
                return ((50.0 - 0.0) / (12.0 - 0.0)) * (c - 0.0) + 0.0
            elif c <= 35.4:
                return ((100.0 - 51.0) / (35.4 - 12.1)) * (c - 12.1) + 51.0
            elif c <= 55.4:
                return ((150.0 - 101.0) / (55.4 - 35.5)) * (c - 35.5) + 101.0
            elif c <= 150.4:
                return ((200.0 - 151.0) / (150.4 - 55.5)) * (c - 55.5) + 151.0
            elif c <= 250.4:
                return ((300.0 - 201.0) / (250.4 - 150.5)) * (c - 150.5) + 201.0
            elif c <= 350.4:
                return ((400.0 - 301.0) / (350.4 - 250.5)) * (c - 250.5) + 301.0
            else:
                return ((500.0 - 401.0) / (500.0 - 350.5)) * (min(c, 500.0) - 350.5) + 401.0

        def aqi_pm10(c):
            if c <= 54.0:
                return ((50.0 - 0.0) / (54.0 - 0.0)) * (c - 0.0) + 0.0
            elif c <= 154.0:
                return ((100.0 - 51.0) / (154.0 - 55.0)) * (c - 55.0) + 51.0
            elif c <= 254.0:
                return ((150.0 - 101.0) / (254.0 - 155.0)) * (c - 155.0) + 101.0
            elif c <= 354.0:
                return ((200.0 - 151.0) / (354.0 - 255.0)) * (c - 255.0) + 151.0
            elif c <= 424.0:
                return ((300.0 - 201.0) / (424.0 - 355.0)) * (c - 355.0) + 201.0
            elif c <= 504.0:
                return ((400.0 - 301.0) / (504.0 - 425.0)) * (c - 425.0) + 301.0
            else:
                return ((500.0 - 401.0) / (604.0 - 505.0)) * (min(c, 604.0) - 505.0) + 401.0
                
        aqi_25 = aqi_pm25(pm25)
        aqi_10 = aqi_pm10(pm10)
        return max(aqi_25, aqi_10)

    aqi = calculate_us_epa_aqi(base_pm25, base_pm10) + random.uniform(-2, 2)
    aqi = max(aqi, 10.0) # Ensure values are positive

    return {
        "node_id": sensor_id,
        "pm25": round(base_pm25, 2),
        "pm10": round(base_pm10, 2),
        "co": round(base_co, 2),
        "aqi": round(aqi, 2)
    }

def run_simulator(interval_seconds=10):
    """
    Main loop running the simulator. Emits data for all 10 nodes every cycle.
    Injects a spatial anomaly with a 10% chance per cycle.
    """
    print("====================================================")
    print("SmartAQI Multi-Node IoT Telemetry Simulator Started")
    print(f"Target Endpoint: {BACKEND_URL}")
    print(f"Polling Interval: {interval_seconds} seconds")
    print("====================================================")

    while True:
        # Determine if we should inject an anomaly in this cycle
        anomaly_cycle = random.random() < 0.10
        anomaly_node = random.randint(1, len(SENSORS)) if anomaly_cycle else None

        for sensor in SENSORS:
            should_fail = (sensor["id"] == anomaly_node)
            payload = generate_telemetry(sensor["id"], inject_anomaly=should_fail)
            
            try:
                response = requests.post(BACKEND_URL, json=payload, timeout=5)
                status = response.json().get("status", "unknown")
                msg = response.json().get("message", "")
                
                label = f"[{sensor['name']}] (ID {sensor['id']})"
                if status == "quarantined":
                    print(f"🚨 QUARANTINED | {label} - Sent: AQI={payload['aqi']}, CO={payload['co']}. Server message: {msg}")
                else:
                    print(f"✅ Ingested    | {label} - Sent: AQI={payload['aqi']}, CO={payload['co']}.")
            except requests.exceptions.RequestException as e:
                print(f"❌ Connection Error | Failed to send data for node {sensor['id']}: {e}")
                
        print(f"--- Cycle completed at {datetime.now().strftime('%H:%M:%S')}. Sleeping for {interval_seconds}s ---\n")
        time.sleep(interval_seconds)

if __name__ == "__main__":
    # Short interval for demonstration; change to 300 for 5-minute production cycle
    run_simulator(interval_seconds=5)
