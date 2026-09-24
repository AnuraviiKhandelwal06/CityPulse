from fastapi import APIRouter, Request


router = APIRouter()


@router.get("/zones")
def get_zones(request: Request):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    return result.get(
        "zone_stats",
        {},
    )


@router.get("/zones/{zone_id}")
def get_zone(
    zone_id: str,
    request: Request,
):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    zones = result.get(
        "zone_stats",
        {},
    )

    zone = zones.get(zone_id)

    if zone is None:

        return {
            "error": "Zone not found",
            "zone_id": zone_id,
        }

    return zone