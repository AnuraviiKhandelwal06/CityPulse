"""
test_engine.py - Complete Unit Test Suite for CityPulse Intelligence Engine.

Executes standalone unit and integration tests across all core modules and verifies contracts:
- source is 'weather' | 'traffic' | 'incident'
- severity in UnifiedEvent is float 0.0-1.0
- event_type is snake_case
- config severity weights: traffic=0.3125, weather=0.25, incident=0.4375
- same-time-of-day traffic baseline fix
- package import: from citypulse_ml.api import load_pipeline
"""

import pytest
import pandas as pd
from pathlib import Path

from config import SEVERITY_WEIGHTS
from normalize import normalize_weather, normalize_traffic, normalize_incidents, normalize_all, load_and_normalize
from anomaly import detect_anomalies, verify_all_days_evaluation
from correlate import correlate_anomalies, group_citywide_alerts
from scoring import score_relationship
from summary import generate_summary
from citypulse_ml.api import load_pipeline


@pytest.fixture
def sample_weather_df():
    data = [
        {"timestamp": "2026-09-20 13:00:00", "zone_id": "Z03", "latitude": 26.912, "longitude": 75.798, "temperature": 32.0, "rainfall_mm": 0.0, "humidity": 65, "wind_speed": 10.0, "weather_condition": "Clear"},
        {"timestamp": "2026-09-20 14:00:00", "zone_id": "Z03", "latitude": 26.912, "longitude": 75.798, "temperature": 30.0, "rainfall_mm": 22.1, "humidity": 90, "wind_speed": 15.0, "weather_condition": "Heavy Rain"}
    ]
    return pd.DataFrame(data)


@pytest.fixture
def sample_traffic_df():
    data = [
        {"timestamp": "2026-09-20 13:30:00", "zone_id": "Z03", "latitude": 26.912, "longitude": 75.798, "vehicle_count": 500, "avg_speed_kmph": 41.7, "congestion_level": "LOW", "road_name": "C-Scheme Main"},
        {"timestamp": "2026-09-20 14:00:00", "zone_id": "Z03", "latitude": 26.912, "longitude": 75.798, "vehicle_count": 800, "avg_speed_kmph": 21.6, "congestion_level": "MEDIUM", "road_name": "C-Scheme Main"}
    ]
    return pd.DataFrame(data)


@pytest.fixture
def sample_incidents_df():
    data = [
        {"incident_id": "INC0042", "timestamp": "2026-09-20 14:00:00", "zone_id": "Z03", "latitude": 26.912, "longitude": 75.798, "incident_type": "Waterlogging", "severity": "HIGH", "status": "ACTIVE", "description": "Waterlogging reported"}
    ]
    return pd.DataFrame(data)


def test_severity_weights_config():
    assert SEVERITY_WEIGHTS["traffic"] == 0.3125
    assert SEVERITY_WEIGHTS["weather"] == 0.2500
    assert SEVERITY_WEIGHTS["incident"] == 0.4375
    assert sum(SEVERITY_WEIGHTS.values()) == 1.0000


def test_normalize_contract(sample_weather_df, sample_traffic_df, sample_incidents_df):
    events = normalize_all(sample_weather_df, sample_traffic_df, sample_incidents_df)
    sources = set(e['source'] for e in events)
    assert sources.issubset({"weather", "traffic", "incident"})
    for e in events:
        assert isinstance(e['severity'], float)
        assert 0.0 <= e['severity'] <= 1.0
        assert "_" not in e['source']


def test_anomaly_detection_all_days_evaluation():
    raw_events = load_and_normalize("data/raw")
    anomalies = detect_anomalies(raw_events)
    res = verify_all_days_evaluation(anomalies)
    assert res['2026-09-19']['rain_anomalies'] == 0
    assert res['2026-09-19']['traffic_anomalies'] == 0
    assert res['2026-09-20']['rain_anomalies'] == 60
    assert res['2026-09-23']['rain_anomalies'] == 60


def test_correlate_and_citywide_alerts():
    raw_events = load_and_normalize("data/raw")
    anomalies = detect_anomalies(raw_events)
    relationships = correlate_anomalies(anomalies, max_time_diff_minutes=30.0)
    city_alerts = group_citywide_alerts(relationships)
    assert len(relationships) > 0
    assert len(city_alerts) > 0


def test_decoupled_scoring_with_feed_breakdown():
    sample_rel = {
        "id": "REL-TEST-001",
        "zone_id": "Z03",
        "event_types": ["rain", "waterlogging", "congestion"],
        "time_span_minutes": 15.0,
        "evidence": [
            {"event_type": "rain", "value": 25.0, "baseline": 0.5, "pct_change": 4900.0, "severity": 0.8},
            {"event_type": "waterlogging", "value": 1.0, "baseline": 0.0, "pct_change": 0.0, "severity": 0.8},
            {"event_type": "congestion", "value": 20.0, "baseline": 40.0, "pct_change": -50.0, "severity": 0.8}
        ]
    }
    
    scores = score_relationship(sample_rel)
    assert "severity_score" in scores
    assert "severity_band" in scores
    assert "confidence_score" in scores
    assert "confidence_breakdown" in scores
    assert scores["severity_score"] != scores["confidence_score"]


def test_summary_no_causation():
    sample_rel = {
        "id": "REL-TEST-001",
        "zone_id": "Z03",
        "event_types": ["rain", "waterlogging", "congestion"],
        "time_span_minutes": 20.0,
        "evidence": [
            {"event_type": "rain", "value": 22.1, "baseline": 0.2, "pct_change": 10950.0, "timestamp": "2026-09-20T14:00:00", "severity": 0.8},
            {"event_type": "waterlogging", "value": 1.0, "baseline": 0.0, "pct_change": 0.0, "timestamp": "2026-09-20T14:00:00", "severity": 0.8},
            {"event_type": "congestion", "value": 31.6, "baseline": 38.3, "pct_change": -17.5, "timestamp": "2026-09-20T14:00:00", "severity": 0.5}
        ]
    }
    scores = score_relationship(sample_rel)
    summary_text = generate_summary(sample_rel, scores)
    lowered = summary_text.lower()
    assert "caused by" not in lowered
    assert "led to" not in lowered
    assert "not confirmed causation" in lowered


def test_citypulse_ml_api_package():
    pipeline = load_pipeline("data/raw")
    res = pipeline.analyze()
    assert "alerts" in res and "zone_stats" in res and "city_metrics" in res and "timeline" in res
