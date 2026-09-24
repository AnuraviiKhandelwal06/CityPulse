from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from models.events import DisruptionEvent, ZoneStatus

_current_step: int = 4  # Default to full demonstrated payoff, can be stepped or reset

STEP_METADATA = [
    {
        "step": 0,
        "time": "00:00",
        "elapsed_minutes": 0,
        "title": "Baseline Normal",
        "description": "All streams normal across corridors",
        "status_label": "All systems normal (baseline)"
    },
    {
        "step": 1,
        "time": "05:00",
        "elapsed_minutes": 5,
        "title": "Rainfall Spikes",
        "description": "Cloudburst precipitation surges to 78.4 mm/h",
        "status_label": "Rainfall anomaly detected (t+5m)"
    },
    {
        "step": 2,
        "time": "10:00",
        "elapsed_minutes": 10,
        "title": "Traffic Congestion Spikes",
        "description": "Corridor speed drops to 8.5 km/h, congestion 84%",
        "status_label": "Traffic congestion anomaly detected (t+10m)"
    },
    {
        "step": 3,
        "time": "15:00",
        "elapsed_minutes": 15,
        "title": "Waterlogging Reports Surge",
        "description": "14 citizen 311 flood complaints filed near underpass",
        "status_label": "Civic complaints cluster detected (t+15m)"
    },
    {
        "step": 4,
        "time": "20:00",
        "elapsed_minutes": 20,
        "title": "Critical Disruption Surfaced",
        "description": "Multi-stream disruption confirmed across weather, traffic, and civic 311",
        "status_label": "CRITICAL ALERT: Multi-source disruption confirmed (t+20m)"
    }
]

def get_current_step() -> int:
    return _current_step

def set_current_step(step: int) -> int:
    global _current_step
    _current_step = max(0, min(4, step))
    return _current_step

def advance_step(delta: int = 1) -> int:
    global _current_step
    _current_step = max(0, min(4, _current_step + delta))
    return _current_step

def reset_step() -> int:
    global _current_step
    _current_step = 0
    return _current_step

def get_step_meta(step: Optional[int] = None) -> Dict[str, Any]:
    if step is None:
        step = _current_step
    return STEP_METADATA[step]

def get_active_alert(step: Optional[int] = None) -> Optional[DisruptionEvent]:
    if step is None:
        step = _current_step

    if step < 3:
        return None

    now = datetime.now(timezone.utc).isoformat()
    if step == 3:
        return DisruptionEvent(
            id="emerging-malviya-disruption",
            zone="Malviya Nagar Underpass",
            severity="HIGH",
            severity_score=0.76,
            confidence=0.88,
            contributing_events=["weather-rain-surge", "traffic-gridlock", "incident-waterlogging-cluster"],
            spatial_overlap_km=1.2,
            temporal_overlap_minutes=15.0,
            created_at=now,
            explanation="Heavy rainfall coincides with increased traffic congestion and 14 waterlogging reports in Malviya Nagar.",
            summary_html='<span class="font-bold text-error">Heavy rainfall</span> coincides with acute traffic congestion and <span class="text-tertiary font-bold">14 waterlogging reports</span>.',
            evidence_breakdown=[
                {
                    "id": "weather-rain-surge",
                    "source": "weather",
                    "name": "Precipitation Spike (Open-Meteo)",
                    "event_type": "rain",
                    "value": "74.6 mm/h shower",
                    "baseline": "0.0 mm/h",
                    "anomalyRatio": "Cloudburst Surge",
                    "severity": 0.93,
                    "timestamp": now
                },
                {
                    "id": "traffic-gridlock",
                    "source": "traffic",
                    "name": "Traffic Congestion & Velocity Collapse",
                    "event_type": "congestion",
                    "value": "88% (4.2 km/h)",
                    "baseline": "42% normal",
                    "anomalyRatio": "2.1x baseline",
                    "severity": 0.88,
                    "timestamp": now
                },
                {
                    "id": "incident-waterlogging-cluster",
                    "source": "incident",
                    "name": "Municipal 311 Waterlogging Complaints",
                    "event_type": "waterlogging",
                    "value": "14 verified calls in 30 min",
                    "baseline": "1.2 tickets/hr",
                    "anomalyRatio": "11.6x baseline",
                    "severity": 0.93,
                    "timestamp": now
                }
            ]
        )

    # Step 4: Full Critical Disruption
    return DisruptionEvent(
        id="critical-malviya-disruption",
        zone="Malviya Nagar Underpass",
        severity="CRITICAL",
        severity_score=0.86,
        confidence=0.92,
        contributing_events=["weather-rain-surge", "traffic-gridlock", "incident-waterlogging-cluster", "transit-delay"],
        spatial_overlap_km=1.4,
        temporal_overlap_minutes=18.0,
        created_at=now,
        explanation="Heavy rainfall coincides with acute traffic congestion (88%) and 14 waterlogging reports across Malviya Nagar corridors.",
        summary_html='<span class="font-bold text-error">Heavy rainfall</span> coincides with acute traffic congestion (<span class="text-primary font-bold">88%</span>) and <span class="text-tertiary font-bold">14 waterlogging reports</span> across Malviya Nagar corridors.',
        evidence_breakdown=[
            {
                "id": "weather-rain-surge",
                "source": "weather",
                "name": "Precipitation Spike (Open-Meteo)",
                "event_type": "rain",
                "value": "78.4 mm/h shower",
                "baseline": "0.0 mm/h",
                "anomalyRatio": "Cloudburst Surge",
                "severity": 0.98,
                "timestamp": now
            },
            {
                "id": "traffic-gridlock",
                "source": "traffic",
                "name": "Traffic Congestion & Velocity Collapse",
                "event_type": "congestion",
                "value": "88% (4.2 km/h)",
                "baseline": "42% normal",
                "anomalyRatio": "2.1x baseline",
                "severity": 0.88,
                "timestamp": now
            },
            {
                "id": "incident-waterlogging-cluster",
                "source": "incident",
                "name": "Municipal 311 Waterlogging Complaints",
                "event_type": "waterlogging",
                "value": "14 verified calls in 30 min",
                "baseline": "1.2 tickets/hr",
                "anomalyRatio": "11.6x baseline",
                "severity": 0.93,
                "timestamp": now
            },
            {
                "id": "transit-delay",
                "source": "traffic",
                "name": "Transit Delay Variance",
                "event_type": "transit_delay",
                "value": "+26 min delay",
                "baseline": "2 min normal",
                "anomalyRatio": "Bottleneck Delay",
                "severity": 0.86,
                "timestamp": now
            }
        ]
    )

def get_step_zones(step: Optional[int] = None) -> List[ZoneStatus]:
    if step is None:
        step = _current_step

    if step == 0:
        malviya_sev = "LOW"
        malviya_score = 0.12
        malviya_conf = 0.95
        malviya_summary = "Normal urban flow across all corridors"
        malviya_speed = "46.5 km/h"
        malviya_rain = "1.2 mm/h"
        malviya_reports = 0
        malviya_delay = 2
    elif step == 1:
        malviya_sev = "MEDIUM"
        malviya_score = 0.45
        malviya_conf = 0.85
        malviya_summary = "Rainfall surge 78.4 mm/h • Traffic normal (48%)"
        malviya_speed = "34.0 km/h"
        malviya_rain = "78.4 mm/h"
        malviya_reports = 1
        malviya_delay = 5
    elif step == 2:
        malviya_sev = "HIGH"
        malviya_score = 0.72
        malviya_conf = 0.89
        malviya_summary = "Severe congestion 84% • Speed 8.5 km/h • Heavy Rain"
        malviya_speed = "8.5 km/h"
        malviya_rain = "82.5 mm/h"
        malviya_reports = 3
        malviya_delay = 14
    elif step == 3:
        malviya_sev = "HIGH"
        malviya_score = 0.82
        malviya_conf = 0.91
        malviya_summary = "Gridlock 88% • 14 Flooding Reports logged in underpass"
        malviya_speed = "4.2 km/h"
        malviya_rain = "74.6 mm/h"
        malviya_reports = 14
        malviya_delay = 20
    else:
        malviya_sev = "CRITICAL"
        malviya_score = 0.86
        malviya_conf = 0.92
        malviya_summary = "Severe Congestion 88% • Heavy Rain 78mm/h • 14 Flooding Reports"
        malviya_speed = "4.2 km/h"
        malviya_rain = "78.4 mm/h"
        malviya_reports = 14
        malviya_delay = 26

    return [
        ZoneStatus(
            id="malviya-nagar",
            name="Malviya Nagar Hotspot",
            lat=28.5355,
            lon=77.2065,
            severity=malviya_sev,
            severity_score=malviya_score,
            confidence=malviya_conf,
            summary=malviya_summary,
            speed=malviya_speed,
            rain=malviya_rain,
            reports=malviya_reports,
            transit_delay=malviya_delay,
            layer="all"
        ),
        ZoneStatus(
            id="connaught-place",
            name="Connaught Place",
            lat=28.6304,
            lon=77.2177,
            severity="MEDIUM",
            severity_score=0.54,
            confidence=0.85,
            summary="Moderate Traffic (54%) • Rain 12 mm/h",
            speed="28 km/h",
            rain="12.0 mm/h",
            reports=2,
            transit_delay=8,
            layer="traffic"
        ),
        ZoneStatus(
            id="saket",
            name="Saket Corridor",
            lat=28.5244,
            lon=77.2140,
            severity="LOW",
            severity_score=0.12,
            confidence=0.95,
            summary="Smooth Flow (12%) • Normal operations",
            speed="48 km/h",
            rain="2.0 mm/h",
            reports=0,
            transit_delay=1,
            layer="all"
        ),
        ZoneStatus(
            id="nehru-place",
            name="Nehru Place Hub",
            lat=28.5494,
            lon=77.2528,
            severity="LOW",
            severity_score=0.22,
            confidence=0.88,
            summary="Normal Commercial Transit Flow",
            speed="36 km/h",
            rain="4.5 mm/h",
            reports=1,
            transit_delay=3,
            layer="all"
        )
    ]

def get_step_metrics(step: Optional[int] = None) -> Dict[str, Any]:
    if step is None:
        step = _current_step

    if step == 0:
        return {
            "traffic": {
                "value": 42,
                "unit": "%",
                "delta": "Normal baseline",
                "baseline": "Normal avg: 42%",
                "status": "Smooth flow",
                "level": "tertiary"
            },
            "rainfall": {
                "value": 1.2,
                "unit": "mm/h",
                "delta": "(Clear conditions)",
                "baseline": "Weather Radar Station",
                "status": "Normal dry",
                "level": "primary"
            },
            "civicReports": {
                "value": 1,
                "unit": "reports",
                "delta": "Baseline",
                "baseline": "Waterlogging issues",
                "status": "No active clusters",
                "level": "secondary"
            },
            "transitDelay": {
                "value": 2,
                "unit": "min",
                "delta": "On schedule",
                "baseline": "Yellow Line Buses",
                "status": "Normal operations",
                "level": "tertiary"
            }
        }
    elif step == 1:
        return {
            "traffic": {
                "value": 48,
                "unit": "%",
                "delta": "(+6% slowing)",
                "baseline": "Normal avg: 42%",
                "status": "Moderate flow",
                "level": "tertiary"
            },
            "rainfall": {
                "value": 78.4,
                "unit": "mm/h",
                "delta": "(Heavy shower)",
                "baseline": "Weather Radar Station",
                "status": "Cloudburst surge",
                "level": "primary"
            },
            "civicReports": {
                "value": 1,
                "unit": "reports",
                "delta": "Baseline",
                "baseline": "Waterlogging issues",
                "status": "No active clusters",
                "level": "secondary"
            },
            "transitDelay": {
                "value": 5,
                "unit": "min",
                "delta": "Minor delay",
                "baseline": "Yellow Line Buses",
                "status": "Slight slowdown",
                "level": "tertiary"
            }
        }
    elif step == 2:
        return {
            "traffic": {
                "value": 84,
                "unit": "%",
                "delta": "(+42% vs usual)",
                "baseline": "Normal avg: 42%",
                "status": "Severe congestion",
                "level": "error"
            },
            "rainfall": {
                "value": 82.5,
                "unit": "mm/h",
                "delta": "(Heavy shower)",
                "baseline": "Weather Radar Station",
                "status": "Cloudburst surge",
                "level": "primary"
            },
            "civicReports": {
                "value": 3,
                "unit": "reports",
                "delta": "(+50% rise)",
                "baseline": "Waterlogging issues",
                "status": "Initial reports",
                "level": "secondary"
            },
            "transitDelay": {
                "value": 14,
                "unit": "min",
                "delta": "delay",
                "baseline": "Yellow Line Buses",
                "status": "Corridor congestion",
                "level": "tertiary"
            }
        }
    elif step == 3:
        return {
            "traffic": {
                "value": 88,
                "unit": "%",
                "delta": "(+46% vs usual)",
                "baseline": "Normal avg: 42%",
                "status": "Severe congestion",
                "level": "error"
            },
            "rainfall": {
                "value": 74.6,
                "unit": "mm/h",
                "delta": "(Heavy shower)",
                "baseline": "Weather Radar Station",
                "status": "Sustained downpour",
                "level": "primary"
            },
            "civicReports": {
                "value": 14,
                "unit": "reports",
                "delta": "(+90% spike)",
                "baseline": "Waterlogging issues",
                "status": "Flooding cluster",
                "level": "secondary"
            },
            "transitDelay": {
                "value": 20,
                "unit": "min",
                "delta": "delay",
                "baseline": "Yellow Line Buses",
                "status": "Underpass blockage",
                "level": "tertiary"
            }
        }
    else:  # Step 4: Disruption Peak
        return {
            "traffic": {
                "value": 84,
                "unit": "%",
                "delta": "+42% vs usual",
                "baseline": "Normal avg: 42%",
                "status": "Severe congestion",
                "level": "error"
            },
            "rainfall": {
                "value": 78.4,
                "unit": "mm/h",
                "delta": "(Heavy shower)",
                "baseline": "Weather Radar Station",
                "status": "Cloudburst surge",
                "level": "primary"
            },
            "civicReports": {
                "value": 19,
                "unit": "reports",
                "delta": "(+120% spike)",
                "baseline": "Waterlogging issues",
                "status": "Verified cluster",
                "level": "secondary"
            },
            "transitDelay": {
                "value": 26,
                "unit": "min",
                "delta": "delay",
                "baseline": "Yellow Line Buses",
                "status": "Underpass bottleneck",
                "level": "tertiary"
            }
        }
