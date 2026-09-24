from pathlib import Path
from typing import Any, Optional

from ml_engine.api import Pipeline


class MLEngineService:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.pipeline = Pipeline(data_dir)

    def load(self) -> dict[str, Any]:
        return self.pipeline.load_pipeline()

    def analyze(
        self,
        events: Optional[list[dict[str, Any]]] = None
    ) -> dict[str, Any]:
        return self.pipeline.analyze(events_payload=events)

    def replay(self, timestamp: str) -> dict[str, Any]:
        return self.pipeline.replay(timestamp)

    @property
    def raw_events(self) -> list[dict[str, Any]]:
        return self.pipeline.raw_events

    @property
    def anomalies(self) -> list[dict[str, Any]]:
        return self.pipeline.anomalies

    @property
    def relationships(self) -> list[dict[str, Any]]:
        return self.pipeline.relationships