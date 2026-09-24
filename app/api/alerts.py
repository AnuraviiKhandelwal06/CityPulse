from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import Alert
from app.models.evidence import Evidence


router = APIRouter()


@router.get("/alerts")
def get_alerts(
    request: Request,
    db: Session = Depends(get_db),
):
    # Get persisted active alerts from PostgreSQL
    alerts = (
        db.query(Alert)
        .filter(Alert.status == "ACTIVE")
        .order_by(Alert.created_at)
        .all()
    )

    # ML is currently used for fields that are
    # not yet stored in the database.
    ml_service = request.app.state.ml_service

    ml_result = ml_service.analyze()

    ml_zone_alerts = {
        alert["alert_id"]: alert
        for alert in ml_result.get(
            "active_zone_alerts",
            [],
        )
    }

    # Return alert summaries only.
    # Evidence is intentionally excluded here
    # to keep the response small.
    active_zone_alerts = [
        {
            "alert_id": alert.alert_id,
            "zone_id": alert.zone_id,
            "zone_name": alert.zone_name,
            "event_types": (
                ml_zone_alerts.get(
                    alert.alert_id,
                    {},
                ).get(
                    "event_types",
                    [],
                )
            ),
            "time_span_minutes": alert.time_span_minutes,
            "severity_score": alert.severity_score,
            "severity_band": alert.severity_band,
            "confidence_score": alert.confidence_score,
            "summary": alert.summary,
        }
        for alert in alerts
    ]

    # Citywide alerts are currently generated
    # by the ML engine and are not stored in
    # the alerts table yet.
    citywide_alerts = ml_result.get(
        "citywide_alerts",
        [],
    )

    return {
        "active_zone_alerts": active_zone_alerts,
        "citywide_alerts": citywide_alerts,
        "total_alerts": (
            len(active_zone_alerts)
            + len(citywide_alerts)
        ),
    }


@router.get("/alerts/{alert_id}")
def get_alert(
    alert_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    # Get the alert from PostgreSQL
    alert = (
        db.query(Alert)
        .filter(
            Alert.alert_id == alert_id,
        )
        .first()
    )

    if alert is None:
        return {
            "error": "Alert not found",
            "alert_id": alert_id,
        }

    # Get evidence belonging to this alert
    evidence_records = (
        db.query(Evidence)
        .filter(
            Evidence.correlation_id
            == alert.correlation_id
        )
        .order_by(Evidence.timestamp)
        .all()
    )

    evidence = [
        {
            "event_id": item.event_id,
            "event_type": item.event_type,
            "value": item.value,
            "baseline": item.baseline,
            "pct_change": item.pct_change,
            "timestamp": item.timestamp.isoformat(),
            "severity": item.severity,
            "zone_id": item.zone_id,
        }
        for item in evidence_records
    ]

    # Get event_types and confidence_breakdown
    # from ML because they are not currently
    # stored completely in the Alert model.
    ml_service = request.app.state.ml_service

    ml_result = ml_service.analyze()

    ml_alert = next(
        (
            item
            for item in ml_result.get(
                "active_zone_alerts",
                [],
            )
            if item["alert_id"] == alert_id
        ),
        None,
    )

    return {
        "alert_id": alert.alert_id,
        "zone_id": alert.zone_id,
        "zone_name": alert.zone_name,
        "event_types": (
            ml_alert.get(
                "event_types",
                [],
            )
            if ml_alert
            else []
        ),
        "time_span_minutes": alert.time_span_minutes,
        "severity_score": alert.severity_score,
        "severity_band": alert.severity_band,
        "confidence_score": alert.confidence_score,
        "summary": alert.summary,
        "evidence": evidence,
        "confidence_breakdown": (
            ml_alert.get(
                "confidence_breakdown",
                {},
            )
            if ml_alert
            else {}
        ),
    }