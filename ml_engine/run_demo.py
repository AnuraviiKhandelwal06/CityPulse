"""
run_demo.py - End-to-End Pipeline Execution & Multi-Artifact Generator for CityPulse.

Runs full Phase 1 Intelligence Engine pipeline and exports standardized JSON outputs:
- outputs/alerts.json
- outputs/zone_stats.json
- outputs/city_metrics.json
- outputs/timeline.json
- outputs/demo_results.json
"""

import json
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd

from ml_engine.config import ZONE_NAMES, SEVERITY_WEIGHTS
from ml_engine.normalize import load_and_normalize
from ml_engine.anomaly import detect_anomalies
from ml_engine.correlate import correlate_anomalies, group_citywide_alerts
from ml_engine.scoring import score_relationship
from ml_engine.summary import generate_summary


def run_pipeline(data_dir: str = "data/raw") -> Dict[str, Any]:
    """
    Run end-to-end pipeline and export all required JSON artifacts to outputs/.
    """
    print("=" * 70)
    print("CITYPULSE CIVIC INTELLIGENCE ENGINE - PHASE 1 PIPELINE RUNNER")
    print("=" * 70)
    
    # 1. Load and Normalize
    print("\n[Step 1] Loading and Normalizing CSV Datasets...")
    events = load_and_normalize(data_dir)
    print(f" -> Total UnifiedEvents processed: {len(events)}")
    
    # 2. Detect Anomalies using Median/MAD
    print("\n[Step 2] Computing Trailing Median/MAD Baselines & Anomalies...")
    anomalies = detect_anomalies(events)
    flagged = [a for a in anomalies if a['is_anomaly']]
    print(f" -> Total Anomaly Records: {len(anomalies)} | Flagged Anomalies: {len(flagged)}")
    
    # 3. Correlate Spatio-Temporal Cascades & Citywide Alerts
    print("\n[Step 3] Correlating Spatio-Temporal Anomaly Cascades...")
    relationships = correlate_anomalies(anomalies, max_time_diff_minutes=30.0)
    citywide_alerts = group_citywide_alerts(relationships)
    print(f" -> Total Zone Relationships: {len(relationships)} | Grouped City-Wide Alerts: {len(citywide_alerts)}")
    
    # 4 & 5. Process Scores, Summaries, and Artifacts
    print("\n[Step 4 & 5] Computing Scores & Generating Artifacts...")
    processed_alerts = []
    
    for rel in relationships:
        scores = score_relationship(rel)
        summary_text = generate_summary(rel, scores, ZONE_NAMES)
        
        anomaly_map = {a['event_id']: a for a in anomalies}
        raw_anomaly_records = [anomaly_map.get(aid) for aid in rel['anomaly_ids'] if aid in anomaly_map]
        
        rel_output = {
            "relationship_id": rel['id'],
            "zone_id": rel['zone_id'],
            "zone_name": ZONE_NAMES.get(rel['zone_id'], f"Zone {rel['zone_id']}"),
            "event_types": rel['event_types'],
            "time_span_minutes": rel['time_span_minutes'],
            "raw_anomalies": raw_anomaly_records,
            "evidence": rel['evidence'],
            "scores": scores,
            "summary": summary_text
        }
        processed_alerts.append(rel_output)

    output_dir = Path("outputs")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. alerts.json
    alerts_data = {
        "zone_alerts_count": len(processed_alerts),
        "citywide_alerts_count": len(citywide_alerts),
        "zone_alerts": processed_alerts,
        "citywide_alerts": citywide_alerts
    }
    with open(output_dir / "alerts.json", "w", encoding="utf-8") as f:
        json.dump(alerts_data, f, indent=2)

    # 2. zone_stats.json
    events_df = pd.DataFrame(events)
    zone_stats = {}
    for zid, zname in ZONE_NAMES.items():
        z_events = events_df[events_df['zone_id'] == zid]
        z_anomalies = [a for a in flagged if a['zone_id'] == zid]
        speed_events = z_events[z_events['event_type'] == 'congestion']['value']
        rain_events = z_events[z_events['event_type'] == 'rain']['value']
        
        zone_stats[zid] = {
            "zone_name": zname,
            "total_events": len(z_events),
            "flagged_anomalies": len(z_anomalies),
            "baseline_median_speed_kmph": round(float(speed_events.median()), 2) if not speed_events.empty else 0.0,
            "max_rain_recorded_mm": round(float(rain_events.max()), 2) if not rain_events.empty else 0.0
        }
    with open(output_dir / "zone_stats.json", "w", encoding="utf-8") as f:
        json.dump(zone_stats, f, indent=2)

    # 3. city_metrics.json
    city_metrics = {
        "total_unified_events": len(events),
        "total_flagged_anomalies": len(flagged),
        "total_zone_relationships": len(relationships),
        "total_grouped_citywide_alerts": len(citywide_alerts),
        "feed_completeness": {
            "weather": 1.0,
            "traffic": 1.0,
            "incident": 1.0
        },
        "severity_weights": SEVERITY_WEIGHTS
    }
    with open(output_dir / "city_metrics.json", "w", encoding="utf-8") as f:
        json.dump(city_metrics, f, indent=2)

        # 4. timeline.json
    # Build the timeline from ALL events instead of only the first 500.
    # This ensures the full 7-day dataset is available to the frontend/demo.

    timeline_items = []

    for e in events:
        timeline_items.append({
            "timestamp": e["timestamp"],
            "source": e["source"],
            "event_type": e["event_type"],
            "zone_id": e["zone_id"],
            "value": e["value"],
            "unit": e["unit"]
        })

    # Sort chronologically so the frontend replay works correctly.
    timeline_items.sort(key=lambda x: x["timestamp"])

    with open(output_dir / "timeline.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "timeline_sample_count": len(timeline_items),
                "timeline": timeline_items
            },
            f,
            indent=2
        )
    # 5. demo_results.json
    demo_results = {
        "engine": "CityPulse Intelligence Engine Phase 1",
        "pipeline_summary": city_metrics,
        "sample_cascade_alerts": processed_alerts[:5]
    }
    with open(output_dir / "demo_results.json", "w", encoding="utf-8") as f:
        json.dump(demo_results, f, indent=2)

    print(f"\n[Success] Generated all 5 JSON artifacts in {output_dir.resolve()}:")
    print(" - alerts.json")
    print(" - zone_stats.json")
    print(" - city_metrics.json")
    print(" - timeline.json")
    print(" - demo_results.json")

    return demo_results


if __name__ == "__main__":
    run_pipeline("data/raw")
