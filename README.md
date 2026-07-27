# SmartAQI: Preemptive Air Quality Management & Decision Support System

[![SmartAQI CI](https://github.com/vaibhav-aryaaa/AQIs/actions/workflows/ci.yml/badge.svg)](https://github.com/vaibhav-aryaaa/AQIs/actions/workflows/ci.yml)

An enterprise-grade, preemptive air quality monitoring and automated decision support system designed for Indian cities (Delhi-NCR). This repository features a containerized multi-service architecture, real-time spatial anomaly detection, machine learning-driven AQI forecasting, and live dashboard communication via WebSockets.

---

## 🚀 Key Features & Production Upgrades

### 1. Production DevOps & Containerization
* **Multi-Service Docker Grid:** Orchestrated via `docker-compose.yml` to spin up a FastAPI backend (running on Uvicorn inside `./backend`) and a modular React frontend (compiled via Vite and served via Nginx inside `./frontend`).
* **Clean Network Routing:** Frontend assets and backend API endpoints communicate securely over a private Docker bridged network, handling reverse proxies for REST `/api` routes and WebSocket `/api/ws` connections.

### 2. Real-Time WebSockets Synchronization
* **Instant Event Streaming:** Pushes telemetry updates, quarantined outliers, and newly opened GRAP mitigation tickets to client UIs instantly using a native asynchronous WebSocket broker.
* **Interactive Anomaly Simulator:** Includes a built-in button on the dashboard UI to send simulated sensor anomalies (e.g., $AQI = 750, CO = 95\ mg/m^3$) to test and display the real-time server quarantine and alerting workflow.

### 3. Spatial Anomaly Consistency Checking
* **Quarantine Pipeline:** Ingested sensor telemetry is validated in real-time. Pydantic models enforce physical boundaries, while a **Haversine Distance Filter** queries active neighboring nodes within a 2 km radius. 
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

```text
ass-2A/
├── docker-compose.yml         # Container orchestrator
├── README.md                  # Project documentation
├── organize.sh                # Directory organization script
├── .gitignore                 # Excludes local databases, datasets, models, and node modules
├── documents/                 # Presentation slides and project deliverables
│   └── Vaibhav_ScalingStrategy.html
├── frontend/                  # React Frontend application
│   ├── Dockerfile
│   ├── nginx.conf             # Nginx reverse proxy configurations
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── backend/                   # FastAPI Backend & ML application
    ├── Dockerfile
    ├── requirements.txt
    ├── db.py                  # Database connection, schemas, and node seeding
    ├── main.py                # Server, WebSocket manager, endpoints
    ├── validator.py           # Ingestion Pydantic check & Haversine spatial filter
    ├── predictor.py           # Weather forecasts, wind vectors, and model prediction
    ├── train_model.py         # Trains the XGBoost Regressor
    ├── simulator.py           # Local IoT telemetry loop simulator
    ├── test_main.py           # Pytest unit testing suite
    ├── verify_system.py       # Local backend checks (seeding, validation, prediction)
    ├── verify_upgrades.py     # Production upgrades checks (logging, websockets)
    ├── Vaibhav_CleanedDataset.xlsx
    └── city_day.csv
```

---

## 📊 Solution Scaling & Implementation Strategy (Assignment 4B)

The project includes a 5-slide strategic presentation deck ([Vaibhav_ScalingStrategy.html](file:///Users/vaibhavarya/Documents/Culture/ass-2A/documents/Vaibhav_ScalingStrategy.html)) outlining the path to take **SmartAQI** from concept to wide-scale deployment:

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

## ⚙️ Environment Variables

The backend application supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy connection URL for the database | `sqlite:///smartaqi.db` |
| `TELEGRAM_BOT_TOKEN` | Bot API token from Telegram's BotFather | `""` |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for alert routing | `""` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins for CORS | `http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API Key for health check validation and advanced predictions | `""` |

---

## 🛠️ How to Run & Verify

### Local Development (Python/Uvicorn/Vite)
1. **Navigate to Backend:** `cd backend`
2. **Install Dependencies:** `pip install -r requirements.txt`
3. **Run Pytest Suite:** `pytest test_main.py -v` (Verify all tests pass)
4. **Run Upgrades Check:** `python verify_upgrades.py` (Verify logs file creation)
5. **Train ML Model:** `python train_model.py` (Outputs model file `aqi_predictor.pkl`)
6. **Start FastAPI Backend:** `uvicorn main:app --reload`
7. **Start Telemetry Simulator (in new terminal):** `python simulator.py`
8. **Start React Frontend (in new terminal):** `cd ../frontend`, run `npm install`, then `npm run dev` and open `http://localhost:3000`.

### Production Deployment (Docker Compose)
Ensure Docker Desktop is running on your machine:
```bash
docker-compose up --build
```
* Access the frontend on `http://localhost:3000`
* Access API swagger docs on `http://localhost:8000/docs`

---

## 🌐 Production Cloud Deployment (Zero-Cost)

The SmartAQI application is designed to be deployed for free on cloud platforms:

### 1. Backend API (Render)
The backend service is configured for Docker-based deployment on **Render**:
1. Connect your GitHub repository to [Render](https://render.com/).
2. Create a new **Web Service** and choose the repository.
3. Render will auto-detect the `render.yaml` configuration in your repository root, setting up the Docker build context for `./backend`.
4. Configure the following environment variables in the Render Dashboard:
   * `DATABASE_URL`: Your production Postgres database connection string (e.g. from Supabase).
   * `CORS_ORIGINS`: Comma-separated list of allowed origins, including your Vercel frontend URL.
   * `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `GEMINI_API_KEY`.

### 2. Frontend Client (Vercel)
The React client is optimized for static SPA hosting on **Vercel**:
1. Connect your repository to [Vercel](https://vercel.com/).
2. Create a new project and select the `./frontend` directory as the root.
3. Set the following environment variable in the Vercel project settings:
   * `VITE_API_URL`: The HTTPS URL of your deployed Render backend API.
4. Deploy the project. The custom `vercel.json` rewrite rules will automatically handle SPA routing redirects.

---

## 🖨️ How to Export the Strategy Presentation to PDF
1. Open the [Vaibhav_ScalingStrategy.html](file:///Users/vaibhavarya/Documents/Culture/ass-2A/documents/Vaibhav_ScalingStrategy.html) file in Google Chrome or Apple Safari.
2. Press `Cmd + P` (Mac) or `Ctrl + P` (Windows) to trigger the Print Dialog.
3. Configure the following export parameters:
   * **Destination:** Save as PDF
   * **Layout:** Landscape
   * **Paper Size:** A4 (or US Letter)
   * **Margins:** None (or Default)
   * **Background graphics:** Checked (Crucial for importing dark styles and gradients)
4. Click **Save** and save it as `Vaibhav_ScalingStrategy.pdf`.
