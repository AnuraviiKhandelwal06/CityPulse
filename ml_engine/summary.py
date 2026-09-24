"""
summary.py - Deterministic Template-Based Explanation Module for CityPulse.

Generates human-readable, plain-language summary explanations based strictly on computed
evidence and scores. Uses NO LLMs and NO causation language.
"""

from typing import Dict, List, Any, Optional
from ml_engine.config import ZONE_NAMES


def generate_summary(
    relationship: Dict[str, Any],
    scores: Dict[str, Any],
    zone_names: Optional[Dict[str, str]] = None
) -> str:
    """
    Generate a deterministic, evidence-grounded summary string for a relationship record.
    """
    if zone_names is None:
        zone_names = ZONE_NAMES

    zone_id = str(relationship.get('zone_id', 'Unknown'))
    zone_name = zone_names.get(zone_id, f"Zone {zone_id}")
    zone_label = f"{zone_name} ({zone_id})"
    
    evidence = relationship.get('evidence', [])
    if not evidence:
        return f"No evidence available for relationship in {zone_label}."

    rain_items = [e for e in evidence if e['event_type'] == 'rain']
    traffic_items = [e for e in evidence if e['event_type'] == 'congestion']
    incident_items = [e for e in evidence if e['event_type'] not in ['rain', 'temperature', 'congestion']]
    
    sentences = []
    
    # 1. Weather observation sentence
    if rain_items:
        max_rain = max(rain_items, key=lambda x: x['value'])
        rain_val = max_rain['value']
        rain_base = max_rain['baseline']
        rain_ts = max_rain['timestamp']
        if rain_base > 0.0:
            pct_spike = round(((rain_val - rain_base) / rain_base) * 100.0, 1)
            sentences.append(f"Heavy rainfall of {rain_val:.1f} mm (baseline {rain_base:.1f} mm, +{pct_spike}% spike) was recorded in {zone_label} at {rain_ts}.")
        else:
            sentences.append(f"Rainfall of {rain_val:.1f} mm was recorded in {zone_label} at {rain_ts}.")
            
    # 2. Incident observation sentence
    if incident_items:
        inc_types = sorted(list(set(e['event_type'].replace('_', ' ').title() for e in incident_items)))
        inc_str = ", ".join(inc_types)
        inc_ts = incident_items[0]['timestamp']
        sentences.append(f"{inc_str} incident was reported in the same window at {inc_ts}.")

    # 3. Traffic observation sentence
    if traffic_items:
        worst_traffic = min(traffic_items, key=lambda x: x['pct_change'])
        speed_val = worst_traffic['value']
        speed_base = worst_traffic['baseline']
        speed_drop_pct = abs(round(worst_traffic['pct_change'], 1))
        traffic_ts = worst_traffic['timestamp']
        sentences.append(f"Average traffic speed dropped by {speed_drop_pct}% (from {speed_base:.1f} km/h down to {speed_val:.1f} km/h) shortly after at {traffic_ts}.")

    observations_text = " ".join(sentences)
    
    sev_band = scores.get('severity_band', 'LOW')
    sev_score = scores.get('severity_score', 0.0)
    conf_score = scores.get('confidence_score', 0.0)
    time_span = relationship.get('time_span_minutes', 0.0)
    distinct_count = scores.get('distinct_sources', len(relationship.get('event_types', [])))

    # Strictly non-causational conclusion phrase
    conclusion_text = (
        f"A possible relationship has been detected across {distinct_count} distinct data sources "
        f"spanning {time_span:.0f} minutes -- this is not confirmed causation. "
        f"Calculated Severity: {sev_band} ({sev_score:.1f}/100), Confidence: {conf_score:.1f}%."
    )
    
    return f"{observations_text}\n{conclusion_text}"


if __name__ == "__main__":
    from normalize import load_and_normalize
    from anomaly import detect_anomalies
    from correlate import correlate_anomalies
    from scoring import score_relationship
    
    print("Testing summary.py...")
    events = load_and_normalize("data/raw")
    anomalies = detect_anomalies(events)
    relationships = correlate_anomalies(anomalies)
    if relationships:
        scores = score_relationship(relationships[0])
        print(generate_summary(relationships[0], scores))
    print("summary.py OK.")
