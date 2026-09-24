"""
citypulse_ml/api.py - Python Pipeline Serving Interface for CityPulse.

Importable via: from citypulse_ml.api import load_pipeline

Methods:
- load_pipeline(data_dir): Ingests data and initializes engine.
- analyze(events_payload): Returns alerts, zone_stats, city_metrics, timeline dicts.
- replay(as_of_timestamp): Filters timeline up to as_of_timestamp and returns state as of that point.
"""

import sys
from pathlib import Path

# Add project root to sys.path if needed
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

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
        self.zone_stats_data: Dict[str, Any] = {}
        self.city_metrics_data: Dict[str, Any] = {}
        self.timeline_data: List[Dict[str, Any]] = []

    def load_pipeline(self, data_dir: Optional[Union[str, Path]] = None) -> Dict[str, Any]:
        """
        Ingest data files and initialize baseline analysis state.
        """
        if data_dir is not None:
            self.data_dir = Path(data_dir)

        self.raw_events = load_and_normalize(self.data_dir)
        self.is_loaded = True
        return self.analyze(events_payload=self.raw_events)

    def analyze(self, events_payload: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Analyze a submitted list of UnifiedEvents or run analysis on loaded state.
        Returns contract keys: alerts, zone_stats, city_metrics, timeline.
        """
        if events_payload is not None and len(events_payload) > 0:
            target_events = events_payload
        else:
            if not self.is_loaded:
                self.load_pipeline()
            target_events = self.raw_events

        anomalies = detect_anomalies(target_events)
        flagged = [a for a in anomalies if a['is_anomaly']]
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

        # Calculate zone_stats
        events_df = pd.DataFrame(target_events)
        zone_stats = {}
        for zid, zname in ZONE_NAMES.items():
            z_events = events_df[events_df['zone_id'] == zid] if not events_df.empty else pd.DataFrame()
            z_anom = [a for a in flagged if a['zone_id'] == zid]
            speed_ev = z_events[z_events['event_type'] == 'congestion']['value'] if not z_events.empty else pd.Series()
            rain_ev = z_events[z_events['event_type'] == 'rain']['value'] if not z_events.empty else pd.Series()
            
            zone_stats[zid] = {
                "zone_name": zname,
                "total_events": len(z_events),
                "flagged_anomalies": len(z_anom),
                "baseline_median_speed_kmph": round(float(speed_ev.median()), 2) if not speed_ev.empty else 0.0,
                "max_rain_recorded_mm": round(float(rain_ev.max()), 2) if not rain_ev.empty else 0.0
            }

        # Calculate city_metrics
        city_metrics = {
            "total_unified_events": len(target_events),
            "total_flagged_anomalies": len(flagged),
            "total_zone_relationships": len(relationships),
            "total_grouped_citywide_alerts": len(citywide_alerts),
            "feed_completeness": {
                "weather": 1.0 if any(e['source'] == 'weather' for e in target_events) else 0.0,
                "traffic": 1.0 if any(e['source'] == 'traffic' for e in target_events) else 0.0,
                "incident": 1.0 if any(e['source'] == 'incident' for e in target_events) else 0.0
            },
            "severity_weights": SEVERITY_WEIGHTS
        }

        # Timeline
        timeline = []
        for e in target_events[:500]:
            timeline.append({
                "timestamp": e['timestamp'],
                "source": e['source'],
                "event_type": e['event_type'],
                "zone_id": e['zone_id'],
                "value": e['value'],
                "unit": e['unit']
            })

        alerts_payload = {
            "zone_alerts_count": len(zone_alerts),
            "citywide_alerts_count": len(citywide_alerts),
            "zone_alerts": zone_alerts,
            "citywide_alerts": citywide_alerts
        }

        return {
            "status": "success",
            "alerts": alerts_payload,
            "zone_stats": zone_stats,
            "city_metrics": city_metrics,
            "timeline": timeline
        }

    def replay(self, as_of_timestamp: str) -> Dict[str, Any]:
        """
        Replay pipeline state as of a historical timestamp (ISO-8601 string).
        Only uses data with timestamp <= as_of_timestamp.
        """
        if not self.is_loaded:
            self.load_pipeline()

        as_of_iso = format_iso_timestamp(as_of_timestamp)
        filtered_events = [e for e in self.raw_events if e['timestamp'] <= as_of_iso]
        
        if not filtered_events:
            return {
                "status": "warning",
                "as_of_timestamp": as_of_iso,
                "message": f"No events recorded prior to {as_of_iso}",
                "alerts": {"zone_alerts": [], "citywide_alerts": []},
                "zone_stats": {},
                "city_metrics": {},
                "timeline": []
            }

        res = self.analyze(events_payload=filtered_events)
        res["as_of_timestamp"] = as_of_iso
        res["historical_event_count"] = len(filtered_events)
        return res


def load_pipeline(data_dir: str = "data/raw") -> Pipeline:
    """Factory function to create and load a Pipeline instance."""
    pipe = Pipeline(data_dir)
    pipe.load_pipeline()
    return pipe
