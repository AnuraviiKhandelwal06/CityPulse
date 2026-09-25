from fastapi import APIRouter, Query
from typing import List, Optional
from models.events import UnifiedEvent
import database

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("", response_model=List[UnifiedEvent])
def list_events(
    zone: Optional[str] = Query(None, description="Filter by zone name"),
    source: Optional[str] = Query(None, description="Filter by source (weather|traffic|incident)"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Returns normalized UnifiedEvents with optional filtering.
    """
    return database.get_all_events(zone=zone, source=source, limit=limit)
