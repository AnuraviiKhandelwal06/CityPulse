from pydantic import BaseModel


class CityMetrics(BaseModel):
    total_unified_events: int
    total_flagged_anomalies: int
    total_zone_relationships: int
    total_grouped_citywide_alerts: int

    feed_completeness: dict[str, float]

    severity_weights: dict[str, float]


class DashboardResponse(BaseModel):
    status: str
    alerts: dict
    zone_stats: dict
    city_metrics: CityMetrics
    timeline: list[dict]