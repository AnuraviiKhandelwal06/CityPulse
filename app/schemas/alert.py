from pydantic import BaseModel

from app.schemas.evidence import EvidenceResponse


class AlertResponse(BaseModel):
    alert_id: str

    zone_id: str
    zone_name: str

    event_types: list[str]

    time_span_minutes: float

    severity_score: float
    severity_band: str

    confidence_score: float

    confidence_breakdown: dict

    summary: str

    evidence: list[EvidenceResponse]


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int