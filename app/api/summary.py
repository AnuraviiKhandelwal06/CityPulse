from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import Alert


router = APIRouter()


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(Alert)
        .filter(Alert.status == "ACTIVE")
        .order_by(Alert.created_at)
        .all()
    )

    summaries = [
        {
            "alert_id": alert.alert_id,
            "zone_id": alert.zone_id,
            "zone_name": alert.zone_name,
            "summary": alert.summary,
            "severity_band": alert.severity_band,
            "severity_score": alert.severity_score,
            "confidence_score": alert.confidence_score,
        }
        for alert in alerts
    ]

    return {
        "status": "success",
        "summaries": summaries,
        "total": len(summaries),
    }