from pathlib import Path

from app.services.normalization_service import NormalizationService


class IngestionService:

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir

    def ingest(self) -> list[dict]:
        """
        Load current raw weather, traffic and incident data.

        The initial implementation uses the existing ML CSV data.
        """

        return NormalizationService.normalize_from_directory(
            self.data_dir
        )