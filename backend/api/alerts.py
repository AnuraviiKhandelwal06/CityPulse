from fastapi import APIRouter, HTTPException, Path
from typing import List
from models.events import DisruptionEvent
import state
import database

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[DisruptionEvent])
def list_alerts():
    """
    Returns list of current DisruptionEvents corresponding to active simulation state.
    """
    alert = state.get_active_alert()
    if alert is None:
        return []
    return [alert]

@router.get("/{alert_id}", response_model=DisruptionEvent)
def get_alert_evidence(alert_id: str = Path(..., description="Alert ID")):
    """
    Returns a single alert with full evidence breakdown for the 'WHY?' panel.
    """
    alert = state.get_active_alert()
    if not alert:
        # Fallback to DB or generate standard breakdown
        alert = state.get_active_alert(step=4)
    return alert
