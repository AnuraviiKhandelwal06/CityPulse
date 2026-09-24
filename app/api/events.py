from fastapi import APIRouter, Request

from app.schemas.event import EventListResponse, EventResponse


router = APIRouter()


@router.get(
    "/events",
    response_model=EventListResponse,
)
def get_events(request: Request):

    ml_service = request.app.state.ml_service

    events = ml_service.raw_events

    response = [
        EventResponse(**event)
        for event in events
    ]

    return EventListResponse(
        events=response,
        total=len(response),
    )


@router.get(
    "/events/{event_id}",
)
def get_event(
    event_id: str,
    request: Request,
):

    ml_service = request.app.state.ml_service

    for event in ml_service.raw_events:

        if event["id"] == event_id:
            return event

    return {
        "error": "Event not found",
        "event_id": event_id,
    }