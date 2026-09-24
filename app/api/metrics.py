from fastapi import APIRouter, Request


router = APIRouter()


@router.get("/metrics")
def get_metrics(request: Request):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    return result.get(
        "city_metrics",
        {},
    )