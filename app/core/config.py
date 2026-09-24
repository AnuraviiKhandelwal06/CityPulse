from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "CityPulse Backend"
    app_version: str = "1.0.0"
    debug: bool = True

    database_url: str

    ml_data_dir: str = "ml_engine/data/raw"
    api_prefix: str = "/api"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def ml_data_path(self) -> Path:
        path = Path(self.ml_data_dir)

        if path.is_absolute():
            return path

        return BASE_DIR / path


settings = Settings()