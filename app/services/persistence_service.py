import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.civic_data import CivicEvent
from app.models.anomaly import Anomaly
from app.models.correlation import Correlation
from app.models.evidence import Evidence
from app.models.alert import Alert


class PersistenceService:

    def save_events(
        self,
        db: Session,
        events: list[dict],
    ) -> int:

        saved = 0

        for event in events:

            existing = db.get(
                CivicEvent,
                event["id"],
            )

            if existing:
                continue

            timestamp = datetime.fromisoformat(
                event["timestamp"].replace(
                    "Z",
                    "+00:00",
                )
            ).replace(tzinfo=None)

            record = CivicEvent(
                id=event["id"],
                source=event["source"],
                event_type=event["event_type"],
                zone_id=event["zone_id"],
                latitude=event["latitude"],
                longitude=event["longitude"],
                timestamp=timestamp,
                value=event["value"],
                unit=event["unit"],
                severity=event["severity"],
            )

            db.add(record)
            saved += 1

        db.commit()

        return saved

    def save_analysis(
        self,
        db: Session,
        analysis: dict,
    ) -> None:

        zone_alerts = analysis.get(
            "active_zone_alerts",
            [],
        )

        for alert_data in zone_alerts:

            alert_id = alert_data["alert_id"]

            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.alert_id == alert_id
                )
                .first()
            )

            if existing_alert:
                continue

            # -------------------------
            # Correlation
            # -------------------------

            correlation = Correlation(
                id=alert_id,
                zone_id=alert_data["zone_id"],
                alert_type="DISRUPTION_ALERT",
                time_span_minutes=alert_data[
                    "time_span_minutes"
                ],
                event_types=json.dumps(
                    alert_data["event_types"]
                ),
                created_at=datetime.utcnow(),
            )

            db.add(correlation)

            # -------------------------
            # Alert
            # -------------------------

            alert = Alert(
                alert_id=alert_id,
                correlation_id=alert_id,
                zone_id=alert_data["zone_id"],
                zone_name=alert_data["zone_name"],
                severity_score=alert_data[
                    "severity_score"
                ],
                severity_band=alert_data[
                    "severity_band"
                ],
                confidence_score=alert_data[
                    "confidence_score"
                ],
                summary=alert_data["summary"],
                event_types=json.dumps(
                    alert_data["event_types"]
                ),
                time_span_minutes=alert_data[
                    "time_span_minutes"
                ],
                status="ACTIVE",
                created_at=datetime.utcnow(),
            )

            db.add(alert)

            # -------------------------
            # Evidence
            # -------------------------

            for evidence_data in alert_data.get(
                "evidence",
                [],
            ):

                timestamp = datetime.fromisoformat(
                    evidence_data["timestamp"].replace(
                        "Z",
                        "+00:00",
                    )
                ).replace(tzinfo=None)

                evidence = Evidence(
                    correlation_id=alert_id,
                    event_id=evidence_data[
                        "event_id"
                    ],
                    event_type=evidence_data[
                        "event_type"
                    ],
                    value=evidence_data["value"],
                    baseline=evidence_data[
                        "baseline"
                    ],
                    pct_change=evidence_data[
                        "pct_change"
                    ],
                    timestamp=timestamp,
                    severity=evidence_data[
                        "severity"
                    ],
                    zone_id=evidence_data[
                        "zone_id"
                    ],
                )

                db.add(evidence)

        db.commit()