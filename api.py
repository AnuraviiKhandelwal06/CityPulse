"""
api.py - Plain Python Pipeline Serving Interface for CityPulse.

Provides a clean, framework-independent Python Pipeline class for teammates' backend integration.
Methods:
- load_pipeline(data_dir): Ingests data and initializes engine.
- analyze(events_payload): Analyzes live/submitted events payload and returns active alerts.
- replay(as_of_timestamp): Filters timeline up to as_of_timestamp and runs analysis as of that point.
"""

from pathlib import Path
from typing import Dict, List, Any, Union, Optional
import pandas as pd

from config import ZONE_NAMES, SEVERITY_WEIGHTS, format_iso_timestamp
from normalize import load_and_normalize, normalize_all
from anomaly import detect_anomalies
from correlate import correlate_anomalies, group_citywide_alerts
from scoring import score_relationship
from summary import generate_summary


class Pipeline:
    """
    CityPulse Intelligence Engine Pipeline Class.
    Pure Python, framework-independent, returning JSON-serializable dicts.
    """
    
    def __init__(self, data_dir: Union[str, Path] = "data/raw"):
        self.data_dir = Path(data_dir)
        self.is_loaded = False
        self.raw_events: List[Dict[str, Any]] = []
        self.anomalies: List[Dict[str, Any]] = []
        self.relationships: List[Dict[str, Any]] = []
        self.citywide_alerts: List[Dict[str, Any]] = []
        self.zone_alerts: List[Dict[str, Any]] = []

    def load_pipeline(self, data_dir: Optional[Union[str, Path]] = None) -> Dict[str, Any]:
        """
        Ingest data files and execute initial baseline analysis.
        """
        if data_dir is not None:
            self.data_dir = Path(data_dir)

        print(f"[Pipeline] Loading pipeline from: {self.data_dir}")
        self.raw_events = load_and_normalize(self.data_dir)
        self.anomalies = detect_anomalies(self.raw_events)
        self.relationships = correlate_anomalies(self.anomalies, max_time_diff_minutes=30.0)
        self.citywide_alerts = group_citywide_alerts(self.relationships)
        
        self.zone_alerts = []
        for rel in self.relationships:
            scores = score_relationship(rel)
            summary_text = generate_summary(rel, scores, ZONE_NAMES)
            
            self.zone_alerts.append({
                "alert_id": rel['id'],
                "zone_id": rel['zone_id'],
                "zone_name": ZONE_NAMES.get(rel['zone_id'], f"Zone {rel['zone_id']}"),
                "event_types": rel['event_types'],
                "time_span_minutes": rel['time_span_minutes'],
                "severity_score": scores['severity_score'],
                "severity_band": scores['severity_band'],
                "confidence_score": scores['confidence_score'],
                "confidence_breakdown": scores['confidence_breakdown'],
                "summary": summary_text,
                "evidence": rel['evidence']
            })
            
        self.is_loaded = True
        
        return {
            "status": "success",
            "message": "Pipeline loaded and analyzed successfully.",
            "total_unified_events": len(self.raw_events),
            "flagged_anomalies": len([a for a in self.anomalies if a['is_anomaly']]),
            "zone_alerts_count": len(self.zone_alerts),
            "citywide_alerts_count": len(self.citywide_alerts)
        }

    def analyze(self, events_payload: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Analyze a submitted list of UnifiedEvents or run analysis on loaded state.
        """
        if events_payload is not None and len(events_payload) > 0:
            target_events = events_payload
        else:
            if not self.is_loaded:
                self.load_pipeline()
            target_events = self.raw_events

        anomalies = detect_anomalies(target_events)
        relationships = correlate_anomalies(anomalies, max_time_diff_minutes=30.0)
        citywide_alerts = group_citywide_alerts(relationships)
        
        zone_alerts = []
        for rel in relationships:
            scores = score_relationship(rel)
            summary_text = generate_summary(rel, scores, ZONE_NAMES)
            zone_alerts.append({
                "alert_id": rel['id'],
                "zone_id": rel['zone_id'],
                "zone_name": ZONE_NAMES.get(rel['zone_id'], f"Zone {rel['zone_id']}"),
                "event_types": rel['event_types'],
                "time_span_minutes": rel['time_span_minutes'],
                "severity_score": scores['severity_score'],
                "severity_band": scores['severity_band'],
                "confidence_score": scores['confidence_score'],
                "confidence_breakdown": scores['confidence_breakdown'],
                "summary": summary_text,
                "evidence": rel['evidence']
            })

        return {
            "status": "success",
            "active_zone_alerts": zone_alerts,
            "citywide_alerts": citywide_alerts,
            "total_alerts": len(zone_alerts) + len(citywide_alerts)
        }

    def replay(self, as_of_timestamp: str) -> Dict[str, Any]:
        """
        Replay pipeline state as of a historical timestamp (ISO-8601 string).
        Only uses data with timestamp <= as_of_timestamp.
        """
        if not self.is_loaded:
            self.load_pipeline()

        as_of_iso = format_iso_timestamp(as_of_timestamp)
        
        # Strict temporal filter: data <= as_of_iso
        filtered_events = [e for e in self.raw_events if e['timestamp'] <= as_of_iso]
        
        if not filtered_events:
            return {
                "status": "warning",
                "as_of_timestamp": as_of_iso,
                "message": f"No events recorded prior to {as_of_iso}",
                "active_zone_alerts": [],
                "citywide_alerts": []
            }

        res = self.analyze(events_payload=filtered_events)
        res["as_of_timestamp"] = as_of_iso
        res["historical_event_count"] = len(filtered_events)
        return res


def load_pipeline(data_dir: str = "data/raw") -> Pipeline:
    """Helper factory function to create and initialize a Pipeline instance."""
    pipe = Pipeline(data_dir)
    pipe.load_pipeline()
    return pipe


if __name__ == "__main__":
    print("Testing api.py Pipeline class...")
    pipe = load_pipeline("data/raw")
    
    # Test analyze
    analysis_res = pipe.analyze()
    print(f"Analyze Status: {analysis_res['status']}, Active Zone Alerts: {len(analysis_res['active_zone_alerts'])}")
    
    # Test replay as of 2026-09-20T14:30:00
    replay_res = pipe.replay("2026-09-20T14:30:00")
    print(f"Replay Status: {replay_res['status']}, As Of: {replay_res['as_of_timestamp']}, Events: {replay_res['historical_event_count']}")
    assert replay_res['status'] == 'success'
    print("api.py OK - Plain Python Pipeline class verified successfully.")
