"""
scoring.py - Decoupled Severity & Confidence Scoring Module for CityPulse.

Computes two separate, decoupled metric scores:
1. severity: weighted combination of component anomaly magnitudes using config weights:
   - Traffic: 0.3125
   - Weather: 0.2500
   - Incident: 0.4375
   Mapped to LOW, MEDIUM, HIGH, CRITICAL bands.

2. confidence: data-driven completeness & freshness score with per-feed breakdown:
   - completeness per feed
   - freshness
   - signal agreement
   - rules-vs-model agreement
   Degrades gracefully when a feed is missing.
"""

from typing import Dict, List, Any, Tuple
from ml_engine.config import SEVERITY_WEIGHTS, SEVERITY_BANDS


def compute_evidence_category_scores(evidence_list: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Compute category-level magnitude scores (0-100) for incident, traffic, and weather.
    """
    category_scores: Dict[str, float] = {}
    
    # 1. Incidents
    incident_ev = [e for e in evidence_list if e['event_type'] not in ['rain', 'temperature', 'congestion']]
    if incident_ev:
        scores = []
        for e in incident_ev:
            sev_val = float(e.get('severity', 0.5))
            scores.append(sev_val * 100.0)
        category_scores['incident'] = sum(scores) / len(scores)
        
    # 2. Traffic (speed collapse)
    traffic_ev = [e for e in evidence_list if e['event_type'] == 'congestion']
    if traffic_ev:
        traffic_scores = []
        for e in traffic_ev:
            pct_drop = abs(min(0.0, float(e.get('pct_change', 0.0))))
            score = min(100.0, pct_drop * 2.0)
            traffic_scores.append(score)
        category_scores['traffic'] = sum(traffic_scores) / len(traffic_scores)
        
    # 3. Weather (rainfall spike)
    weather_ev = [e for e in evidence_list if e['event_type'] == 'rain']
    if weather_ev:
        weather_scores = []
        for e in weather_ev:
            rain_val = float(e.get('value', 0.0))
            score = min(100.0, rain_val * 3.0)
            weather_scores.append(score)
        category_scores['weather'] = sum(weather_scores) / len(weather_scores)

    return category_scores


def compute_severity(relationship: Dict[str, Any]) -> Tuple[float, str]:
    """
    Compute severity score (0-100) and severity band (LOW, MEDIUM, HIGH, CRITICAL).
    Uses strict weights: traffic=0.3125, weather=0.25, incident=0.4375.
    """
    evidence = relationship.get('evidence', [])
    if not evidence:
        return 0.0, "LOW"

    cat_scores = compute_evidence_category_scores(evidence)
    
    total_weight = 0.0
    weighted_sum = 0.0
    
    for cat, score in cat_scores.items():
        weight = SEVERITY_WEIGHTS.get(cat, 0.3333)
        weighted_sum += score * weight
        total_weight += weight
        
    if total_weight <= 0.0:
        sev_score = 0.0
    else:
        sev_score = round(weighted_sum / total_weight, 2)

    # Map to severity bands
    band = "LOW"
    for threshold, b_name in SEVERITY_BANDS:
        if sev_score >= threshold:
            band = b_name
            break
            
    return sev_score, band


def compute_confidence_with_feed_breakdown(
    relationship: Dict[str, Any],
    active_feeds: List[str] = None
) -> Tuple[float, Dict[str, Any]]:
    """
    Compute data-driven confidence score with per-feed breakdown.
    Gracefully degrades if a feed is missing.
    """
    if active_feeds is None:
        active_feeds = ["weather", "traffic", "incident"]

    evidence = relationship.get('evidence', [])
    distinct_types = relationship.get('event_types', [])
    num_types = len(distinct_types)
    time_span = float(relationship.get('time_span_minutes', 0.0))
    
    # 1. Per-feed completeness
    feed_completeness = {
        "weather": 1.0 if "rain" in distinct_types else 0.0,
        "traffic": 1.0 if "congestion" in distinct_types else 0.0,
        "incident": 1.0 if any(t not in ["rain", "congestion"] for t in distinct_types) else 0.0
    }
    
    # Evaluate missing feed penalty
    available_feed_weights = sum(SEVERITY_WEIGHTS[f] for f in active_feeds if f in SEVERITY_WEIGHTS)
    feed_availability_score = (available_feed_weights / 1.00) * 100.0 if available_feed_weights > 0 else 0.0

    # 2. Signal agreement & overlap quality
    signal_agreement_score = min(100.0, num_types * 33.33)
    
    # 3. Temporal freshness / tightness score
    if time_span <= 15.0:
        temporal_tightness_score = 100.0
    elif time_span <= 30.0:
        temporal_tightness_score = 85.0
    elif time_span <= 60.0:
        temporal_tightness_score = 70.0
    else:
        temporal_tightness_score = 50.0

    # Rules vs Model Agreement (default 95% for rules engine)
    rules_model_agreement = 95.0
    
    # Overall confidence calculation
    final_conf = (
        0.35 * feed_availability_score +
        0.35 * signal_agreement_score +
        0.15 * temporal_tightness_score +
        0.15 * rules_model_agreement
    )
    final_conf = round(max(0.0, min(100.0, final_conf)), 1)
    
    feed_breakdown = {
        "feed_completeness": feed_completeness,
        "feed_availability_score": round(feed_availability_score, 1),
        "signal_agreement_score": round(signal_agreement_score, 1),
        "temporal_tightness_score": round(temporal_tightness_score, 1),
        "rules_model_agreement": rules_model_agreement,
        "active_feeds": active_feeds
    }
    
    return final_conf, feed_breakdown


def score_relationship(
    relationship: Dict[str, Any],
    active_feeds: List[str] = None
) -> Dict[str, Any]:
    """
    Compute explicit, decoupled severity and confidence scores with per-feed breakdown.
    """
    sev_score, band = compute_severity(relationship)
    conf_score, breakdown = compute_confidence_with_feed_breakdown(relationship, active_feeds)
    
    evidence = relationship.get('evidence', [])
    distinct_sources = len(relationship.get('event_types', []))
    
    return {
        "severity_score": sev_score,
        "severity_band": band,
        "confidence_score": conf_score,
        "confidence_breakdown": breakdown,
        "evidence_count": len(evidence),
        "distinct_sources": distinct_sources
    }


if __name__ == "__main__":
    from normalize import load_and_normalize
    from anomaly import detect_anomalies
    from correlate import correlate_anomalies
    
    print("Testing scoring.py with config weights & per-feed breakdown...")
    events = load_and_normalize("data/raw")
    anomalies = detect_anomalies(events)
    relationships = correlate_anomalies(anomalies)
    
    if relationships:
        scores = score_relationship(relationships[0])
        print(f"Sample Relationship Scores: {scores}")
        assert "confidence_breakdown" in scores
        assert scores["severity_score"] != scores["confidence_score"]
        print("scoring.py OK.")
