from typing import List, Dict, Tuple, Any
from datetime import datetime, timezone
import uuid

from models.events import UnifiedEvent, DisruptionEvent
from analytics.geo import haversine_distance_km
from analytics.correlation import parse_iso_timestamp

def compute_severity_and_confidence(events: List[UnifiedEvent]) -> Tuple[float, str, float, float, float]:
    """
    Computes two SEPARATE numbers:
    1. Severity: weighted combination of anomaly magnitudes
       severity = traffic*0.25 + weather*0.20 + incidents*0.35 + transit*0.20
    2. Confidence: evidence completeness, spatial & temporal tightness
    """
    traffic_sev = 0.0
    weather_sev = 0.0
    incident_sev = 0.0
    transit_sev = 0.0

    sources = set()
    timestamps = []
    coords = []

    for e in events:
        sources.add(e.source)
        timestamps.append(parse_iso_timestamp(e.timestamp))
        coords.append((e.latitude, e.longitude))

        if e.source == "weather":
            weather_sev = max(weather_sev, e.severity)
        elif e.source == "traffic":
            if e.event_type == "congestion":
                traffic_sev = max(traffic_sev, e.severity)
            elif e.event_type == "transit_delay":
                transit_sev = max(transit_sev, e.severity)
        elif e.source == "incident":
            incident_sev = max(incident_sev, e.severity)

    # If transit wasn't separately reported, proxy from traffic
    if transit_sev == 0.0 and traffic_sev > 0.0:
        transit_sev = traffic_sev * 0.8

    raw_severity = (traffic_sev * 0.25) + (weather_sev * 0.20) + (incident_sev * 0.35) + (transit_sev * 0.20)
    severity_score = min(1.0, max(0.0, raw_severity))

    # Bands: 0–0.3 LOW · 0.3–0.6 MEDIUM · 0.6–0.8 HIGH · 0.8–1.0 CRITICAL
    if severity_score >= 0.8:
        band = "CRITICAL"
    elif severity_score >= 0.6:
        band = "HIGH"
    elif severity_score >= 0.3:
        band = "MEDIUM"
    else:
        band = "LOW"

    # Compute spatial overlap (max pairwise distance among contributing events)
    max_dist_km = 0.5
    for i in range(len(coords)):
        for j in range(i + 1, len(coords)):
            d = haversine_distance_km(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
            if d > max_dist_km:
                max_dist_km = d

    # Compute temporal overlap (time spread in minutes)
    if timestamps:
        temporal_span_min = max(1.0, (max(timestamps) - min(timestamps)) / 60.0)
    else:
        temporal_span_min = 5.0

    # Compute Confidence (Separate from Severity!)
    # Factor A: Source completeness (how many independent feeds concurred)
    source_count = len(sources)
    if source_count >= 3:
        conf_source = 0.60
    elif source_count == 2:
        conf_source = 0.40
    else:
        conf_source = 0.20

    # Factor B: Spatial tightness
    if max_dist_km <= 1.0:
        conf_spatial = 0.20
    elif max_dist_km <= 2.0:
        conf_spatial = 0.15
    else:
        conf_spatial = 0.05

    # Factor C: Temporal tightness
    if temporal_span_min <= 20.0:
        conf_temporal = 0.15
    elif temporal_span_min <= 30.0:
        conf_temporal = 0.10
    else:
        conf_temporal = 0.05

    confidence = min(0.98, max(0.20, conf_source + conf_spatial + conf_temporal))

    return round(severity_score, 3), band, round(confidence, 3), round(max_dist_km, 2), round(temporal_span_min, 1)

def build_disruption_event(zone: str, events: List[UnifiedEvent]) -> DisruptionEvent:
    sev_score, band, confidence, spatial_km, temporal_min = compute_severity_and_confidence(events)

    breakdown = []
    for e in events:
        breakdown.append({
            "id": e.id,
            "source": e.source,
            "event_type": e.event_type,
            "value": f"{e.value} {e.unit}",
            "severity": e.severity,
            "timestamp": e.timestamp
        })

    return DisruptionEvent(
        id=str(uuid.uuid4()),
        zone=zone,
        severity=band,
        severity_score=sev_score,
        confidence=confidence,
        contributing_events=[e.id for e in events],
        spatial_overlap_km=spatial_km,
        temporal_overlap_minutes=temporal_min,
        created_at=datetime.now(timezone.utc).isoformat(),
        evidence_breakdown=breakdown
    )
