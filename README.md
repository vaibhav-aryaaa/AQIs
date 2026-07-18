# SmartAQI: Preemptive Air Quality Management & Decision Support System

An enterprise-grade, preemptive air quality monitoring and automated decision support system designed for Indian cities (Delhi-NCR). This repository features a containerized multi-service architecture, real-time spatial anomaly detection, machine learning-driven AQI forecasting, and live dashboard communication via WebSockets.

---

## 🚀 Key Features & Production Upgrades

### 1. Production DevOps & Containerization
* **Multi-Service Docker Grid:** Orchestrated via `docker-compose.yml` to spin up a FastAPI backend (running on Uvicorn) and a modular React frontend (compiled via Vite and served via an Nginx reverse-proxy on port `3000`).
* **Clean Network Routing:** Frontend assets and backend API endpoints communicate securely over a private Docker bridged network, handling reverse proxies for REST `/api` routes and WebSocket `/api/ws` connections.

### 2. Real-Time WebSockets Synchronization
* **Instant Event Streaming:** Replaced periodic HTTP poll loops with a native asynchronous WebSocket broker. Telemetry updates, quarantined outliers, and newly opened GRAP mitigation tickets are pushed to client UIs instantly.
* **Interactive Anomaly Simulator:** Includes a built-in button on the dashboard UI to send simulated sensor anomalies (e.g. $AQI = 750, CO = 95\ mg/m^3$) to test and display the real-time server quarantine and alerting workflow.

### 3. Spatial Anomaly Consistency Checking
* **Quarantine Pipeline:** Incoming sensor telemetry is verified in real-time. Pydantic models enforce physical boundaries, while a **Haversine Distance Filter** queries active neighboring nodes within a 2 km radius. 
* **Outlier Isolation:** If a node's reading deviates from its neighbors by $> 3\sigma$ (standard deviations), the pipeline quarantines the log in a `TelemetryAnomaly` database table and alerts administrators rather than publishing raw unverified logs.

### 4. 24-Hour AI Forecasting Engine
* **Meteorological Ingestion:** Integrates live weather forecasts (temperature, humidity, wind direction, planetary boundary layer height) by querying the Open-Meteo API.
* **Feature Engineering:** Decomposes wind speed and direction into Cartesian wind vectors ($U$ and $V$ components) to model pollutant dispersion, and converts datetime values to cyclical sine/cosine components.
* **XGBoost Regressor:** Utilizes a pre-trained XGBoost Regressor model (`aqi_predictor.pkl`) to output forecasted local AQI.
* **Offline Weather Baseline Fallback:** If network connections fail, the forecasting pipeline falls back to a historical monthly meteorological profile dictionary to prevent server timeouts.

### 5. Automated Unit Testing
* **Test Suite (`test_main.py`):** Configured with isolated database fixtures using `pytest` and `FastAPI TestClient` to test valid postings, schema validation errors, and neighbor quarantine rules.

---

## 📁 Repository Structure

* `Dockerfile` - Backend FastAPI container configuration.
* `docker-compose.yml` - Multi-service local orchestrator.
* `requirements.txt` - Python backend package specifications.
* `db.py` - Database models and Delhi-NCR node seeding.
* `main.py` - Web server, WebSocket connections, and endpoints.
* `validator.py` - Pydantic schema validation and Haversine spatial check.
* `predictor.py` - Open-Meteo forecasts, feature engineering, and model inference.
* `train_model.py` - Fits the XGBoost Regressor on dataset and exports the model pickle.
* `simulator.py` - Script generating diurnal telemetry logs and random outliers.
* `test_main.py` - Pytest testing suite.
* `verify_system.py` - Local integration verification check.
* `verify_upgrades.py` - Production upgrades file-logging and WebSocket check.
* `Vaibhav_ScalingStrategy.html` - Print-to-PDF optimized 5-slide presentation deck.
* `frontend/` - React frontend directory:
  * `Dockerfile` - Compiles React and builds static assets served via Nginx.
  * `nginx.conf` - Nginx proxying rules for REST and WebSocket connections.
  * `src/App.jsx` - Coordinates dashboard states and subscribes to WebSocket channels.
  * `src/components/MapWidget.jsx` - Leaflet map utilizing dynamic marker circle colors.
  * `src/components/ForecastChart.jsx` - Chart.js timeline mapping history and predictions.
  * `src/components/TicketList.jsx` - Actionable Graded Response Action Plan (GRAP) ticket sidebar.

---

## 📊 Solution Scaling & Implementation Strategy (Assignment 4B)

The project includes a 5-slide strategic presentation deck ([Vaibhav_ScalingStrategy.html](file:///Users/vaibhavarya/Documents/Culture/ass-2A/Vaibhav_ScalingStrategy.html)) outlining the path to take **SmartAQI** from concept to wide-scale deployment:

### 1. Problem & Solution
* **Problem:** sparse CAAQMS monitoring grids leave spatial blind spots in vulnerable areas, publishing raw, unverified data with frequent sensor failures.
* **Solution:** Dense array of low-cost IoT nodes coupled with real-time spatial validation checks and XGBoost-driven 24-hour localized forecasts to coordinate targeted municipal responses.

### 2. Target Users & Value Proposition
* **Vulnerable Citizens:** Pushes preemptive health warnings directly to Telegram channels 24 hours in advance so asthmatics, children, and outdoor laborers can adjust schedules.
* **Municipal Corporations:** Replaces economically disruptive, city-wide lockdowns with block-level, targeted GRAP mitigation tickets (e.g., mist-sprinkling only in active hotspots).
* **Traffic Planners:** Hyper-local tracking pinpoints congestion bottlenecks to trigger dynamic traffic diversions.

### 3. Scaling Strategy
* **Across Locations:** Expand the grid along the Indo-Gangetic Plain to industrial cities (Lucknow, Patna, Kanpur) sharing similar meteorological inversion traps.
* **Across User Groups:** Offer custom compliance dashboard endpoints for industrial complexes and real-estate environmental scoring.
* **Through Partnerships:** Partner with academic environmental research departments for calibration audits, and mount mobile GPS-linked nodes on private postal/delivery fleets.

### 4. Phased Implementation Plan
* **Pilot Phase (Months 1–3):** Deploy 10 virtual node simulator arrays in Delhi-NCR, mapping local traffic diurnal cycles. Verify spatial anomaly checks and train the XGBoost forecasting model.
* **Expansion Phase (Months 4–9):** Deploy 100 physical ESP32 nodes with PMS7003 dust sensors across public transit vehicles and municipal offices in NCR. Connect real-time Open-Meteo predictions.
* **Full-scale Integration (Months 10–18):** State-level rollout across Haryana and Uttar Pradesh. Integrate automated GRAP triggers directly with municipal mist-sprinkling dispatch and traffic control systems.

### 5. Risks & Mitigation
* **Hardware Degradation:** Automate relative calibration scripts comparing node baselines with the nearest reference CAAQMS; utilize a local host partnership model.
* **API / Network Loss:** Pre-configure local baseline meteorological fallbacks to ensure forecasting remains online.
* **False Alarms:** Enforce absolute validation limits combined with spatial neighbor checks before broadcasting.

---

## 🛠️ How to Run & Verify

### Local Development (Python/Uvicorn/Vite)
1. **Install Dependencies:** `pip install -r requirements.txt`
2. **Run Pytest Suite:** `pytest test_main.py -v` (Verify all tests pass)
3. **Run Upgrades Check:** `python verify_upgrades.py` (Verify logs file creation)
4. **Train ML Model:** `python train_model.py` (Outputs model file `aqi_predictor.pkl`)
5. **Start FastAPI Backend:** `uvicorn main:app --reload`
6. **Start Telemetry Simulator:** `python simulator.py`
7. **Start React Frontend:** Navigate to `frontend/`, run `npm install`, then `npm run dev` and open `http://localhost:3000`.

### Production Deployment (Docker Compose)
Ensure Docker Desktop is running on your machine:
```bash
docker-compose up --build
```
* Access the frontend on `http://localhost:3000`
* Access API swagger docs on `http://localhost:8000/docs`

---

## 🖨️ How to Export the Strategy Presentation to PDF
1. Open the [Vaibhav_ScalingStrategy.html](file:///Users/vaibhavarya/Documents/Culture/ass-2A/Vaibhav_ScalingStrategy.html) file in Google Chrome or Apple Safari.
2. Press `Cmd + P` (Mac) or `Ctrl + P` (Windows) to trigger the Print Dialog.
3. Configure the following export parameters:
   * **Destination:** Save as PDF
   * **Layout:** Landscape
   * **Paper Size:** A4 (or US Letter)
   * **Margins:** None (or Default)
   * **Background graphics:** Checked (Crucial for importing dark styles and gradients)
4. Click **Save** and save it as `Vaibhav_ScalingStrategy.pdf`.
