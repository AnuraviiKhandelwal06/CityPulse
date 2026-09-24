from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UnifiedEvent(BaseModel):
    id: str
    source: str
    event_type: str

    zone_id: str

    latitude: float
    longitude: float

    timestamp: datetime

    value: float
    unit: str

    severity: float


class EventResponse(UnifiedEvent):
    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    events: list[EventResponse]
    total: int