🌆 CityPulse

Real-Time Civic Intelligence & Urban Situational Awareness

CityPulse turns scattered city signals into one understandable picture — helping people observe what is happening, understand why it matters, predict emerging risks, and explore possible responses.

🚨 Problem

Modern cities generate large amounts of data from different sources such as weather, traffic, civic incidents, waterlogging, and location-based events. The problem is that these signals are often scattered across different systems, making it difficult to understand what is unusual, which events are related, which areas are becoming risky, what could happen next, and what evidence supports an alert.

CityPulse adds an intelligence layer on top of heterogeneous civic data.

💡 Solution

CityPulse is a civic intelligence platform that follows:

Observe → Normalize → Detect → Correlate → Explain → Predict → Simulate → Respond

Instead of simply displaying city data, CityPulse tries to understand events and their relationships across time and location.

From scattered data to smarter cities.

✨ Key Features

🗺️ Live City Map

Centralized geospatial view of weather events, traffic conditions, civic incidents, risk zones, event locations, and active alerts using Leaflet + OpenStreetMap.

🚨 Anomaly Detection

Detects unusual traffic, rainfall, incidents, and zone activity using statistical baselines and Median/MAD-based anomaly detection.

🔗 Cross-Domain Correlation

Finds relationships between events using time and geographic proximity.

Example:

Heavy Rain + Traffic Congestion + Waterlogging
                 ↓
        Possible Compound Disruption

⚠️ Correlation ≠ Causation

CityPulse deliberately does not claim that one event caused another merely because they occur together. It uses evidence-based language such as:

“Heavy rainfall coincides with severe congestion and increased waterlogging reports.”

🔮 Predictive Risk

Estimates whether the current situation could develop into a disruption over the next 30–60 minutes.

The experimental model is a HistGradientBoostingClassifier using features such as rainfall, rolling rainfall, traffic speed change, vehicle count, waterlogging, and other incidents. The project uses Leave-One-Event-Out (LOEO) validation and achieved an experimental ROC-AUC of approximately 0.965 on the limited synthetic/demo dataset; this is not presented as 96.5% accuracy or as a production performance guarantee.

🧠 AI City Brief

Uses Gemini to convert structured city signals into plain-language, evidence-grounded summaries.

💬 Ask CityPulse

Conversational interface for questions such as:

What is happening right now?

Why is this zone high risk?

What are the major risk drivers?

Which areas are affected?

🎛️ What-If Simulator

Explore hypothetical scenarios such as reducing congestion or changing rainfall and see how predicted risk changes. The simulator is a decision-support tool and does not control real infrastructure.

🏙️ City Zones

Zone-level status, traffic, weather, incidents, predictions, and risk.

🕐 Replay / Event History

Replay how a situation developed over time, for example:

10:00 → Normal
10:05 → Heavy rainfall
10:10 → Traffic congestion
10:15 → Waterlogging
10:20 → High-risk alert

📊 Analytics

Historical trends, patterns, event activity, zone behavior, and risk signals.

🛡️ Response Center

Decision-support actions such as reviewing evidence, monitoring nearby zones, simulating alerts, and exploring traffic scenarios. Actions are explicitly simulation-only.

🏗️ System Architecture

                    ┌──────────────────────┐
                    │      CITY DATA       │
                    │ Weather / Traffic /  │
                    │ Civic Incidents      │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │       INGESTION      │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │     NORMALIZATION    │
                    │ Time + Location +    │
                    │ Common Event Schema  │
                    └──────────┬───────────┘
                               ↓
              ┌─────────────────────────────────┐
              │       INTELLIGENCE ENGINE       │
              │ Anomaly • Correlation • Geo •  │
              │ Severity • Confidence • Evidence│
              └───────────────┬─────────────────┘
                              ↓
              ┌───────────────┴────────────────┐
              ↓                                ↓
       ┌───────────────┐                ┌───────────────┐
       │ ML PREDICTION │                │    AI / LLM   │
       │ HistGradient  │                │  Gemini API   │
       │ 30–60m Risk   │                │ Brief + Q&A   │
       └───────┬───────┘                └───────┬───────┘
               └───────────────┬────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │     CITYPULSE UI     │
                    │ Map / Alerts / Risk  │
                    │ Zones / Analytics    │
                    │ Replay / Simulation  │
                    │ Ask CityPulse        │
                    └──────────────────────┘

🛠️ Technology Stack

Technology

Purpose

React

Interactive frontend

Vite

Frontend development and build

Tailwind CSS

Responsive UI styling

Leaflet

Interactive maps

OpenStreetMap

Map tiles

Python

Backend, analytics and ML

FastAPI

REST API and backend services

Uvicorn

ASGI server

Pandas

Data processing

NumPy

Numerical computation

Scikit-learn

Machine learning

HistGradientBoostingClassifier

Near-term risk prediction

Median/MAD

Statistical anomaly detection

SQLite

Structured data storage

Gemini API

AI summaries and conversational Q&A

Git + GitHub

Version control and collaboration

Docker

Containerization

Render

Backend deployment

Vercel

Frontend deployment

🔄 Data Flow

Ingestion — Load or fetch heterogeneous city data.

Normalization — Convert different formats into a common event structure with timestamp and location.

Detection — Identify abnormal behavior.

Correlation — Compare events across time and geographic proximity.

Risk Prediction — Estimate near-term disruption risk.

Explanation — Turn evidence into understandable summaries.

Visualization — Present results through the CityPulse dashboard.

Example normalized event:

{
  "id": "evt_123",
  "source": "weather",
  "event_type": "rain",
  "latitude": 26.85,
  "longitude": 75.81,
  "timestamp": "2026-09-24T10:20:00",
  "value": 42,
  "unit": "mm",
  "severity": 0.7
}

🤖 AI Layer

Gemini is used for:

AI City Brief

Natural-language explanations

Ask CityPulse

Evidence-grounded responses

The AI layer does not determine the raw risk score. Instead:

CityPulse Intelligence
        ↓
Evidence + Signals
        ↓
Gemini
        ↓
Human-readable explanation

AI API keys remain server-side and are stored as environment variables.

📊 Data Sources

The hackathon MVP uses public and synthetic civic data across three primary domains:

Weather

Rainfall, temperature, humidity, wind, location, timestamp.

Traffic

Congestion, speed, vehicle count, incidents, location, timestamp.

Civic Incidents

Waterlogging, road issues, complaints, outages, other incidents, location, timestamp.

🖥️ Product Pages

Overview / Command Center
City Map
Incident Intelligence
Prediction Center
Replay
What-If Simulator
City Zones
Analytics
Ask CityPulse
Data Hub
Response Center

Product story:

Observe → Understand → Explain → Predict → Simulate → Ask → Respond → Replay

🔐 Safety & Reliability

No personal/private civic data is required for the MVP.

AI API keys remain server-side.

Correlation is explicitly distinguished from causation.

Experimental ML results are presented with their limitations.

Simulation actions do not control real infrastructure.

AI services have timeout and deterministic fallback behavior.

Evidence-based summaries remain available when AI is unavailable.

🧪 Testing & Validation

The final project was tested across frontend routes, API endpoints, backend tests, ML tests, responsive layouts, theme switching, navigation, simulation flows, and AI fallback behavior.

Frontend routes:  11/11
Backend tests:    12 passed
ML tests:          7 passed
Total tests:      19 passed
Build:            Successful
API endpoints:    13/13 successful

🚀 Deployment

                    GitHub main
                         │
                ┌────────┴────────┐
                ↓                 ↓
             Vercel             Render
                │                 │
           React/Vite          FastAPI
            Frontend            Backend
                                  │
                         ┌────────┴────────┐
                         ↓                 ↓
                        ML              Gemini

Frontend — Vercel

Hosts the React/Vite application.

Backend — Render

Hosts FastAPI, analytics, and ML services.

Docker

Provides a consistent backend runtime and deployment environment.

🎯 Target Users

🏙️ City Operators

Monitor disruptions, understand risk drivers, compare zones, and explore scenarios.

👥 Citizens

Understand local conditions, view alerts, explore events, and get plain-language explanations.

📊 Analysts

Study historical patterns, replay events, analyze correlations, and explore risk trends.

🌟 Why CityPulse?

Most dashboards answer:

“What is happening?”

CityPulse aims to answer:

“What is happening, what signals are connected, why might it matter, what could happen next, and what happens under different scenarios?”

The core progression is:

Data Display
     ↓
Event Understanding
     ↓
Decision Support

🔮 Future Possibilities

More real-time city APIs

IoT sensor integration

Advanced time-series models

Better zone-level forecasting

Automated event monitoring agents

Historical event similarity

Advanced geospatial analysis

Additional simulation scenarios

Integration with official city systems

🏆 Hackathon MVP

The MVP focuses on:

3+ civic data domains

Data normalization

Timestamp and location alignment

Anomaly detection

Cross-domain correlation

Live city visualization

Near-term ML risk prediction

AI-generated explanations

Historical replay

What-If simulation

Conversational city intelligence

📁 Project Structure

CityPulse/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── backend/
│   ├── ai/
│   ├── analytics/
│   ├── api/
│   ├── data/
│   ├── ingestion/
│   ├── ml/
│   ├── models/
│   ├── normalization/
│   ├── tests/
│   ├── database.py
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── .gitignore
└── README.md

👥 Project

CityPulse — Real-Time Civic Intelligence & Urban Situational Awareness

Built for a 24-hour hackathon with a focus on civic data fusion, event intelligence, explainable analytics, predictive risk, and decision support.

CityPulse doesn't just show the city. It helps you understand the city.
