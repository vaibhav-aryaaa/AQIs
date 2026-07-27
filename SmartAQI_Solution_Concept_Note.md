# Solution Concept Note: SmartAQI
### AI-Powered Air Quality Monitoring and Decision Support System for Indian Cities
**Prepared by:** Vaibhav Arya (Lead Architect) & AI Assistant (Co-Designer)  
**Target:** 100% Free (₹0 Cost) Prototype Implementation & Simulation  
**Document State:** Final Concept Note (Print-Ready 2-Page Document)  
**Date:** June 2026  

---

## 1. Problem Definition
Rapid urbanization has made air pollution a critical environmental and public health crisis in India. Analysis of historical ambient air quality data (2015–2020) highlights two key characteristics of urban pollution in major cities such as Delhi, Patna, and Ahmedabad:
* **Primary Drivers:** Carbon Monoxide (CO) shows the strongest positive correlation with overall AQI ($r = 0.68$), followed closely by Fine Particulate Matter (PM2.5) ($r = 0.66$). This shows that vehicular emissions and combustion are the primary contributors.
* **Telemetry Anomalies:** The dataset exhibits severe anomalies, such as Ahmedabad recording an astronomical AQI peak of 2049.0 on February 19, 2018 (with CO levels at 132.47 mg/m³), and another massive CO spike of 175.81 mg/m³ in late 2017. These indicate localized incidents (like landfill fires) or sensor malfunctions.

**The Gap:** Standard ambient monitoring (CAAQMS) is sparse due to the high cost of equipment (₹1.5–2 million per station), leaving massive spatial blind spots. Telemetry is broadcast raw without verification, and systems lack local predictive and response-triggering capabilities. 

---

## 2. System Design
**SmartAQI** is a modular, 100% free (₹0 cost) software prototype that simulates a high-density micro-sensor grid, validates incoming telemetry against spatial neighbors, forecasts short-term trends using machine learning, and dispatches automated alerts.

### System Architecture
The system consists of local/cloud-hosted open-source layers:
```
  [Simulation Layer]   ──►  Python Multi-Node Simulator (simulator.py)
                                     │ (HTTP POST JSON telemetry)
                                     ▼
  [API Gateway Layer]  ──►  FastAPI Web Server (JWT Token Auth)
                                     │ (Python function calls)
                                     ▼
  [Processing Layer]   ──►  Validation Script & Scikit-Learn ML Models
                                     │ (SQLAlchemy ORM writes)
                                     ▼
  [Data Storage Layer] ──►  PostgreSQL (Supabase Cloud) / Local SQLite
                                     │ (REST & WebSockets)
                                     ▼
  [Client & Alerts]    ──►  React Dashboard (Leaflet.js) & Telegram Bot API
```

### Component Details
* **Multi-Node Simulator:** Generates synthetic PM2.5 and CO readings across 10 coordinates, simulating daily traffic patterns and injecting random sensor failures.
* **FastAPI Server:** Serves endpoints for data ingestion, user profiles, and triggers the machine learning pipeline.
* **Supabase / SQLite Database:** Relational databases storing sensor logs, validated records, and alert thresholds.
* **Scikit-Learn ML Engine:** Runs spatial-temporal validation to isolate anomalies (like the Ahmedabad outlier) and fits a regression model to forecast next-day AQI.
* **React Web Dashboard:** Renders an interactive map using Leaflet.js and plots AQI trends over time with Chart.js.
* **Telegram Bot API:** Integrates a free notification channel to broadcast alerts to public channels.

---

## 3. Data Flow
The process of capturing, validating, storing, predicting, and acting upon air quality data.

### Step-by-Step Data Flow
1. **Data Generation:** Every 5 minutes, the Python simulator runs, generates pollutant values (PM2.5, PM10, CO) for the mock city coordinates, and transmits the JSON payload.
2. **Ingestion & Sanity Filtering:** The FastAPI endpoint receives the payload. A Pydantic schema validates the structure. A quick sanity check ensures values aren't negative or empty.
3. **Spatial Anomaly Detection:** The validation module queries the database for active nodes within a 2 km radius. If the node's reading deviates by more than 3 standard deviations from its neighbors, it is flagged as Anomalous and quarantined.
4. **Database Write:** Clean, validated logs are written to the database.
5. **AQI Forecasting:** Once per hour, a background task triggers the Scikit-learn model. It predicts the average AQI for the next day, factoring in wind speed and humidity variables retrieved from a free meteorological API.
6. **Notification Trigger:** If the forecasted AQI is above 150, the backend calls the Telegram Bot API to notify users. The dashboard is updated in real time via WebSockets.

### Data Flow Diagram
```
  [Python Simulator] ──► (HTTP POST JSON) ──► [FastAPI Ingestion]
                                                      │
                                                      ▼
                                           [Validation Script]
                                                      │
                              ┌───────────────────────┴───────────────────────┐
                              ▼ (If Anomalous: Flag)                          ▼ (If Valid: Save)
                     [Error Log Database]                             [PostgreSQL Database]
                                                                              │
                                                                              ▼
                                                                     [Scikit-Learn ML]
                                                                              │
                                                                              ▼
                                                                    [Alert & Action Logic]
                                                                              │
                              ┌───────────────────────┬───────────────────────┴───────────────────────┐
                              ▼ (Public Alert)        ▼ (Dashboard Update)                            ▼ (Analytics API)
                       [Telegram Bot API]       [React Dashboard via WS]                     [JSON Export Endpoint]
```

---

## 4. Expected Impact
* **Environmental Impact:** Enables target-specific mist-sprinkling and traffic diversions to suppress pollution spikes, limits exposure for citizens, and provides a low-cost, scalable framework.
* **Health & Safety:** Enables asthmatics and outdoor workers to check micro-local conditions and receive notification alerts prior to severe pollution buildup.
* **Academic/Development Feasibility:** Provides a complete end-to-end framework that can be built, coded, and demonstrated in a college or internship setting.
* **Scalability:** The code can easily scale from running on a local laptop to a cloud VM (e.g., free tier on Render or Vercel) to monitor a larger municipal pilot zone.
