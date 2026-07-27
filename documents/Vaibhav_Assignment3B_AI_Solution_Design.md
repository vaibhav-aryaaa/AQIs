# ASSIGNMENT 3B: AI-ENABLED SOLUTION DESIGN
## Project SmartAQI: Preemptive Air Quality Management and Decision Support System
**Course:** Sustainability Systems & Smart Cities  
**Author:** Vaibhav Arya  
**Date:** July 2026  

---

### 1. Problem & Solution Context
#### Assignment 3A Solution Summary (SmartAQI)
SmartAQI is a localized, low-cost air quality monitoring and decision-support system designed to address the air pollution crisis in Indian metropolitan areas (specifically northern and industrial hubs like Delhi, Patna, and Ahmedabad). Unlike traditional monitoring setups that rely on a few high-cost stations, SmartAQI utilizes a dense, distributed network of low-cost IoT nodes coupled with a centralized digital dashboard and automated communication gateways.

#### The Sustainability Problem
Indian cities suffer from severe concentrations of Fine Particulate Matter ($PM_{2.5}$) and Carbon Monoxide ($CO$). Historical data analysis shows that $CO$ ($r = 0.65$) and $PM_{2.5}$ ($r = 0.63$) are the dominant drivers of poor Air Quality Index (AQI) values. Traditional Continuous Ambient Air Quality Monitoring Stations (CAAQMS) are capital-intensive (costing ₹1.5–2 million each), resulting in sparse spatial coverage. This leaves critical urban "blind spots" (e.g., low-income neighborhoods, traffic intersections, and industrial fringes) where high pollution levels go unrecorded. Without hyper-local data, municipal bodies rely on blunt, city-wide emergency lockdowns (e.g., stopping all construction or closing schools), which cause severe economic disruption without resolving localized pollution spikes.

#### The Need for AI Integration
Traditional sensor networks are strictly *reactive*; they report historical or current conditions, offering no warning. Furthermore, low-cost sensors are prone to environmental noise, calibration drift, and severe telemetry anomalies—such as the historical outlier in Ahmedabad where AQI spiked to an impossible 2049.0 due to sensor malfunction. Integrating AI addresses these gaps by:
1. **Validating Telemetry in Real-Time:** Automatically identifying and filtering out faulty sensor readings (anomalies) before they cause public panic.
2. **Enabling Preemptive Action:** Forecasting localized AQI levels 24 hours in advance, allowing the municipal corporation to transition from passive observation to active, preventative mitigation.

---

### 2. AI Use Case
#### Integration Point
The AI engine is integrated directly within the **Data Processing and Analytics Layer** of the FastAPI backend, positioned immediately after raw telemetry ingestion and prior to database persistence and dashboard visualization.

```
[IoT Sensor Grid] ──> [Ingestion API] ──> [AI Processing Layer] ──> [Database / Alerts]
                                                 │
                                                 ├──> 1. Anomaly Filter (Validation)
                                                 └──> 2. Forecasting Engine (ML Inference)
```

#### Specific Problem Solved
The system must predict localized AQI variations 24 hours in advance ($t+24$ hours) across a complex, dynamic urban landscape. Ambient air quality does not change linearly; it is governed by complex micro-meteorological variables (planetary boundary layer height, temperature inversion, relative humidity, wind speed, and wind direction) and cyclical human activity (morning and evening traffic rushes). Traditional atmospheric chemistry transport models are too computationally expensive to run at a neighborhood scale in real time. The AI forecasting model solves this by mapping multi-variable, non-linear relationships to generate micro-local AQI predictions in milliseconds.

#### Justification for AI at this Stage
Machine learning is the only feasible approach for this task because it handles high-dimensional, multi-variable tabular data without requiring expensive physical modeling of fluid dynamics. By utilizing historical meteorological and pollutant data, the AI model learns the exact weather-pollution interactions of each urban zone. Deploying AI at the post-ingestion stage ensures that municipal decision-makers receive actionable alerts *before* a pollution event occurs, giving them the lead time necessary to deploy mitigation measures.

---

### 3. Input–Output Definition

| AI Component | Input Data | Processing | Output | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Temporal AQI Forecasting Engine** (XGBoost Regressor) | 1. **Historical Telemetry (24 hrs):** rolling averages of $PM_{2.5}$ ($\mu g/m^3$), $PM_{10}$ ($\mu g/m^3$), and $CO$ ($mg/m^3$) from target node.<br>2. **Meteorological Forecasts ($t+24$ hrs):** temperature (°C), relative humidity (%), wind speed (m/s), wind direction (degrees), boundary layer height (m) from Open-Meteo API.<br>3. **Temporal Features:** hour of the day, day of the week.<br>4. **Spatial Features:** node coordinate offset. | 1. **Data Cleaning:** Imputes minor data gaps using temporal interpolation.<br>2. **Feature Engineering:** Decomposes wind speed and direction into Cartesian wind vectors ($U$ and $V$ components) to model pollutant dispersion; converts time variables into cyclical sine/cosine components.<br>3. **Normalization:** Scales input features using MinMax scaling.<br>4. **Inference:** Feeds the feature vector into the trained XGBoost model. | 1. **Predicted AQI Value:** A continuous numerical index score for the target node location at $t+24$ hours.<br>2. **Risk Category:** Classified health status (e.g., "Moderate", "Poor", "Severe").<br>3. **Dominant Pollutant:** Identified driver of the AQI score ($PM_{2.5}$ or $CO$). | Populates the predictive hotspot map on the municipal dashboard and triggers automated policy decisions (alerts and work tickets) if the forecasted AQI exceeds the "Poor" threshold (>150). |

---

### 4. AI Capability
The selected AI capability for the SmartAQI system is **Prediction**.

#### Why Prediction Best Fits the Solution
1. **Preventative Action vs. Reactive Logging:** While *Anomaly Detection* identifies sensor failures and *Classification* categorizes current conditions, only *Prediction* estimates future numerical pollution levels. In sustainability, prevention is paramount. Municipalities cannot undo the health damage of a severe pollution event after it happens. Predicting a localized AQI spike 24 hours in advance gives authorities the exact window needed to take preventative measures—such as scheduling dust-suppressent misting trucks, halting construction, or diverting heavy traffic.
2. **Modeling Complex Weather Dynamics:** Air pollution is highly sensitive to meteorological shifts. For example, during cold winter mornings in northern India, temperature inversions trap pollutants near the surface. A predictive machine learning model incorporates wind vectors and boundary layer forecasts to capture these complex environmental dynamics, providing highly accurate spatial-temporal forecasts that rule-based systems cannot produce.

---

### 5. AI Workflow
The operational workflow follows a sequential, data-driven pipeline:

```
[DATA] ──> [PROCESSING] ──> [AI MODEL] ──> [OUTPUT] ──> [ACTION]
```

1. **Data Stage:** Low-cost IoT nodes transmit raw telemetry ($PM_{2.5}, PM_{10}, CO$) to the backend every 5 minutes. Simultaneously, the system queries the Open-Meteo API hourly to fetch 24-hour weather forecasts.
2. **Processing Stage:** FastAPI receives the data. The validation module imputes missing telemetry, computes rolling averages, calculates wind vectors ($U, V$ components), and scales the features.
3. **AI Model Stage:** The preprocessed feature vector is passed to the trained XGBoost Regressor model running on the backend.
4. **Output Stage:** The model generates a predicted numerical AQI score (e.g., 185, indicating "Poor") and designates the primary pollutant ($PM_{2.5}$) for the next 24 hours.
5. **Action Stage:** If the predicted AQI crosses the threshold (>150), the system automatically:
   - Dispatches a localized public health advisory to residents via a free Telegram channel bot.
   - Generates an automated mitigation ticket on the municipal dashboard (e.g., "Schedule road watering for Zone 3 at 07:00 AM").
   - Triggers dynamic traffic diversion recommendations for high-congestion zones.

#### Draw.io / Word Re-creatable Workflow Diagram
The following text-based flowchart maps the complete execution path. Each block can be easily copied and recreated as a shape in MS Word or draw.io:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               DATA STAGE                                │
│  ┌──────────────────────────────┐     ┌──────────────────────────────┐  │
│  │     IoT Sensor Telemetry     │     │   Meteorological Forecast    │  │
│  │ (Raw PM2.5, PM10, CO via HTTP)│     │  (Wind Speed, Temp, Humidity)│  │
│  └──────────────┬───────────────┘     └──────────────┬───────────────┘  │
└─────────────────┼────────────────────────────────────┼──────────────────┘
                  │                                    │
                  └─────────────────┬──────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            PROCESSING STAGE                             │
│  ┌──────────────────────────────┬────────────────────────────────────┐  │
│  │ • Missing Telemetry Imputation via Linear Interpolation            │  │
│  │ • Feature Engineering (Wind Vector U/V, Cyclical Time Features)    │  │
│  │ • MinMax Feature Normalization                                     │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             AI MODEL STAGE                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │           Trained XGBoost Regressor Model (24-Hour Lead)          │  │
│  │      (Maps temporal logs and weather forecasts to future AQI)     │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT STAGE                               │
│  ┌──────────────────────────────┬────────────────────────────────────┐  │
│  │ • Predicted Numeric AQI Score for t+24 Hours                      │  │
│  │ • Spatial Hotspot Coordinates and Risk Level (e.g., "Very Poor")  │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              ACTION STAGE                               │
│  ┌──────────────────────────────┼────────────────────────────────────┐  │
│  │ • Automated Telegram Alert dispatched to vulnerable citizens       │  │
│  │ • GRAP Mitigation Ticket opened on Municipal Dashboard             │  │
│  │ • Dynamic traffic diversion recommendations sent to Traffic Dept   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Recommended Tools & Platforms
To implement the prototype within a realistic, low-cost framework, the following stack is selected:

* **Python:** The core scripting language. It serves as the glue for the entire system, offering native libraries for data manipulation (`pandas`, `numpy`), API routing (`FastAPI`), and machine learning.
* **Google Colab:** Used as the training environment. It provides free cloud-based Jupyter Notebooks with GPU/TPU acceleration, allowing rapid model training, tuning, and validation without local computing overhead.
* **Scikit-learn:** Used for data preprocessing (feature scaling, train-test splitting) and baseline model selection. Its simplicity and extensive documentation make it perfect for building data pipelines.
* **XGBoost:** The primary machine learning library. Gradient boosted decision trees are highly efficient, require minimal tuning to outperform neural networks on tabular datasets, and execute fast enough to run on standard servers.
* **Supabase (Free Tier / PostgreSQL):** A modern, cloud-hosted relational database. It is PostgreSQL-compatible, allows seamless time-series queries, and provides built-in real-time API sync (via WebSockets) to update the dashboard immediately.
* **Open-Meteo API:** A free, developer-friendly meteorological API that provides high-resolution, hourly weather forecasts. This eliminates the need for expensive commercial weather data subscriptions.
* **Telegram Bot API:** Used as the primary notification gateway. It is 100% free, requires no credit card registration, and enables programmatic broadcasting of micro-targeted health alerts to specific neighborhood channels.

---

### 7. Conclusion
Integrating predictive AI into the SmartAQI framework changes the paradigm of urban environmental management from passive logging to proactive mitigation:
* **Efficiency:** Automating data validation and forecast-driven notifications removes the latency of human intervention, ensuring citizens and operators receive critical alerts immediately.
* **Scalability:** By substituting multi-million rupee monitoring stations with a dense grid of low-cost IoT nodes and a centralized, cloud-hosted AI engine, cities can scale their monitoring coverage by 10x at less than 5% of the capital cost.
* **Better Decision-Making:** Instead of implementing economically damaging, city-wide emergency lockdowns after pollution levels peak, municipalities can deploy hyper-local, targeted interventions (e.g., block-level traffic diversions or localized dust suppression) 24 hours in advance. This data-driven, preemptive approach directly protects public health while minimizing economic impact, making smart cities more resilient and sustainable.
