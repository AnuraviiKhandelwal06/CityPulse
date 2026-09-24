from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import Alert


router = APIRouter()


@router.get("/zones")
def get_zones(
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(Alert)
        .filter(
            Alert.status == "ACTIVE",
        )
        .order_by(Alert.created_at)
        .all()
    )

    zones = {}

    for alert in alerts:

        zone_id = alert.zone_id

        if zone_id not in zones:

            zones[zone_id] = {
                "zone_id": zone_id,
                "zone_name": alert.zone_name,
                "alert_count": 0,
            }

        zones[zone_id]["alert_count"] += 1

    return zones


@router.get("/zones/{zone_id}")
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(Alert)
        .filter(
            Alert.zone_id == zone_id,
            Alert.status == "ACTIVE",
        )
        .order_by(Alert.created_at)
        .all()
    )

    if not alerts:
        return {
            "error": "Zone not found",
            "zone_id": zone_id,
        }

    zone_alerts = [
        {
            "alert_id": alert.alert_id,
            "zone_id": alert.zone_id,
            "zone_name": alert.zone_name,
            "severity_score": alert.severity_score,
            "severity_band": alert.severity_band,
            "confidence_score": alert.confidence_score,
            "summary": alert.summary,
            "time_span_minutes": alert.time_span_minutes,
        }
        for alert in alerts
    ]

    return {
        "zone_id": zone_id,
        "zone_name": alerts[0].zone_name,
        "alert_count": len(zone_alerts),
        "alerts": zone_alerts,
    }