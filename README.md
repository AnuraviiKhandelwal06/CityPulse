# 🌆 CityPulse

### Real-Time Civic Intelligence & Urban Situational Awareness

CityPulse is a real-time civic intelligence platform that brings together different city data sources to provide a single, understandable view of what is happening across an urban area.

Instead of looking at separate dashboards for weather, traffic, and civic incidents, CityPulse connects these signals to identify unusual patterns, detect potential disruptions, and explain why they matter.

> **Event understanding, not event display.**

---

## 🚨 Problem

Modern cities generate huge amounts of data from different systems:

* 🌧️ Weather
* 🚗 Traffic
* 🚌 Public transportation
* 🚧 Civic incidents
* 🏙️ Citizen complaints
* ⚡ Infrastructure issues

However, this information is often scattered across independent systems.

A disruption may only become obvious when multiple signals change together.

For example:

**Heavy Rainfall → Traffic Congestion → Waterlogging → Transit Delays**

CityPulse identifies these cross-domain patterns and presents them as a unified civic situation.

---

## 💡 Solution

CityPulse combines multiple civic signals and analyzes them across **time and location**.

The platform can:

* Collect data from multiple civic sources
* Normalize different types of data
* Detect unusual activity
* Identify temporal relationships
* Identify geographic relationships
* Calculate severity and confidence
* Explain detected situations in plain language
* Display everything through a real-time dashboard
* Provide evidence behind important alerts

---

## 🔥 Key Features

### 📊 Real-Time Civic Intelligence

Monitor multiple city signals from a single dashboard instead of switching between separate systems.

### 🔎 Anomaly Detection

Identify unusual changes compared with normal activity.

For example:

```text
Normal Traffic     → 42%
Current Traffic    → 84%

⚠️ Significant traffic anomaly detected
```

### 🕒 Temporal Correlation

CityPulse looks for events that occur close together in time.

```text
10:05  Rainfall increases
10:10  Traffic congestion increases
10:15  Waterlogging reports increase
10:20  Transit delays increase
```

### 📍 Geographic Correlation

Events are also compared based on their geographic proximity.

This prevents unrelated events from being incorrectly grouped simply because they happened at the same time.

### 🚨 Disruption Detection

When multiple abnormal signals overlap in both time and location, CityPulse can surface a potential civic disruption.

### 🧠 Explainable Intelligence

Every important alert can be backed by evidence such as:

* Contributing signals
* Time overlap
* Geographic overlap
* Severity
* Confidence
* Source information

### 🤖 AI-Powered Summaries

CityPulse can convert structured analytical results into simple human-readable explanations.

For example:

> "Heavy rainfall coincides with increased traffic congestion and waterlogging reports in the same area."

The AI acts as an explanation layer rather than inventing or determining the underlying data.

### 🗺️ Interactive City Map

Visualize civic conditions geographically and identify areas experiencing abnormal activity.

### ⏪ Historical Replay

Follow how a civic disruption developed over time:

```text
Normal
  ↓
Rainfall Spike
  ↓
Traffic Increase
  ↓
Waterlogging Reports
  ↓
Transit Delays
  ↓
Disruption Detected
```

### 🌗 Light & Dark Mode

A responsive interface designed for both operational monitoring and everyday use.

---

## 🧠 Correlation ≠ Causation

One of the core principles of CityPulse is responsible interpretation of civic data.

CityPulse does not automatically claim:

> ❌ "Rain caused the traffic."

Instead, it communicates evidence-based relationships:

> ✅ "Heavy rainfall coincides with increased traffic congestion and waterlogging reports in the same area."

This distinction helps prevent misleading conclusions from correlated data.

---

## 🏗️ Technology

CityPulse is built using modern web and data technologies:

* **React** — User interface
* **Tailwind CSS** — Interface styling
* **Python** — Data processing and backend services
* **FastAPI** — API layer
* **pandas / NumPy** — Data analysis
* **scikit-learn** — Machine learning where appropriate
* **SQLite** — Data storage
* **Leaflet & OpenStreetMap** — Interactive mapping
* **LLM APIs** — Grounded natural-language explanations
* **Docker** — Containerization

---

## 🌐 Data Sources

CityPulse is designed to work with heterogeneous civic data.

The current concept uses:

### 🌦️ Weather

Weather and rainfall information from public weather services.

### 🚦 Traffic

Traffic conditions such as:

* Congestion
* Average speed
* Traffic incidents
* Road blockages

### 🚧 Civic Incidents

Examples include:

* Waterlogging
* Road damage
* Power outages
* Noise complaints
* Garbage complaints

The platform can work with both real and simulated data, making it suitable for demonstrations and environments where live civic feeds are unavailable.

---

## 🎯 Example Scenario

Imagine a city experiencing heavy rainfall.

CityPulse observes:

```text
🌧️ Heavy rainfall
       +
🚗 Increased congestion
       +
🚧 Waterlogging reports
       +
🚌 Transit delays
```

The signals occur within the same area and a similar time window.

CityPulse identifies the pattern and presents:

> 🚨 **Possible Civic Disruption Detected**

The user can then inspect the supporting evidence and understand how the situation developed.

---

## 👥 Who Can Use CityPulse?

### 🏠 Residents

Quickly understand what is happening around them.

### 🏙️ City Operations Teams

Monitor emerging disruptions across different civic systems.

### 🚑 Emergency Responders

Get a consolidated view of developing situations.

### 📰 Journalists

Understand how a city event developed and which signals contributed to it.

### 🏪 Local Businesses

Monitor disruptions that may affect accessibility, traffic, and nearby activity.

---

## 🌍 Vision

CityPulse aims to move civic dashboards from:

> **"Here are today's city statistics."**

to:

> **"Here is what is happening in the city, where it is happening, how the situation is developing, and what evidence supports it."**

By connecting previously isolated signals, CityPulse can help make complex urban information easier to understand and act upon.

---

## 🚀 Future Possibilities

CityPulse can be extended with:

* Predictive disruption alerts
* Citizen-facing notifications
* Advanced anomaly detection
* More civic data sources
* Air-quality monitoring
* Infrastructure monitoring
* Event relationship graphs
* Natural-language city queries
* What-if simulations
* Historical event comparison
* Automated operational recommendations

---

## 🛠️ Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 2. Local Setup

#### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend API will be available at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

#### Frontend (React + Vite + Tailwind CSS + Leaflet)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Docker Deployment
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## ⚙️ Architecture & Data Pipeline

```
[Open-Meteo Weather API]   [Simulated Traffic Stream]   [Simulated 311 Complaints]
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       ▼
                         Normalization Layer (UnifiedEvent)
                                       │
                                       ▼
                       Baseline & Anomaly Detection
                                       │
                                       ▼
                  Temporal Correlation (±30m Window)
                                       │
                                       ▼
                   Geographic Correlation (< 2km Haversine)
                                       │
                                       ▼
              Severity Scoring + Confidence Estimation (Kept Distinct)
                                       │
                                       ▼
                Grounded Plain-Language Synthesis (Non-Causal)
                                       │
                                       ▼
        FastAPI Endpoints ──► Real-Time React Dashboard (Leaflet + MD3)
```

---

## ⭐ Project

**CityPulse — Real-Time Civic Intelligence**

Built to explore how data fusion, geospatial analysis, anomaly detection, and AI-powered explanations can make urban information more understandable and actionable.
