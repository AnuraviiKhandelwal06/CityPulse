"""
config.py - Configuration Module for CityPulse Intelligence Engine.

Stores severity weights, anomaly thresholds, severity band mappings, and feed parameters.
"""

from datetime import datetime
from typing import Union

# Severity Weights (Must sum to 1.0000)
SEVERITY_WEIGHTS = {
    "traffic": 0.3125,   # 5/16
    "weather": 0.2500,   # 4/16
    "incident": 0.4375   # 7/16
}

# Severity Score Band Thresholds (0-100 score)
SEVERITY_BANDS = [
    (85.0, "CRITICAL"),
    (60.0, "HIGH"),
    (30.0, "MEDIUM"),
    (0.0, "LOW")
]

# Incident Severity to Float Mapping (0.0 to 1.0)
INCIDENT_SEVERITY_FLOAT_MAP = {
    "CRITICAL": 1.00,
    "HIGH": 0.80,
    "MEDIUM": 0.50,
    "LOW": 0.25,
    "NONE": 0.00
}

# Event Type Normalized Names (snake_case)
EVENT_TYPE_MAP = {
    "Waterlogging": "waterlogging",
    "Accident": "accident",
    "Traffic Signal Failure": "signal_failure",
    "Road Blockage": "road_blockage",
    "waterlogging": "waterlogging",
    "accident": "accident",
    "traffic signal failure": "signal_failure",
    "road blockage": "road_blockage"
}

# Default Zone Code to Name Mapping
ZONE_NAMES = {
    "Z01": "Tonk Road",
    "Z02": "Malviya Nagar",
    "Z03": "C-Scheme",
    "Z04": "Vaishali Nagar",
    "Z05": "Mansarovar",
    "Z06": "Raja Park",
    "Z07": "Jagatpura",
    "Z08": "Jhotwara",
    "Z09": "Sodala",
    "Z10": "Bani Park"
}

# Default Correlation Settings
DEFAULT_CORRELATION_WINDOW_MINUTES = 30.0
DEFAULT_CORRELATION_DISTANCE_KM = 2.0


def format_iso_timestamp(ts: Union[str, datetime]) -> str:
    """
    Format timestamp to ISO 8601 string with 'T' separator (YYYY-MM-DDTHH:MM:SS).
    """
    if isinstance(ts, str):
        # Replace space with T if needed
        ts_clean = ts.strip().replace(" ", "T")
        try:
            dt = datetime.fromisoformat(ts_clean)
            return dt.strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            return ts_clean
    elif isinstance(ts, datetime):
        return ts.strftime("%Y-%m-%dT%H:%M:%S")
    return str(ts)
