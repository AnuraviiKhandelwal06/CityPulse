from fastapi import APIRouter
from typing import List
from models.events import ZoneStatus
import state

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("", response_model=List[ZoneStatus])
def get_zones_status():
    """
    Returns per-zone situational stats matching active simulation step.
    """
    return state.get_step_zones()
