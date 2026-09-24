from app.services.ml_engine_service import MLEngineService


class DashboardService:

    def __init__(self, ml_service: MLEngineService):
        self.ml_service = ml_service

    def get_dashboard(self) -> dict:
        return self.ml_service.analyze()

    def get_events(self) -> list[dict]:
        return self.ml_service.raw_events

    def get_alerts(self) -> list[dict]:
        result = self.ml_service.analyze()

        return result.get(
            "active_zone_alerts",
            [],
        )

    def get_zones(self) -> dict:
        result = self.ml_service.analyze()

        zone_alerts = result.get(
            "active_zone_alerts",
            [],
        )

        zones = {}

        for alert in zone_alerts:
            zone_id = alert["zone_id"]

            if zone_id not in zones:
                zones[zone_id] = {
                    "zone_id": zone_id,
                    "zone_name": alert["zone_name"],
                    "alert_count": 0,
                }

            zones[zone_id]["alert_count"] += 1

        return zones

    def get_metrics(self) -> dict:
        result = self.ml_service.analyze()

        return {
            "total_alerts": result.get("total_alerts", 0),
            "active_zone_alerts": len(
                result.get("active_zone_alerts", [])
            ),
            "citywide_alerts": len(
                result.get("citywide_alerts", [])
            ),
            "total_events": len(
                self.ml_service.raw_events
            ),
        }

    def get_timeline(self) -> list[dict]:
        # The current ML Pipeline does not expose
        # a timeline in analyze().
        return []