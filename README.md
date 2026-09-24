🌆 CityPulse

Real-Time Civic Intelligence & Urban Situational Awareness Platform

CityPulse turns scattered civic signals into one understandable picture of what is happening, where it is happening, and why it matters.

CityPulse is a real-time civic intelligence platform designed to fuse heterogeneous city data, detect emerging cross-domain disruptions, correlate events across time and geography, and explain the evidence behind those disruptions in plain language.

Instead of showing disconnected dashboards for weather, traffic, and civic complaints, CityPulse focuses on event understanding rather than event display.

🚨 The Problem

Modern cities generate large amounts of information through separate systems:

🌧️ Weather and rainfall

🚗 Traffic conditions

🚌 Transit delays

🚧 Civic incidents

🏙️ Public complaints

⚡ Infrastructure outages

🌫️ Environmental signals

These systems often operate independently.

A potentially important situation may only become visible when several signals become abnormal at the same place and around the same time.

For example:

Heavy Rainfall
      ↓
Traffic Congestion
      ↓
Waterlogging Reports
      ↓
Transit Delays
      ↓
Possible Civic Disruption

CityPulse detects these relationships and presents them as a single, evidence-backed civic event.

💡 What CityPulse Does

CityPulse:

Ingests 3 distinct civic data streams

Normalizes heterogeneous data into a common event schema

Detects statistical anomalies in individual streams

Finds temporal correlations

Finds geographic correlations

Calculates severity and confidence separately

Generates grounded plain-language explanations

Displays the situation through one live dashboard

Provides an evidence-based WHY? view

Supports a scripted historical/live replay for demonstrations

Core principle

Correlation ≠ causation

CityPulse never blindly claims that one event caused another.

Instead of:

❌ "Rain caused the traffic."

It uses language such as:

✅ "Heavy rainfall coincides with increased traffic congestion and waterlogging reports in the same area."

This keeps the intelligence layer grounded and transparent.

🎯 One-Line Pitch

CityPulse is a real-time civic intelligence platform that fuses heterogeneous city data, detects emerging cross-domain disruptions, explains the evidence behind them, and gives residents and city operators a single view of what's happening and why it matters.

🖥️ Dashboard

The dashboard follows a three-column operational workspace:

Area

Purpose

Left

City Vitals + Active Incident Spotlight

Center

Live Map + Layer Controls + Replay

Right

Live Data Sources + Event Timeline

The interface includes:

Live system status

Critical alert banner

City-wide signal metrics

Incident severity

Evidence confidence

Interactive map

Data source health

Event timeline

Historical replay

WHY / evidence breakdown

Light / dark theme

The supplied UI mockup defines the three-column workspace, fixed header, alert banner, map controls, data-source panel, timeline, and operational visual language. fileciteturn2file0L4-L11

🔥 Key Features

1. Multi-Source Civic Data Fusion

CityPulse currently works with exactly three primary streams:

🌦️ Weather

Real weather data, using a service such as Open-Meteo.

Example fields:

temperature
rainfall
humidity
wind
weather_alert
latitude
longitude
timestamp

🚦 Traffic

Simulated traffic stream designed for deterministic hackathon demonstrations.

Example fields:

congestion_level
average_speed
traffic_incidents
road_blockage
area
latitude
longitude
timestamp

🚧 Civic Incidents

Simulated municipal incident stream.

Supported incident types include:

waterlogging
road_damage
power_outage
noise_complaint
garbage_complaint

The final project specification explicitly uses one real weather API plus simulated traffic and civic incidents so the demo does not depend on unreliable third-party feeds. fileciteturn2file1L92-L105

2. Unified Event Schema

Every source is normalized into the same structure:

{
  "id": "uuid",
  "source": "weather | traffic | incident",
  "event_type": "rain | congestion | waterlogging",
  "latitude": 26.85,
  "longitude": 75.81,
  "zone": "Zone 1",
  "timestamp": "2026-09-24T10:15:00",
  "value": 78.4,
  "unit": "mm/h",
  "severity": 0.72
}

The project specification defines this as the common normalized event shape used after ingestion. fileciteturn2file1L109-L123

3. Anomaly Detection

CityPulse maintains rolling baselines for each:

source + event type + zone

An event can be flagged when its current value significantly exceeds its baseline.

Example:

Normal Traffic     → 42%
Current Traffic    → 84%
                     ↑
               Anomaly detected

The v1 system intentionally uses explainable statistics rather than unnecessarily complex machine learning.

4. Temporal + Geographic Correlation

CityPulse combines two dimensions:

Temporal correlation

10:05  Rainfall Spike
10:10  Traffic Spike
10:15  Waterlogging Reports
10:20  Transit Delays

Geographic correlation

Events must also occur geographically close to one another.

The planned implementation uses a configurable temporal window and geographic distance threshold so that events that are close in time but far apart are not incorrectly merged. fileciteturn2file1L129-L152

5. Severity vs Confidence

These are intentionally kept separate.

Severity answers:

How serious is the situation?

Confidence answers:

How strong is the evidence for the detected relationship?

Example severity bands:

0.0 – 0.3  LOW
0.3 – 0.6  MEDIUM
0.6 – 0.8  HIGH
0.8 – 1.0  CRITICAL

The backend produces both values independently in a DisruptionEvent. fileciteturn2file1L145-L164

🧠 Intelligence Pipeline

┌──────────────────┐
│  Civic Data      │
│  Sources         │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Ingestion      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Normalization   │
│ UnifiedEvent     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Anomaly Detection│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Temporal         │
│ Correlation      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Geographic       │
│ Correlation      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Severity +       │
│ Confidence       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ DisruptionEvent  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Grounded AI      │
│ Summary          │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ CityPulse        │
│ Dashboard        │
└──────────────────┘

🤖 Grounded AI

The AI layer is deliberately constrained.

The LLM receives an already-computed structured disruption event and its contributing data.

It does not calculate the event itself.

It must:

Use only supplied facts

Never invent numbers

Never fabricate sources

Avoid causal claims

Explain correlations in plain language

Produce concise summaries

Example:

"Heavy rainfall coincides with increased traffic congestion, transit delays, and waterlogging reports in Malviya Nagar."

The final specification explicitly requires the LLM to receive only structured disruption information and to avoid invented numbers and causal language. fileciteturn2file1L169-L172

🎬 Deterministic Demo Scenario

CityPulse includes a scripted simulator so the hackathon demonstration does not depend on unpredictable third-party data.

T+00
│
├── All streams normal
│
T+05
│
├── Rainfall spikes
│
T+10
│
├── Traffic congestion spikes in the same zone
│
T+15
│
├── Waterlogging reports spike
│
T+20
│
├── Transit / traffic delay increases
│
▼
CityPulse detects a possible civic disruption
│
▼
WHY? evidence is displayed

This exact sequence is specified as the core demo scenario, with a compressed simulator timer so the anomaly can be triggered reliably during a presentation. fileciteturn2file1L35-L46

🔎 WHY? Evidence Panel

When an alert is opened, CityPulse can explain why it was generated.

Example:

Weather anomaly       ✓
Traffic anomaly       ✓
Civic incident spike  ✓
Temporal overlap      ✓
Geographic overlap    ✓
Data completeness     ✓

Severity:   HIGH
Confidence: 92%

The WHY panel is designed to expose evidence, spatial overlap, temporal overlap, confidence, and the grounded AI explanation. fileciteturn2file1L196-L209

🗺️ Live Map

The map is built using:

Leaflet

OpenStreetMap

Severity-based markers

Zone-level status

Layer controls

Clickable event popups

Map layers include:

All Layers
Rainfall
Traffic
Civic 311

The map replaces the mockup's placeholder visualization with real Leaflet markers driven by backend zone data. fileciteturn2file1L198-L206

⏪ Historical Replay

The dashboard includes a replay concept for reconstructing how a disruption developed.

00:00  Normal
05:00  Rain Spike
10:00  Traffic Slowdown
15:00  Waterlogging Reports
20:00  Critical Alert

This allows users to understand not just what is happening now, but how the situation evolved.

🌗 Light / Dark Theme

CityPulse supports both:

☀️ Light mode

🌙 Dark mode

The theme system uses CSS custom properties and a shared component system.

Theme preference is persisted using:

localStorage.theme

If no preference exists, the application respects:

prefers-color-scheme

The implementation specification requires a React ThemeProvider, shared token names, persisted theme selection, and a header toggle. fileciteturn2file1L62-L73

🏗️ Tech Stack

Layer

Technology

Frontend

React

Styling

Tailwind CSS

Backend

Python + FastAPI

Analytics

pandas, NumPy

ML

scikit-learn when genuinely needed

Database

SQLite

Maps

Leaflet + OpenStreetMap

Real-time

Polling initially

AI

LLM API

Deployment

Docker + Docker Compose

These technologies follow the final project specification. fileciteturn2file1L77-L87

📁 Project Structure

citypulse/
│
├── backend/
│   ├── main.py
│   │
│   ├── ingestion/
│   │   ├── weather.py
│   │   ├── traffic.py
│   │   └── incidents.py
│   │
│   ├── normalization/
│   │   └── normalizer.py
│   │
│   ├── analytics/
│   │   ├── anomaly.py
│   │   ├── correlation.py
│   │   ├── geo.py
│   │   └── severity.py
│   │
│   ├── ai/
│   │   └── summarizer.py
│   │
│   ├── models/
│   │   └── events.py
│   │
│   └── api/
│       ├── events.py
│       ├── alerts.py
│       └── zones.py
│
├── frontend/
│   └── src/
│       ├── theme/
│       │   ├── ThemeProvider.jsx
│       │   └── tokens.css
│       │
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── CriticalAlertBanner.jsx
│       │   ├── CityVitalsPanel.jsx
│       │   ├── ActiveIncidentPanel.jsx
│       │   ├── Map.jsx
│       │   ├── ReplayScrubber.jsx
│       │   ├── DataSourcesPanel.jsx
│       │   ├── TimelinePanel.jsx
│       │   └── WhyPanel.jsx
│       │
│       └── App.jsx
│
├── docker-compose.yml
└── README.md

The structure above follows the implementation scaffold in the final project specification. fileciteturn2file1L244-L285

🔌 API

The planned FastAPI interface exposes:

Endpoint

Purpose

GET /api/events

Normalized civic events

GET /api/alerts

Current disruption alerts

GET /api/alerts/{id}

Alert + complete evidence

GET /api/zones

Current zone statistics

GET /api/metrics

City-wide signal levels

GET /api/timeline

Historical events

GET /api/summary

Current AI-generated briefing

The API should gracefully handle missing feeds, invalid data, zero alerts, simultaneous alerts, and delayed responses. fileciteturn2file1L176-L190

🚦 MVP Priority

P0 — Must Work

3 civic data streams

Data normalization

Anomaly detection

Temporal correlation

Geographic correlation

Severity scoring

Confidence scoring

Live dashboard

Live map

Alerts

Plain-language summary

Light / dark theme

P1 — Make It Impressive

WHY / evidence panel

Event timeline

Historical replay

Advanced visual polish

P2 — Only If Time Allows

Ask CityPulse

Predictive alerts

Evidence graph

What-if simulation

The priority tiers are deliberately ordered so the project can still produce a complete MVP if hackathon time becomes limited. fileciteturn2file1L213-L222

🛡️ Design Constraints

CityPulse intentionally avoids unnecessary complexity.

Not included in the core MVP

Mobile application

Kubernetes

Microservices

Blockchain

IoT hardware integration

Advanced multi-agent AI

Large-scale ML infrastructure

The focus is:

Deep correlation + transparent evidence + clear civic explanation

The project specification explicitly prioritizes correlation depth and explanation over adding more feeds or infrastructure. fileciteturn2file1L291-L297

🧪 Demo Flow

A typical demonstration follows this sequence:

1. Everything is normal
        ↓
2. Simulate rainfall
        ↓
3. Traffic increases
        ↓
4. Waterlogging reports increase
        ↓
5. Transit delays appear
        ↓
6. CityPulse detects the cross-domain pattern
        ↓
7. Alert appears
        ↓
8. Open WHY? evidence
        ↓
9. Inspect spatial + temporal overlap
        ↓
10. Run historical replay
        ↓
11. Toggle light / dark mode

Only performance claims supported by actual measured demo data should be presented. fileciteturn2file1L301-L309

👥 Intended Users

Residents

Understand what is happening in their area without checking multiple sources.

City Operations Teams

Identify emerging multi-domain disruptions from one operational view.

Emergency Responders

Quickly understand where multiple civic signals are converging.

Journalists

Investigate developing city events using a timeline and evidence trail.

Local Businesses

Understand disruptions that may affect traffic, accessibility, or nearby activity.

🚀 Getting Started

Keep these commands synchronized with the actual repository configuration.

1. Clone

git clone <your-repository-url>
cd citypulse

2. Backend

cd backend
python -m venv .venv

Windows

.venv\Scripts\activate

Linux / macOS

source .venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Start FastAPI:

uvicorn main:app --reload

3. Frontend

cd frontend
npm install
npm run dev

4. Docker

docker compose up --build

🔐 Environment Variables

Keep secrets outside the repository.

Example:

LLM_API_KEY=your_api_key

Use a .env file locally and make sure it is included in .gitignore.

Never commit API keys, passwords, tokens, or private credentials.

📊 Example Disruption Event

{
  "id": "evt-001",
  "zone": "Malviya Nagar",
  "severity": "CRITICAL",
  "severity_score": 0.86,
  "confidence": 0.92,
  "contributing_events": [
    "weather-001",
    "traffic-001",
    "incident-001"
  ],
  "spatial_overlap_km": 1.4,
  "temporal_overlap_minutes": 22,
  "created_at": "2026-09-24T10:20:00"
}

This object becomes the structured foundation for the alert, evidence panel, and AI explanation.

🧠 Why CityPulse Is Different

Traditional civic dashboards often answer:

"What is happening?"

CityPulse aims to additionally answer:

"Which signals are connected?"

and:

"What evidence supports that interpretation?"

The key idea is:

Event Display
      ↓
Event Detection
      ↓
Cross-Domain Correlation
      ↓
Evidence
      ↓
Human-Readable Understanding

🏆 Hackathon Focus

CityPulse is designed for a constrained, approximately 24-hour hackathon build.

The implementation strategy prioritizes:

A working end-to-end pipeline

Deterministic demo data

Explainable analytics

Strong visualization

Clear evidence

Reliable degradation when data is unavailable

The project deliberately prioritizes a smaller number of deeply connected feeds over a large number of disconnected integrations.

📜 License

Add your preferred license here, for example:

MIT License

👨‍💻 Team

CityPulse — AmiHacks

Built as a civic-tech prototype focused on real-time data fusion, anomaly detection, geospatial correlation, and explainable urban intelligence.

⭐ If You Like the Project

Give the repository a ⭐ and explore how CityPulse turns disconnected civic signals into an understandable city-wide picture.
