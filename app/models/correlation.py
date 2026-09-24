from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Correlation(Base):
    __tablename__ = "correlations"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)

    zone_id: Mapped[str] = mapped_column(String(50), nullable=False)

    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)

    time_span_minutes: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    event_types: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )