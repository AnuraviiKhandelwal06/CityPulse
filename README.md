# CityPulse Intelligence Engine Layer

Civic intelligence platform fusing weather, traffic, and incident data. Detects baseline anomalies, correlates spatio-temporal cascades (heavy rain → waterlogging → traffic collapse), computes decoupled severity & confidence scores, and generates deterministic non-causational explanations.

---

## Package Architecture & Usage

### Import Interface
The engine is packaged under `citypulse_ml` and provides a plain Python `Pipeline` class:

```python
from citypulse_ml.api import load_pipeline

# 1. Initialize & load pipeline
pipeline = load_pipeline("data/raw")

# 2. Analyze current state / payload
results = pipeline.analyze()
# Access contract dictionaries:
# results['alerts'], results['zone_stats'], results['city_metrics'], results['timeline']

# 3. Replay historical state as of timestamp
replay = pipeline.replay("2026-09-20T14:30:00")
```

---

## JSON Schemas for Backend Team

### 1. `alerts.json`
```json
{
  "zone_alerts_count": 10,
  "citywide_alerts_count": 1,
  "zone_alerts": [
    {
      "alert_id": "REL-Z05-202609201330-018",
      "zone_id": "Z05",
      "zone_name": "Mansarovar",
      "event_types": ["accident", "congestion", "rain", "road_blockage", "waterlogging"],
      "time_span_minutes": 330.0,
      "severity_score": 66.24,
      "severity_band": "HIGH",
      "confidence_score": 95.0,
      "confidence_breakdown": {
        "feed_completeness": { "weather": 1.0, "traffic": 1.0, "incident": 1.0 },
        "feed_availability_score": 100.0,
        "signal_agreement_score": 100.0,
        "temporal_tightness_score": 70.0
      },
      "summary": "Heavy rainfall of 41.9 mm ... A possible relationship has been detected ...",
      "evidence": [
        {
          "event_id": "weather_Z05_2026-09-20T14:00:00_rain",
          "event_type": "rain",
          "value": 20.9,
          "baseline": 0.23,
          "pct_change": 9188.89,
          "timestamp": "2026-09-20T14:00:00",
          "severity": 0.8,
          "zone_id": "Z05"
        }
      ]
    }
  ],
  "citywide_alerts": [
    {
      "id": "CITYWIDE-ALERT-202609201400",
      "alert_level": "CITY_WIDE",
      "affected_zone_count": 10,
      "affected_zones": ["Z01", "Z02", "Z03", "Z04", "Z05", "Z06", "Z07", "Z08", "Z09", "Z10"],
      "event_types": ["congestion", "rain", "waterlogging"],
      "start_timestamp": "2026-09-20T14:00:00"
    }
  ]
}
```

### 2. `zone_stats.json`
```json
{
  "Z01": {
    "zone_name": "Tonk Road",
    "total_events": 504,
    "flagged_anomalies": 52,
    "baseline_median_speed_kmph": 39.2,
    "max_rain_recorded_mm": 31.9
  }
}
```

### 3. `city_metrics.json`
```json
{
  "total_unified_events": 5229,
  "total_flagged_anomalies": 520,
  "total_zone_relationships": 20,
  "total_grouped_citywide_alerts": 2,
  "severity_weights": {
    "traffic": 0.3125,
    "weather": 0.25,
    "incident": 0.4375
  }
}
```

---

## Core Engine Modules

1. **`config.py`**: Central severity weights (traffic: 0.3125, weather: 0.25, incident: 0.4375), thresholds, and ISO-8601 helper.
2. **`normalize.py`**: Converts raw CSVs to `UnifiedEvent` dicts (`source` = `'weather'|'traffic'|'incident'`, float severity $0.0\text{--}1.0$, ISO-8601 `T` timestamps).
3. **`anomaly.py`**: Same-time-of-day median/MAD baseline per zone for traffic; trailing median for weather. Evaluated across all 7 days with zero false rain/traffic alerts on dry days.
4. **`correlate.py`**: Episode-based spatio-temporal correlation. Produces per-zone disruption alerts and grouped citywide alerts.
5. **`scoring.py`**: Decoupled severity score (0-100) and data-driven confidence score with per-feed breakdown.
6. **`summary.py`**: Deterministic template-based summary generator (NO LLM, NO causation words).
7. **`api.py`**: Plain Python `Pipeline` class supporting `load_pipeline()`, `analyze()`, `replay(as_of)`.
8. **`features.py` & `models/nowcast.py`**: Feature engineering and LOEO supervised nowcasting.
