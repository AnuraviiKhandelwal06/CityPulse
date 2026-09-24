from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

import database
import state
from api.events import router as events_router
from api.alerts import router as alerts_router
from api.zones import router as zones_router

from ingestion.weather import fetch_real_weather, simulate_weather_scenario
from ingestion.traffic import simulate_traffic
from ingestion.incidents import simulate_civic_incidents
from normalization.normalizer import (
    normalize_weather_event,
    normalize_traffic_event,
    normalize_incident_event
)
from analytics.anomaly import AnomalyDetector
from analytics.correlation import group_temporal_events
from analytics.geo import filter_geo_correlated_events
from analytics.severity import build_disruption_event
from ai.summarizer import generate_grounded_summary

app = FastAPI(title="CityPulse Civic Intelligence Engine", version="1.0.0")

# Enable CORS universally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(alerts_router)
app.include_router(zones_router)

anomaly_detector = AnomalyDetector(threshold=1.5)

def run_pipeline_step(step: int, use_real_weather: bool = False):
    """
    Ingests and normalizes the events for a given simulation step into SQLite.
    """
    zone_name = "Malviya Nagar"
    if use_real_weather and step == 0:
        raw_weather = fetch_real_weather()
    else:
        raw_weather = simulate_weather_scenario(step)

    raw_traffic = simulate_traffic(step, area=zone_name)
    raw_incident = simulate_civic_incidents(step, zone=zone_name)

    weather_event = normalize_weather_event(raw_weather, zone=zone_name)
    traffic_events = normalize_traffic_event(raw_traffic)
    incident_event = normalize_incident_event(raw_incident)

    all_step_events = [weather_event] + traffic_events + [incident_event]
    for evt in all_step_events:
        database.save_event(evt)

    # If critical step, persist disruption alert
    if step >= 3:
        alert = state.get_active_alert(step)
        if alert:
            database.save_alert(alert)

@app.on_event("startup")
def on_startup():
    database.init_db()
    database.clear_db()
    run_pipeline_step(step=4)

@app.get("/api/metrics")
def get_metrics():
    return state.get_step_metrics()

@app.get("/api/timeline")
def get_timeline():
    return [
        {
            "time": "00:00",
            "title": "Baseline Normal",
            "desc": "Normal flow, clear weather across all corridors",
            "color": "bg-tertiary",
            "textColor": "text-tertiary",
            "isAlert": False,
            "step": 0
        },
        {
            "time": "05:00",
            "title": "Rain Spike Detected",
            "desc": "Precipitation rate jumps to 78.4 mm/h cloudburst",
            "color": "bg-primary",
            "textColor": "text-primary",
            "isAlert": False,
            "step": 1
        },
        {
            "time": "10:00",
            "title": "Traffic Slows Down",
            "desc": "Vehicular speed drops below 8.5 km/h on Malviya Ring",
            "color": "bg-primary",
            "textColor": "text-primary",
            "isAlert": False,
            "step": 2
        },
        {
            "time": "15:00",
            "title": "Waterlogging Reported",
            "desc": "14 citizen 311 flood calls logged near underpass",
            "color": "bg-secondary",
            "textColor": "text-secondary",
            "isAlert": False,
            "step": 3
        },
        {
            "time": "20:00",
            "title": "Critical Alert Triggered",
            "desc": "Multi-stream disruption confirmed across all 3 feeds",
            "color": "bg-error",
            "textColor": "text-error",
            "isAlert": True,
            "step": 4
        }
    ]

@app.get("/api/summary")
def get_summary():
    step = state.get_current_step()
    alert = state.get_active_alert(step)
    if alert:
        return {
            "summary": alert.explanation,
            "summary_html": alert.summary_html,
            "zone": alert.zone,
            "severity": alert.severity,
            "confidence": alert.confidence,
            "disclaimer": "Correlation detected; causation is not established.",
            "spatial_overlap_km": alert.spatial_overlap_km,
            "temporal_overlap_minutes": alert.temporal_overlap_minutes,
            "step": step
        }
    analytics = state.compute_step_analytics(step)
    if step == 1:
        msg = f"Emerging localized precipitation detected around Malviya Nagar ({analytics['rain_val']:.1f} mm/h). Traffic flow and civic complaint volumes remain within standard operational bounds."
    else:
        msg = "All municipal systems and sensor streams indicate normal baseline operations across all monitored Delhi sectors. No anomalous spatiotemporal clusters detected."
    return {
        "summary": msg,
        "summary_html": msg,
        "zone": "Citywide",
        "severity": "LOW",
        "confidence": 0.95,
        "disclaimer": "Correlation detected; causation is not established.",
        "spatial_overlap_km": 0.0,
        "temporal_overlap_minutes": 0.0,
        "step": step
    }

@app.get("/api/simulation/current")
def get_simulation_status():
    step = state.get_current_step()
    meta = state.get_step_meta(step)
    return {
        "current_step": step,
        **meta
    }

@app.post("/api/simulation/set-step")
def set_simulation_step(step: int = Query(..., ge=0, le=4)):
    new_step = state.set_current_step(step)
    run_pipeline_step(new_step)
    meta = state.get_step_meta(new_step)
    return {
        "status": "step_updated",
        "current_step": new_step,
        **meta
    }

@app.post("/api/simulation/step")
def advance_simulation_step(delta: int = Query(1)):
    new_step = state.advance_step(delta)
    run_pipeline_step(new_step)
    meta = state.get_step_meta(new_step)
    return {
        "status": "step_advanced",
        "current_step": new_step,
        **meta
    }

@app.post("/api/simulation/reset")
def reset_simulation():
    new_step = state.reset_step()
    database.clear_db()
    run_pipeline_step(0)
    meta = state.get_step_meta(0)
    return {
        "status": "reset_to_baseline",
        "current_step": 0,
        **meta
    }

@app.post("/api/simulation/start")
def start_simulation():
    new_step = state.set_current_step(0)
    database.clear_db()
    run_pipeline_step(0)
    meta = state.get_step_meta(0)
    return {
        "status": "simulation_started",
        "current_step": 0,
        **meta
    }
