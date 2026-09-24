from pathlib import Path

from app.services.ingestion_service import IngestionService


if __name__ == "__main__":

    data_dir = Path("ml_engine/data/raw")

    service = IngestionService(data_dir)

    events = service.ingest()

    print(
        f"Loaded {len(events)} normalized events."
    )

    for event in events[:5]:
        print(event)