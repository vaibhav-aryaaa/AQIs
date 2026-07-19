import os
import math
import pickle
import requests
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db import AlertTicket, SensorNode, SensorTelemetry

# Default historical meteorological profiles (offline fallback by month)
HISTORICAL_WEATHER_PROFILES = {
    1:  {"temp": 15.0, "humidity": 65.0, "wind_speed": 2.2, "wind_dir": 290, "boundary_layer": 400}, # Jan (Cold, dry, low BLH)
    2:  {"temp": 19.0, "humidity": 60.0, "wind_speed": 2.5, "wind_dir": 280, "boundary_layer": 500}, # Feb
    3:  {"temp": 25.0, "humidity": 50.0, "wind_speed": 3.0, "wind_dir": 270, "boundary_layer": 800}, # Mar
    4:  {"temp": 32.0, "humidity": 35.0, "wind_speed": 3.5, "wind_dir": 280, "boundary_layer": 1200},# Apr
    5:  {"temp": 38.0, "humidity": 30.0, "wind_speed": 4.0, "wind_dir": 290, "boundary_layer": 1500},# May (Hot, windy)
    6:  {"temp": 36.0, "humidity": 55.0, "wind_speed": 4.5, "wind_dir": 110, "boundary_layer": 1000},# Jun
    7:  {"temp": 31.0, "humidity": 80.0, "wind_speed": 3.8, "wind_dir": 110, "boundary_layer": 800}, # Jul (Monsoon, wet)
    8:  {"temp": 30.0, "humidity": 82.0, "wind_speed": 3.2, "wind_dir": 120, "boundary_layer": 700}, # Aug
    9:  {"temp": 30.0, "humidity": 75.0, "wind_speed": 2.8, "wind_dir": 130, "boundary_layer": 750}, # Sep
    10: {"temp": 27.0, "humidity": 65.0, "wind_speed": 2.0, "wind_dir": 290, "boundary_layer": 600}, # Oct (Inversions start)
    11: {"temp": 20.0, "humidity": 68.0, "wind_speed": 1.8, "wind_dir": 300, "boundary_layer": 450}, # Nov
    12: {"temp": 16.0, "humidity": 66.0, "wind_speed": 1.9, "wind_dir": 300, "boundary_layer": 380}, # Dec
}

MODEL_PATH = "aqi_predictor.pkl"

def fetch_weather_forecast(lat: float, lon: float) -> dict:
    """
    Fetches the 24-hour weather forecast from Open-Meteo.
    If offline or request fails, falls back to historical averages.
    """
    current_month = datetime.now().month
    fallback = HISTORICAL_WEATHER_PROFILES.get(current_month, HISTORICAL_WEATHER_PROFILES[3])
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relativehumidity_2m,windspeed_10m,winddirection_10m",
        "forecast_days": 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            # Extract values at index 23 (forecast for t+24 hours)
            temp = data["hourly"]["temperature_2m"][23]
            humidity = data["hourly"]["relativehumidity_2m"][23]
            wind_speed = data["hourly"]["windspeed_10m"][23]
            wind_dir = data["hourly"]["winddirection_10m"][23]
            
            # Open-Meteo does not provide planetary boundary layer height in basic hourly,
            # so we combine with our historical fallback to complete the feature set.
            return {
                "temp": temp,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "wind_dir": wind_dir,
                "boundary_layer": fallback["boundary_layer"]
            }
    except Exception as e:
        print(f"⚠️ Open-Meteo request failed ({e}). Falling back to baseline weather profile.")
        
    return fallback

def preprocess_features(telemetry_history: list, weather: dict, target_time: datetime) -> np.ndarray:
    """
    Transforms telemetry logs and weather forecasts into a structured feature vector:
    [pm25_roll, pm10_roll, co_roll, temp, humidity, wind_u, wind_v, boundary_layer, hour_sin, hour_cos, day_sin, day_cos]
    """
    # 1. Rolling Telemetry Averages
    if telemetry_history:
        pm25_roll = np.mean([t.pm25 for t in telemetry_history])
        pm10_roll = np.mean([t.pm10 for t in telemetry_history])
        co_roll = np.mean([t.co for t in telemetry_history])
    else:
        # Fallback values if database is fresh and empty
        pm25_roll = 65.0
        pm10_roll = 120.0
        co_roll = 1.2

    # 2. Wind Vectors Conversion
    wind_speed = weather["wind_speed"]
    wind_dir_rad = math.radians(weather["wind_dir"])
    wind_u = wind_speed * math.cos(wind_dir_rad)
    wind_v = wind_speed * math.sin(wind_dir_rad)

    # 3. Cyclical Temporal Features
    hour = target_time.hour
    day_of_week = target_time.weekday()

    hour_sin = math.sin(2 * math.pi * hour / 24.0)
    hour_cos = math.cos(2 * math.pi * hour / 24.0)
    day_sin = math.sin(2 * math.pi * day_of_week / 7.0)
    day_cos = math.cos(2 * math.pi * day_of_week / 7.0)

    # 4. Construct feature row
    features = [
        pm25_roll, pm10_roll, co_roll, 
        weather["temp"], weather["humidity"], wind_u, wind_v, weather["boundary_layer"],
        hour_sin, hour_cos, day_sin, day_cos
    ]
    return np.array(features).reshape(1, -1)

def run_heuristic_inference(features: np.ndarray) -> float:
    """
    Standard physics-informed heuristic regressor used as backup if the 
    pre-trained XGBoost pickle model is not present.
    """
    # Feature indices mapping:
    # 0: pm25_roll, 1: pm10_roll, 2: co_roll, 3: temp, 4: humidity, 5: wind_u, 6: wind_v, 7: boundary_layer
    vals = features[0]
    pm25 = vals[0]
    co = vals[2]
    temp = vals[3]
    humidity = vals[4]
    wind_speed = math.sqrt(vals[5]**2 + vals[6]**2)
    blh = vals[7]

    # Heuristic formula representing meteorological effects on raw telemetry:
    # High wind speed and boundary layer disperse pollutants. High temp/humidity increases ozone/trapping.
    dispersion_factor = max(wind_speed * 1.5 + (blh / 400.0), 1.0)
    base_pollutants = (pm25 * 1.3) + (co * 38.0)
    weather_multiplier = 1.0 + (humidity / 250.0) - (temp / 120.0)
    
    predicted_aqi = (base_pollutants * weather_multiplier) / dispersion_factor
    # Add minor diurnal randomness
    predicted_aqi += np.random.uniform(-3, 3)
    
    return float(np.clip(predicted_aqi, 10.0, 500.0))

def run_aqi_forecast(db: Session, node_id: int) -> float:
    """
    Core function called to calculate t+24 hour AQI forecast for a specific node.
    """
    # 1. Fetch node and weather
    node = db.query(SensorNode).filter(SensorNode.id == node_id).first()
    if not node:
        return 100.0
        
    weather = fetch_weather_forecast(node.latitude, node.longitude)
    
    # 2. Get past 24-hour clean telemetry
    now = datetime.utcnow()
    telemetry_history = db.query(SensorTelemetry)\
                          .filter(SensorTelemetry.node_id == node_id)\
                          .filter(SensorTelemetry.timestamp >= now - timedelta(hours=24))\
                          .all()
    
    # 3. Preprocess features
    target_time = now + timedelta(hours=24)
    features = preprocess_features(telemetry_history, weather, target_time)

    # 4. Predict
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)
            predicted_aqi = float(model.predict(features)[0])
        except Exception as e:
            print(f"⚠️ Failed to load XGBoost model from pickle ({e}). Using heuristic fallback.")
            predicted_aqi = run_heuristic_inference(features)
    else:
        predicted_aqi = run_heuristic_inference(features)

    # 5. Alert Trigger Check
    if predicted_aqi > 150.0:
        trigger_grap_ticket(db, node_id, predicted_aqi)

    return round(predicted_aqi, 2)

def trigger_grap_ticket(db: Session, node_id: int, forecasted_aqi: float):
    """
    Generates a GRAP (Graded Response Action Plan) ticket in the database.
    """
    # Determine severity
    if forecasted_aqi > 300.0:
        severity = "Severe"
        msg = f"Forecasted AQI is {forecasted_aqi:.1f} (Severe). Actions: Impose building construction bans, deploy water mist sprinkler units, and issue child/elder health advisories."
    elif forecasted_aqi > 200.0:
        severity = "Poor"
        msg = f"Forecasted AQI is {forecasted_aqi:.1f} (Poor). Actions: Increase mechanical road sweeping frequency and restrict heavy vehicle entry."
    else:
        severity = "Moderate"
        msg = f"Forecasted AQI is {forecasted_aqi:.1f} (Moderate). Actions: Monitor local traffic emission checkpoints."

    # Avoid duplicate open tickets for same node
    existing = db.query(AlertTicket)\
                 .filter(AlertTicket.node_id == node_id)\
                 .filter(AlertTicket.status == "Open")\
                 .first()
    if not existing:
        new_ticket = AlertTicket(
            node_id=node_id,
            severity=severity,
            message=msg,
            status="Open",
            timestamp=datetime.utcnow()
        )
        db.add(new_ticket)
        db.commit()
        print(f"⚠️ GRAP TICKET CREATED | Node {node_id} - Forecasted AQI: {forecasted_aqi:.2f} ({severity})")
        
        # In Phase 4, we will dispatch this message directly to the Telegram bot channel
        dispatch_telegram_alert(msg)

def dispatch_telegram_alert(message: str):
    """
    Sends an automated notification to a Telegram channel/group using the Bot API.
    Loads credentials from env variables. Logs to console if variables are not configured.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if bot_token and chat_id:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": f"🚨 *SmartAQI Preemptive Alert* 🚨\n\n{message}",
            "parse_mode": "Markdown"
        }
        try:
            response = requests.post(url, json=payload, timeout=5)
            if response.status_code == 200:
                print("📢 Telegram alert successfully dispatched.")
            else:
                print(f"⚠️ Telegram Bot API returned status code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Failed to dispatch Telegram alert: {e}")
    else:
        print("ℹ️ Telegram credentials not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable live alerts.")
        print(f"📢 [Logged Alert] -> {message}")
