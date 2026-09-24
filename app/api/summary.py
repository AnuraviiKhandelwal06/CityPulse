from fastapi import APIRouter, Request


router = APIRouter()


@router.get("/summary")
def get_summary(request: Request):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    alerts = result.get(
        "alerts",
        {},
    )

    zone_alerts = alerts.get(
        "zone_alerts",
        [],
    )

    summaries = [
        {
            "alert_id": alert["alert_id"],
            "zone_id": alert["zone_id"],
            "zone_name": alert["zone_name"],
            "summary": alert["summary"],
            "severity_band": alert["severity_band"],
            "severity_score": alert["severity_score"],
            "confidence_score": alert["confidence_score"],
        }
        for alert in zone_alerts
    ]

    return {
        "status": "success",
        "summaries": summaries,
        "total": len(summaries),
    }