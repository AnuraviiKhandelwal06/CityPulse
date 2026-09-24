from datetime import datetime, timezone
from typing import List
from models.events import UnifiedEvent

def parse_iso_timestamp(ts: str) -> float:
    try:
        # Replace trailing 'Z' if present
        cleaned = ts.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        return dt.timestamp()
    except Exception:
        return datetime.now(timezone.utc).timestamp()

def group_temporal_events(events: List[UnifiedEvent], window_minutes: float = 30.0) -> List[List[UnifiedEvent]]:
    """
    Groups events that fall within a configurable time window of each other.
    """
    if not events:
        return []

    sorted_events = sorted(events, key=lambda e: parse_iso_timestamp(e.timestamp))
    window_seconds = window_minutes * 60.0

    groups: List[List[UnifiedEvent]] = []
    current_group: List[UnifiedEvent] = []

    for evt in sorted_events:
        if not current_group:
            current_group.append(evt)
        else:
            time_diff = parse_iso_timestamp(evt.timestamp) - parse_iso_timestamp(current_group[0].timestamp)
            if time_diff <= window_seconds:
                current_group.append(evt)
            else:
                groups.append(current_group)
                current_group = [evt]

    if current_group:
        groups.append(current_group)

    return groups
