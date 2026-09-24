from fastapi import APIRouter, Request


router = APIRouter()


@router.get("/timeline")
def get_timeline(request: Request):

    ml_service = request.app.state.ml_service

    result = ml_service.analyze()

    return {
        "timeline": result.get(
            "timeline",
            [],
        )
    }