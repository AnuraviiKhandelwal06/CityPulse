from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.civic_data import CivicEvent


router = APIRouter()


@router.get("/timeline")
def get_timeline(
    db: Session = Depends(get_db),
):
    events = (
        db.query(CivicEvent)
        .order_by(CivicEvent.timestamp)
        .all()
    )

    timeline = [
        {
            "timestamp": event.timestamp.isoformat(),
            "event_id": event.id,
            "event_type": event.event_type,
            "zone_id": event.zone_id,
            "severity": event.severity,
            "value": event.value,
            "unit": event.unit,
        }
        for event in events
    ]

    return {
        "timeline": timeline,
        "total": len(timeline),
    }