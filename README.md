# SmartAQI: Preemptive Air Quality Management & Decision Support System
*An AI-powered, block-level air quality monitoring, validation, and forecasting system for Indian cities.*

[![SmartAQI CI](https://github.com/vaibhav-aryaaa/AQIs/actions/workflows/ci.yml/badge.svg)](https://github.com/vaibhav-aryaaa/AQIs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![XGBoost](https://img.shields.io/badge/XGBoost-1E88E5?style=flat&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

🚀 **Live Demo:** [SmartAQI Dashboard](https://smartaqi.vercel.app)

---

### 📝 Problem ➔ Solution ➔ Impact Summary
* **Problem:** Sparse municipal monitoring grids (CAAQMS) leave massive spatial blind spots across Indian cities, broadcasting raw, unvalidated telemetry containing frequent sensor errors.
* **Solution:** SmartAQI introduces a high-density virtual sensor grid validated in real-time by a spatial **Haversine neighbor filter** ($>3\sigma$ outlier detection) and forecasted 24 hours in advance using an optimized **XGBoost Regressor** model trained on verified historical data.
* **Impact:** Preemptive alerts are pushed to citizens via Telegram, while hyper-local municipal response tickets automate target-level GRAP mitigation measures (e.g. site-specific mist spraying) to protect public health.

---

### 🏗️ System Architecture
```text
┌────────────────────────────────────────────────────────┐
│                  SIMULATED SENSOR GRID                 │
│      [Node 1]      [Node 2]      ...      [Node 36]     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST (Telemetry Ingest)
                            ▼
┌────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                    │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │   IP Rate Limiting    │   │   Haversine Filter    │  │
│  │    (slowapi: 60/m)    │   │  (Spatial Consistent) │  │
│  └───────────┬───────────┘   └───────────┬───────────┘  │
│              │                           │              │
│              ▼                           ▼              │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │   24h AI Forecast     │   │   Alembic DB Migration│  │
│  │  (XGBoost: R2=0.89)   │   │  (SQLite/PostgreSQL)  │  │
│  └───────────┬───────────┘   └───────────┬───────────┘  │
│              │                           │              │
│              ▼                           ▼              │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │  Telegram Alert Bot   │   │   WebSocket Broker    │  │
│  └───────────┬───────────┘   └───────────┬───────────┘  │
└──────────────┼───────────────────────────┼──────────────┘
               │                           │ JSON Event Stream
               ▼ (Alert Routing)           ▼ (Suspect Banners)
┌───────────────────────────┐   ┌────────────────────────────┐
│     TELEGRAM CHANNEL      │   │   REACT WEB DASHBOARD      │
│  "🚨 GRAP Alert Issued!" │   │(Leaflet Map & Live Charts) │
└───────────────────────────┘   └────────────────────────────┘
```

---

### 📸 Dashboard Demo
![SmartAQI Dashboard Demo](demo.gif)

------

## 📁 Repository Structure

```text
ass-2A/
├── docker-compose.yml         # Container orchestrator configuration
├── render.yaml                # Render cloud deployment settings
├── LICENSE                    # MIT License file
├── README.md                  # Project documentation
├── organize.sh                # Directory organization script
├── .gitignore                 # Excludes local databases, datasets, and models
├── documents/                 # Strategy presentation and concept note files
│   ├── Vaibhav_ScalingStrategy.html
│   ├── SmartAQI_Solution_Concept_Note.html
│   └── Vaibhav_Assignment3B_AI_Solution_Design.md
├── frontend/                  # React Frontend SPA client
│   ├── Dockerfile
│   ├── nginx.conf             # Nginx reverse proxy configurations
│   ├── vercel.json            # Vercel SPA routing configurations
│   ├── package.json
│   ├── .env.example           # Client configuration template
│   ├── vite.config.js
│   └── src/
│       ├── components/        # UI widgets and layouts
│       │   ├── LiveFeed.jsx        # Scrolling WS activity tracker panel
│       │   ├── LoadingSpinner.jsx  # Reusable state loading spinner
│       │   ├── MapWidget.jsx       # Leaflet map layers and offline indicators
│       │   ├── ForecastChart.jsx   # Telemetry history & model forecasts
│       │   └── TicketList.jsx      # Active municipal tickets sidebar
│       └── pages/             # Page layout containers
└── backend/                   # FastAPI Backend & XGBoost ML engine
    ├── Dockerfile
    ├── requirements.txt       # Pinned packages list (includes rich, psycopg2)
    ├── db.py                  # Programmatic Alembic runner and database seeding
    ├── config.py              # Centralized Pydantic BaseSettings config
    ├── main.py                # Server routes, rate limits, WebSocket brokers
    ├── validator.py           # Spatial Haversine neighbor consistency validator
    ├── predictor.py           # Meteorological forecasts and XGBoost predictions
    ├── train_model.py         # Trains the XGBoost Regressor model
    ├── simulator.py           # Rich-based IoT multi-node simulation CLI
    ├── test_main.py           # 11-point Pytest unit test suite
    ├── verify_upgrades.py     # Logging / WebSocket verification checks
    ├── Vaibhav_CleanedDataset.xlsx # Cleaned dataset (re-trained XGBoost)
    ├── migrations/            # Alembic schema migrations folder
    └── alembic.ini            # Alembic configuration
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
3. **Run DB Migrations:** `alembic upgrade head`
4. **Run Pytest Suite:** `pytest test_main.py -v` (Verify all 11 tests pass)
5. **Run Upgrades Check:** `python verify_upgrades.py` (Verify logs file creation)
6. **Train ML Model:** `python train_model.py` (Outputs model file `aqi_predictor.pkl` with R2 ~0.89)
7. **Start FastAPI Backend:** `uvicorn main:app --reload`
8. **Start Telemetry Simulator (in new terminal):** `python simulator.py`
9. **Start React Frontend (in new terminal):** `cd ../frontend`, run `npm install`, then `npm run dev` and open `http://localhost:3000`.

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

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
