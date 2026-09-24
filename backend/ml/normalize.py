"""
normalize.py - Data Normalization Module for CityPulse Intelligence Engine.

Converts raw weather, traffic, and civic incident datasets into a single, unified
UnifiedEvent representation sorted by timestamp.

Strict Contract:
- source: 'weather' | 'traffic' | 'incident'
- severity: float in [0.0, 1.0]
- event_type: snake_case ('rain', 'congestion', 'waterlogging', 'signal_failure', 'road_blockage', 'accident')
- timestamp: ISO 8601 format with 'T' separator ('YYYY-MM-DDTHH:MM:SS')
"""

from pathlib import Path
from typing import Dict, List, Any, Union, Optional
import pandas as pd
from config import INCIDENT_SEVERITY_FLOAT_MAP, EVENT_TYPE_MAP, format_iso_timestamp


def map_weather_severity_float(rainfall_mm: float) -> float:
    """Map rainfall amount to a 0.0 - 1.0 float severity."""
    if rainfall_mm >= 30.0:
        return 1.00
    elif rainfall_mm >= 20.0:
        return 0.80
    elif rainfall_mm >= 10.0:
        return 0.50
    elif rainfall_mm > 0.0:
        return 0.25
    return 0.00


def map_traffic_severity_float(congestion_level: str, speed_kmph: float) -> float:
    """Map traffic speed and congestion level to a 0.0 - 1.0 float severity."""
    if speed_kmph <= 15.0:
        return 1.00
    elif speed_kmph <= 22.0:
        return 0.80
    elif speed_kmph <= 32.0:
        return 0.50
    return 0.25


def normalize_weather(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Normalize weather DataFrame to UnifiedEvent dictionaries.
    """
    events = []
    df_copy = df.copy()
    df_copy['timestamp'] = pd.to_datetime(df_copy['timestamp'])
    
    for idx, row in df_copy.iterrows():
        ts_str = format_iso_timestamp(row['timestamp'])
        zone_id = str(row['zone_id'])
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        rain_val = float(row['rainfall_mm'])
        
        events.append({
            "id": f"weather_{zone_id}_{ts_str}_rain",
            "source": "weather",
            "event_type": "rain",
            "zone_id": zone_id,
            "latitude": lat,
            "longitude": lon,
            "timestamp": ts_str,
            "value": round(rain_val, 2),
            "unit": "mm",
            "severity": map_weather_severity_float(rain_val)
        })
        
    return events


def normalize_traffic(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Normalize traffic DataFrame to UnifiedEvent dictionaries.
    """
    events = []
    df_copy = df.copy()
    df_copy['timestamp'] = pd.to_datetime(df_copy['timestamp'])
    
    for idx, row in df_copy.iterrows():
        ts_str = format_iso_timestamp(row['timestamp'])
        zone_id = str(row['zone_id'])
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        speed_val = float(row['avg_speed_kmph'])
        c_level = str(row.get('congestion_level', 'LOW'))
        
        events.append({
            "id": f"traffic_{zone_id}_{ts_str}_congestion",
            "source": "traffic",
            "event_type": "congestion",
            "zone_id": zone_id,
            "latitude": lat,
            "longitude": lon,
            "timestamp": ts_str,
            "value": round(speed_val, 2),
            "unit": "km/h",
            "severity": map_traffic_severity_float(c_level, speed_val)
        })
        
    return events


def normalize_incidents(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Normalize incidents DataFrame to UnifiedEvent dictionaries.
    Source is strictly 'incident' (singular), event_type is snake_case.
    """
    events = []
    df_copy = df.copy()
    df_copy['timestamp'] = pd.to_datetime(df_copy['timestamp'])
    
    for idx, row in df_copy.iterrows():
        ts_str = format_iso_timestamp(row['timestamp'])
        zone_id = str(row['zone_id'])
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        inc_id = str(row['incident_id'])
        raw_inc_type = str(row['incident_type'])
        
        event_type = EVENT_TYPE_MAP.get(raw_inc_type, raw_inc_type.strip().lower().replace(" ", "_"))
        sev_str = str(row['severity']).upper()
        sev_float = INCIDENT_SEVERITY_FLOAT_MAP.get(sev_str, 0.50)
        
        events.append({
            "id": f"incident_{inc_id}_{zone_id}_{ts_str}_{event_type}",
            "source": "incident",
            "event_type": event_type,
            "zone_id": zone_id,
            "latitude": lat,
            "longitude": lon,
            "timestamp": ts_str,
            "value": 1.0,
            "unit": "count",
            "severity": sev_float
        })
        
    return events


def normalize_all(weather_df: pd.DataFrame, traffic_df: pd.DataFrame, incidents_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Combine and sort all normalized events chronologically by timestamp.
    """
    weather_events = normalize_weather(weather_df)
    traffic_events = normalize_traffic(traffic_df)
    incidents_events = normalize_incidents(incidents_df)
    
    combined = weather_events + traffic_events + incidents_events
    combined.sort(key=lambda x: x['timestamp'])
    return combined


def load_and_normalize(data_dir: Union[str, Path] = "data/raw") -> List[Dict[str, Any]]:
    """
    Helper function to load raw CSVs from a directory and return normalized events.
    """
    base_path = Path(data_dir)
    if not (base_path / "weather.csv").exists():
        if (Path("data/raw") / "weather.csv").exists():
            base_path = Path("data/raw")
        elif (Path("data") / "weather.csv").exists():
            base_path = Path("data")
            
    weather_df = pd.read_csv(base_path / "weather.csv")
    traffic_df = pd.read_csv(base_path / "traffic.csv")
    incidents_df = pd.read_csv(base_path / "incidents.csv")
    
    return normalize_all(weather_df, traffic_df, incidents_df)


if __name__ == "__main__":
    print("Testing normalize.py...")
    events = load_and_normalize("data/raw")
    print(f"Total UnifiedEvents loaded: {len(events)}")
    print(f"Sample UnifiedEvent: {events[0]}")
    assert "T" in events[0]['timestamp']
    print("normalize.py OK - ISO 8601 T-timestamp verified.")
