import time
import random
import requests
from datetime import datetime
from rich.live import Live
from rich.table import Table
from rich.console import Console

console = Console()

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
    aqi = max(aqi, 10.0)

    return {
        "node_id": sensor_id,
        "pm25": round(base_pm25, 2),
        "pm10": round(base_pm10, 2),
        "co": round(base_co, 2),
        "aqi": round(aqi, 2)
    }

def get_aqi_colored_string(aqi):
    if aqi <= 50:
        return f"[bold green]{aqi:.1f} (Good)[/bold green]"
    elif aqi <= 100:
        return f"[bold yellow]{aqi:.1f} (Moderate)[/bold yellow]"
    elif aqi <= 150:
        return f"[bold orange3]{aqi:.1f} (Sensitive Groups Warning)[/bold orange3]"
    elif aqi <= 200:
        return f"[bold red]{aqi:.1f} (Unhealthy)[/bold red]"
    elif aqi <= 300:
        return f"[bold purple]{aqi:.1f} (Very Unhealthy)[/bold purple]"
    else:
        return f"[bold dark_red]{aqi:.1f} (Hazardous)[/bold dark_red]"

def run_simulator(interval_seconds=5):
    """
    Main loop running the simulator with rich dashboard output.
    """
    sensor_states = {
        s["id"]: {
            "name": s["name"],
            "aqi": 0.0,
            "pm25": 0.0,
            "pm10": 0.0,
            "co": 0.0,
            "status": "Initializing",
            "last_update": "Awaiting first cycle..."
        }
        for s in SENSORS
    }
    cycle_count = 0

    def generate_table(next_cycle_in):
        table = Table(
            title=f"SmartAQI Multi-Node IoT Telemetry Simulator Dashboard\n[cyan]Cycle Count: {cycle_count} | Next Cycle in: {next_cycle_in}s[/cyan]"
        )
        table.add_column("ID", justify="center", style="dim")
        table.add_column("Area Name", justify="left", style="white")
        table.add_column("AQI", justify="center")
        table.add_column("PM2.5 (ug/m³)", justify="right")
        table.add_column("PM10 (ug/m³)", justify="right")
        table.add_column("CO (mg/m³)", justify="right")
        table.add_column("Status", justify="center")
        table.add_column("Last Server Message", justify="left")

        for s_id, data in sorted(sensor_states.items()):
            aqi_str = get_aqi_colored_string(data["aqi"]) if data["aqi"] > 0 else "N/A"
            status_str = data["status"]
            if status_str == "✅ Ingested":
                status_formatted = "[bold green]✅ Ingested[/bold green]"
            elif status_str == "🚨 Quarantined":
                status_formatted = "[bold red]🚨 Quarantined[/bold red]"
            elif "Error" in status_str:
                status_formatted = "[bold red]❌ Connection Error[/bold red]"
            else:
                status_formatted = f"[dim]{status_str}[/dim]"

            table.add_row(
                str(s_id),
                data["name"],
                aqi_str,
                f"{data['pm25']:.1f}" if data["pm25"] > 0 else "N/A",
                f"{data['pm10']:.1f}" if data["pm10"] > 0 else "N/A",
                f"{data['co']:.2f}" if data["co"] > 0 else "N/A",
                status_formatted,
                data["last_update"]
            )
        return table

    # Start live display context
    with Live(generate_table(0), console=console, refresh_per_second=1) as live:
        while True:
            cycle_count += 1
            # Determine if we should inject an anomaly in this cycle
            anomaly_cycle = random.random() < 0.15
            anomaly_node = random.randint(1, len(SENSORS)) if anomaly_cycle else None

            for sensor in SENSORS:
                should_fail = (sensor["id"] == anomaly_node)
                payload = generate_telemetry(sensor["id"], inject_anomaly=should_fail)
                
                # Update generated values in state dictionary
                sensor_states[sensor["id"]]["aqi"] = payload["aqi"]
                sensor_states[sensor["id"]]["pm25"] = payload["pm25"]
                sensor_states[sensor["id"]]["pm10"] = payload["pm10"]
                sensor_states[sensor["id"]]["co"] = payload["co"]

                try:
                    response = requests.post(BACKEND_URL, json=payload, timeout=5)
                    status_val = response.json().get("status", "unknown")
                    msg = response.json().get("message", "")
                    
                    if status_val == "quarantined":
                        sensor_states[sensor["id"]]["status"] = "🚨 Quarantined"
                    else:
                        sensor_states[sensor["id"]]["status"] = "✅ Ingested"
                    sensor_states[sensor["id"]]["last_update"] = msg if msg else "Success"
                except requests.exceptions.RequestException as e:
                    sensor_states[sensor["id"]]["status"] = "❌ Connection Error"
                    sensor_states[sensor["id"]]["last_update"] = str(e)[:45]

            # Countdown sleep loop
            for remaining in range(interval_seconds, 0, -1):
                live.update(generate_table(remaining))
                time.sleep(1)

if __name__ == "__main__":
    run_simulator(interval_seconds=5)
