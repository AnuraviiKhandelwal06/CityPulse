from pathlib import Path

from ml_engine.normalize import load_and_normalize


class NormalizationService:

    @staticmethod
    def normalize_from_directory(
        data_dir: Path,
    ) -> list[dict]:

        return load_and_normalize(data_dir)