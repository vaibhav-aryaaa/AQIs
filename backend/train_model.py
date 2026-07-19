import os
import math
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

# We use xgboost if available, otherwise fallback to RandomForestRegressor from scikit-learn
try:
    from xgboost import XGBRegressor
    USE_XGB = True
except ImportError:
    from sklearn.ensemble import RandomForestRegressor
    USE_XGB = False
    print("xgboost not installed. Falling back to sklearn RandomForestRegressor for training.")

DATASET_PATH = "Vaibhav_CleanedDataset.xlsx"
MODEL_PATH = "aqi_predictor.pkl"

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic historical training data if the clean Excel file is not present.
    Ensures that physical laws (correlations of CO/PM2.5 to AQI, wind dispersion) are preserved.
    """
    print("Generating synthetic historical dataset for training...")
    np.random.seed(42)

    # 1. Base pollutants
    pm25 = np.random.uniform(15.0, 350.0, num_samples)
    pm10 = pm25 * np.random.uniform(1.2, 2.0, num_samples)
    co = (pm25 * 0.015) + np.random.uniform(0.1, 2.0, num_samples)

    # 2. Weather
    temp = np.random.uniform(10.0, 42.0, num_samples)
    humidity = np.random.uniform(20.0, 95.0, num_samples)
    wind_speed = np.random.uniform(0.5, 12.0, num_samples)
    wind_dir = np.random.uniform(0, 360, num_samples)
    boundary_layer = np.random.uniform(250, 1800, num_samples)

    # Convert wind vectors
    wind_dir_rad = np.radians(wind_dir)
    wind_u = wind_speed * np.cos(wind_dir_rad)
    wind_v = wind_speed * np.sin(wind_dir_rad)

    # 3. Cyclical time
    hour = np.random.randint(0, 24, num_samples)
    day = np.random.randint(0, 7, num_samples)
    hour_sin = np.sin(2 * np.pi * hour / 24.0)
    hour_cos = np.cos(2 * np.pi * hour / 24.0)
    day_sin = np.sin(2 * np.pi * day / 7.0)
    day_cos = np.cos(2 * np.pi * day / 7.0)

    # 4. Target AQI calculation (incorporating meteorological dispersion)
    dispersion = wind_speed * 1.3 + (boundary_layer / 400.0)
    weather_effect = 1.0 + (humidity / 250.0) - (temp / 120.0)
    raw_aqi = ((pm25 * 1.3) + (co * 38.0)) * weather_effect / dispersion
    aqi = np.clip(raw_aqi + np.random.normal(0, 8, num_samples), 10.0, 500.0)

    # Construct DataFrame
    df = pd.DataFrame({
        "pm25_roll": pm25,
        "pm10_roll": pm10,
        "co_roll": co,
        "temp": temp,
        "humidity": humidity,
        "wind_u": wind_u,
        "wind_v": wind_v,
        "boundary_layer": boundary_layer,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "day_sin": day_sin,
        "day_cos": day_cos,
        "aqi": aqi
    })
    return df

def train_and_export():
    # 1. Load Data
    if os.path.exists(DATASET_PATH):
        try:
            print(f"Loading cleaned historical dataset from {DATASET_PATH}...")
            # We assume sheet containing cleaned city_day columns
            raw_df = pd.read_excel(DATASET_PATH)
            
            # Feature engineering to match predictor format
            df = pd.DataFrame()
            df["pm25_roll"] = raw_df["PM2.5"]
            df["pm10_roll"] = raw_df["PM10"]
            df["co_roll"] = raw_df["CO"]
            
            # Check for weather columns, generate defaults if missing
            df["temp"] = raw_df.get("temp", np.random.uniform(15.0, 35.0, len(raw_df)))
            df["humidity"] = raw_df.get("humidity", np.random.uniform(40.0, 80.0, len(raw_df)))
            
            wind_speed = raw_df.get("wind_speed", np.random.uniform(1.0, 6.0, len(raw_df)))
            wind_dir = raw_df.get("wind_dir", np.random.uniform(0, 360, len(raw_df)))
            wind_dir_rad = np.radians(wind_dir)
            df["wind_u"] = wind_speed * np.cos(wind_dir_rad)
            df["wind_v"] = wind_speed * np.sin(wind_dir_rad)
            
            df["boundary_layer"] = raw_df.get("boundary_layer", np.random.uniform(400, 1200, len(raw_df)))
            
            # Cyclical time calculations from Date field
            dates = pd.to_datetime(raw_df["Date"])
            df["hour_sin"] = np.sin(2 * np.pi * dates.dt.hour / 24.0)
            df["hour_cos"] = np.cos(2 * np.pi * dates.dt.hour / 24.0)
            df["day_sin"] = np.sin(2 * np.pi * dates.dt.dayofweek / 7.0)
            df["day_cos"] = np.cos(2 * np.pi * dates.dt.dayofweek / 7.0)
            df["aqi"] = raw_df["AQI"]
            
        except Exception as e:
            print(f"Error parsing clean Excel dataset ({e}). Reverting to synthetic dataset.")
            df = generate_synthetic_data()
    else:
        print(f"Cleaned dataset file '{DATASET_PATH}' not found in workspace.")
        df = generate_synthetic_data()

    # 2. Split Features & Target
    X = df.drop(columns=["aqi"])
    y = df["aqi"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 3. Model Training
    print("Training model...")
    if USE_XGB:
        model = XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    else:
        model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)

    model.fit(X_train, y_train)

    # 4. Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Model Training complete. Train R2 Score: {train_score:.4f}, Test R2 Score: {test_score:.4f}")

    # 5. Export Model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Successfully serialized and exported model to: {MODEL_PATH}")

if __name__ == "__main__":
    train_and_export()
