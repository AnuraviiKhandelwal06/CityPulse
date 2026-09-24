from fastapi import APIRouter, Request


router = APIRouter()


@router.get("/alerts")
def get_alerts(request: Request):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    alerts = result.get(
        "alerts",
        {},
    )

    return alerts


@router.get("/alerts/{alert_id}")
def get_alert(
    alert_id: str,
    request: Request,
):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    alerts = result.get(
        "alerts",
        {},
    ).get(
        "zone_alerts",
        [],
    )

    for alert in alerts:

        if alert["alert_id"] == alert_id:
            return alert

    return {
        "error": "Alert not found",
        "alert_id": alert_id,
    }