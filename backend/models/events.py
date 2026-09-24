from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class UnifiedEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: Literal["weather", "traffic", "incident"]
    event_type: str  # e.g., "rain", "congestion", "waterlogging", "transit_delay"
    latitude: float
    longitude: float
    zone: str
    timestamp: str  # ISO 8601
    value: float
    unit: str
    severity: float  # 0.0 - 1.0 (per-event score computed at ingestion/normalization)
    raw_payload: Optional[Dict[str, Any]] = None

class DisruptionEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zone: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    severity_score: float  # 0.0 - 1.0 (calculated mathematically)
    confidence: float  # 0.0 - 1.0 (calculated mathematically)
    contributing_events: List[str]  # list of UnifiedEvent ids
    spatial_overlap_km: float
    temporal_overlap_minutes: float
    created_at: str
    explanation: Optional[str] = None
    summary_html: Optional[str] = None
    evidence_breakdown: Optional[List[Dict[str, Any]]] = None

    # Calculated explanation & evidence fields
    temporal_correlation_text: Optional[str] = None
    spatial_correlation_text: Optional[str] = None
    weather_anomaly_text: Optional[str] = None
    traffic_anomaly_text: Optional[str] = None
    civic_anomaly_text: Optional[str] = None
    severity_calculation_text: Optional[str] = None
    confidence_calculation_text: Optional[str] = None
    non_causal_disclaimer: Optional[str] = "Correlation detected; causation is not established."

class ZoneStatus(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    severity_score: float
    confidence: float
    summary: str
    speed: str
    rain: str
    reports: int
    transit_delay: int
    layer: str = "all"
