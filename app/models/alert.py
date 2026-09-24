from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    alert_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    correlation_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    zone_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    zone_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    severity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    severity_band: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    event_types: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    time_span_minutes: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="ACTIVE",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )