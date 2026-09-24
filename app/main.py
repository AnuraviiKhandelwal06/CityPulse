from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.db.database import create_tables
from app.db.session import get_db
from app.services.ml_engine_service import MLEngineService
from app.services.persistence_service import PersistenceService

from app.api import (
    events,
    alerts,
    zones,
    metrics,
    timeline,
    summary,
    replay,
)


ml_service = MLEngineService(
    settings.ml_data_path
)

persistence_service = PersistenceService()


@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting CityPulse Backend...")

    # -------------------------
    # Create database tables
    # -------------------------

    create_tables()

    print(
        f"Loading ML data from: {settings.ml_data_path}"
    )

    try:

        # -------------------------
        # Load ML pipeline
        # -------------------------

        result = ml_service.load()

        print(
            "ML Pipeline loaded:",
            result,
        )

        # -------------------------
        # Persist data
        # -------------------------

        db = next(get_db())

        try:

            events_saved = persistence_service.save_events(
                db,
                ml_service.raw_events,
            )

            analysis = ml_service.analyze()

            persistence_service.save_analysis(
                db,
                analysis,
            )

            print(
                f"Events saved to database: {events_saved}"
            )

            print(
                "ML analysis saved to database."
            )

        finally:

            db.close()

    except Exception as exc:

        print(
            "ML Pipeline / persistence failed:",
            exc,
        )

    yield

    print(
        "Shutting down CityPulse Backend..."
    )


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)


app.state.ml_service = ml_service


app.include_router(
    events.router,
    prefix=settings.api_prefix,
    tags=["Events"],
)

app.include_router(
    alerts.router,
    prefix=settings.api_prefix,
    tags=["Alerts"],
)

app.include_router(
    zones.router,
    prefix=settings.api_prefix,
    tags=["Zones"],
)

app.include_router(
    metrics.router,
    prefix=settings.api_prefix,
    tags=["Metrics"],
)

app.include_router(
    timeline.router,
    prefix=settings.api_prefix,
    tags=["Timeline"],
)

app.include_router(
    summary.router,
    prefix=settings.api_prefix,
    tags=["Summary"],
)

app.include_router(
    replay.router,
    prefix=settings.api_prefix,
    tags=["Replay"],
)


@app.get("/")
def root():

    return {
        "name": "CityPulse Backend",
        "status": "running",
        "version": settings.app_version,
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "citypulse-backend",
    }