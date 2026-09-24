from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


def create_tables() -> None:
    from app.models.civic_data import CivicEvent
    from app.models.anomaly import Anomaly
    from app.models.correlation import Correlation
    from app.models.evidence import Evidence
    from app.models.alert import Alert

    Base.metadata.create_all(bind=engine)