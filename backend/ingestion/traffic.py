from datetime import datetime, timezone
from typing import Dict, Any

def simulate_traffic(step: int, area: str = "Malviya Nagar", lat: float = 28.5355, lon: float = 77.2065) -> Dict[str, Any]:
    """
    Traffic feed simulating normal operations or the demo disruption timeline.
    """
    now = datetime.now(timezone.utc).isoformat()
    if step == 0:
        return {
            "congestion_level": 38,
            "average_speed": 46.5,
            "traffic_incidents": 0,
            "road_blockage": False,
            "transit_delay": 2,
            "area": area,
            "lat": lat,
            "lon": lon,
            "timestamp": now
        }
    elif step == 1:
        # Rain has started, traffic is slowing slightly but still within baseline
        return {
            "congestion_level": 48,
            "average_speed": 34.0,
            "traffic_incidents": 1,
            "road_blockage": False,
            "transit_delay": 5,
            "area": area,
            "lat": lat,
            "lon": lon,
            "timestamp": now
        }
    elif step == 2:
        # t+10: Congestion spikes significantly
        return {
            "congestion_level": 84,
            "average_speed": 8.5,
            "traffic_incidents": 3,
            "road_blockage": True,
            "transit_delay": 14,
            "area": area,
            "lat": lat,
            "lon": lon,
            "timestamp": now
        }
    elif step >= 3:
        # t+15 & t+20: Acute Gridlock
        return {
            "congestion_level": 88,
            "average_speed": 4.2,
            "traffic_incidents": 5,
            "road_blockage": True,
            "transit_delay": 26,
            "area": area,
            "lat": lat,
            "lon": lon,
            "timestamp": now
        }
