import uuid
from typing import Dict, Any, List
from models.events import UnifiedEvent

def normalize_weather_event(raw: Dict[str, Any], zone: str = "Malviya Nagar") -> UnifiedEvent:
    rainfall = float(raw.get("rainfall", 0.0))
    # Rainfall severity: 0 to 80+ mm/h mapped to 0.0 - 1.0
    severity = min(1.0, max(0.0, rainfall / 80.0))

    return UnifiedEvent(
        id=str(uuid.uuid4()),
        source="weather",
        event_type="rain",
        latitude=float(raw.get("lat", 28.5355)),
        longitude=float(raw.get("lon", 77.2065)),
        zone=zone,
        timestamp=raw.get("timestamp"),
        value=rainfall,
        unit="mm/h",
        severity=round(severity, 3),
        raw_payload=raw
    )

def normalize_traffic_event(raw: Dict[str, Any]) -> List[UnifiedEvent]:
    events = []
    zone = raw.get("area", "Malviya Nagar")
    lat = float(raw.get("lat", 28.5355))
    lon = float(raw.get("lon", 77.2065))
    timestamp = raw.get("timestamp")

    congestion = float(raw.get("congestion_level", 0.0))
    congestion_sev = min(1.0, max(0.0, congestion / 100.0))

    events.append(UnifiedEvent(
        id=str(uuid.uuid4()),
        source="traffic",
        event_type="congestion",
        latitude=lat,
        longitude=lon,
        zone=zone,
        timestamp=timestamp,
        value=congestion,
        unit="%",
        severity=round(congestion_sev, 3),
        raw_payload=raw
    ))

    # Also emit transit_delay event if available
    transit_delay = float(raw.get("transit_delay", 0.0))
    if transit_delay > 0:
        delay_sev = min(1.0, max(0.0, transit_delay / 30.0))
        events.append(UnifiedEvent(
            id=str(uuid.uuid4()),
            source="traffic",
            event_type="transit_delay",
            latitude=lat,
            longitude=lon,
            zone=zone,
            timestamp=timestamp,
            value=transit_delay,
            unit="min",
            severity=round(delay_sev, 3),
            raw_payload=raw
        ))

    return events

def normalize_incident_event(raw: Dict[str, Any]) -> UnifiedEvent:
    zone = raw.get("zone", "Malviya Nagar")
    inc_type = raw.get("type", "waterlogging")
    count = float(raw.get("count", 1.0))
    lat = float(raw.get("lat", 28.5355))
    lon = float(raw.get("lon", 77.2065))
    timestamp = raw.get("timestamp")

    # Severity scale based on count & type
    base_mult = 1.2 if inc_type == "waterlogging" else 0.8
    severity = min(1.0, max(0.0, (count / 15.0) * base_mult))

    return UnifiedEvent(
        id=str(uuid.uuid4()),
        source="incident",
        event_type=inc_type,
        latitude=lat,
        longitude=lon,
        zone=zone,
        timestamp=timestamp,
        value=count,
        unit="reports",
        severity=round(severity, 3),
        raw_payload=raw
    )
