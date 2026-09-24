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
            "alerts",
            {},
        ).get(
            "zone_alerts",
            [],
        )

    def get_zones(self) -> dict:

        result = self.ml_service.analyze()

        return result.get(
            "zone_stats",
            {},
        )

    def get_metrics(self) -> dict:

        result = self.ml_service.analyze()

        return result.get(
            "city_metrics",
            {},
        )

    def get_timeline(self) -> list[dict]:

        result = self.ml_service.analyze()

        return result.get(
            "timeline",
            [],
        )