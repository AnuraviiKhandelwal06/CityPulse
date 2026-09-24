from pathlib import Path

from ml_engine.api import Pipeline


def test_ml_pipeline_loads():

    data_dir = Path("ml_engine/data/raw")

    pipeline = Pipeline(data_dir)

    result = pipeline.load_pipeline()

    assert result["status"] == "success"

    assert len(pipeline.raw_events) > 0


def test_ml_pipeline_analyze():

    data_dir = Path("ml_engine/data/raw")

    pipeline = Pipeline(data_dir)

    pipeline.load_pipeline()

    result = pipeline.analyze()

    assert result["status"] == "success"

    assert "alerts" in result
    assert "zone_stats" in result
    assert "city_metrics" in result
    assert "timeline" in result