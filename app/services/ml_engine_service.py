class MLEngineService:
    """
    Placeholder ML service for the standalone backend branch.

    The actual ML implementation will be connected on the
    backend-ml-integration branch.
    """

    def __init__(self, data_dir=None):
        self.data_dir = data_dir
        self.pipeline = None

    def load(self) -> dict:
        return {
            "status": "success",
            "message": "ML engine is not connected yet.",
        }

    def analyze(self, events=None) -> dict:
        return {
            "status": "success",
            "alerts": {},
            "zone_stats": {},
            "city_metrics": {},
            "timeline": [],
        }

    def replay(self, timestamp: str) -> dict:
        return {
            "status": "success",
            "timestamp": timestamp,
            "message": "ML replay will be available after ML integration.",
        }

    @property
    def raw_events(self) -> list:
        return []

    @property
    def anomalies(self) -> list:
        return []

    @property
    def relationships(self) -> list:
        return []