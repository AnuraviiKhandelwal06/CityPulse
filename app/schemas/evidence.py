from datetime import datetime

from pydantic import BaseModel


class EvidenceResponse(BaseModel):
    event_id: str
    event_type: str
    value: float
    baseline: float
    pct_change: float
    timestamp: datetime
    severity: float
    zone_id: str