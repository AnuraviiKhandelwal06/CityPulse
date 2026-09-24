from datetime import datetime, timezone
from typing import Dict, Any, List

def simulate_civic_incidents(step: int, zone: str = "Malviya Nagar", lat: float = 28.5355, lon: float = 77.2065) -> Dict[str, Any]:
    """
    Civic 311 incident feed simulating complaints and emergency tickets.
    """
    now = datetime.now(timezone.utc).isoformat()
    if step <= 1:
        return {
            "type": "noise_complaint",
            "zone": zone,
            "count": 1,
            "lat": lat,
            "lon": lon,
            "timestamp": now,
            "details": "Routine residential complaint"
        }
    elif step == 2:
        return {
            "type": "waterlogging",
            "zone": zone,
            "count": 3,
            "lat": lat + 0.001,
            "lon": lon - 0.001,
            "timestamp": now,
            "details": "Initial water accumulation reported near subway"
        }
    elif step == 3:
        return {
            "type": "waterlogging",
            "zone": zone,
            "count": 14,
            "lat": lat,
            "lon": lon,
            "timestamp": now,
            "details": "Acute waterlogging (18-24cm) underpass impassable"
        }
    else:
        return {
            "type": "waterlogging",
            "zone": zone,
            "count": 19,
            "lat": lat,
            "lon": lon,
            "timestamp": now,
            "details": "Severe waterlogging with electrical disruption"
        }
