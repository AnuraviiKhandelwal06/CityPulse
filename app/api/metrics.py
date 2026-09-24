from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import Alert
from app.models.civic_data import CivicEvent


router = APIRouter()


@router.get("/metrics")
def get_metrics(
    request: Request,
    db: Session = Depends(get_db),
):
    # -------------------------
    # Persisted event count
    # -------------------------

    total_events = (
        db.query(CivicEvent)
        .count()
    )

    # -------------------------
    # Persisted active alerts
    # -------------------------

    active_alerts = (
        db.query(Alert)
        .filter(
            Alert.status == "ACTIVE"
        )
        .all()
    )

    active_zone_alerts = len(
        active_alerts
    )

    zones_with_alerts = len(
        {
            alert.zone_id
            for alert in active_alerts
        }
    )

    # -------------------------
    # Flagged anomalies
    # -------------------------
    # Anomalies are not currently
    # persisted in PostgreSQL, so
    # this value comes from the ML engine.

    ml_service = request.app.state.ml_service

    flagged_anomalies = sum(
        1
        for anomaly in ml_service.anomalies
        if anomaly.get("is_anomaly") is True
    )

    # -------------------------
    # Citywide alerts
    # -------------------------
    # These are currently generated
    # by the ML engine and are not
    # stored in the Alert table.

    ml_result = ml_service.analyze()

    citywide_alerts = ml_result.get(
        "citywide_alerts",
        [],
    )

    return {
        "total_events": total_events,
        "total_anomalies": flagged_anomalies,
        "total_alerts": (
            active_zone_alerts
            + len(citywide_alerts)
        ),
        "active_zone_alerts": active_zone_alerts,
        "citywide_alerts": len(
            citywide_alerts
        ),
        "zones_with_alerts": zones_with_alerts,
    }