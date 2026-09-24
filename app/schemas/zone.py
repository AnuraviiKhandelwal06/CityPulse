from pydantic import BaseModel


class ZoneResponse(BaseModel):
    zone_id: str
    zone_name: str
    total_events: int
    flagged_anomalies: int
    baseline_median_speed_kmph: float
    max_rain_recorded_mm: float