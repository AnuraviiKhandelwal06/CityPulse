from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)

    event_id: Mapped[str] = mapped_column(String(255), nullable=False)

    anomaly_type: Mapped[str] = mapped_column(String(100), nullable=False)

    score: Mapped[float] = mapped_column(Float, nullable=False)

    detected_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )