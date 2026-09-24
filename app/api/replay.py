from fastapi import APIRouter, Query, Request


router = APIRouter()


@router.get("/replay")
def replay(
    request: Request,
    timestamp: str = Query(
        ...,
        description="ISO-8601 timestamp",
    ),
):

    ml_service = request.app.state.ml_service

    return ml_service.replay(timestamp)