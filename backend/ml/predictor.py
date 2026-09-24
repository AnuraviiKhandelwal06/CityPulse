"""
backend/ml/predictor.py - Predictive Nowcasting Bridge for CityPulse.

Integrates the existing HistGradientBoosting nowcast model trained on
historical multi-event data to evaluate 30-60 minute disruption risk
from current live/simulation telemetry.

The ML nowcasting model coexists with the detection engine:
- Detection engine: "What is happening now?" (anomalies, spatial/temporal correlation, severity)
- ML Nowcast model: "What is likely to happen next?" (30-60 min disruption probability)
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# Ensure backend root and backend/ml are in sys.path
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent
for p in (str(_current_dir), str(_backend_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from sklearn.ensemble import HistGradientBoostingClassifier
    from features import build_feature_matrix
    _ML_AVAILABLE = True
except Exception as e:
    _ML_AVAILABLE = False
    _INIT_ERROR = str(e)


FEATURE_COLS = [
    "rainfall_mm",
    "rainfall_sum_1h",
    "rainfall_sum_3h",
    "speed_drop_pct",
    "vehicle_count",
    "waterlogging_count_t",
    "other_incidents_count_t",
]


class NowcastPredictor:
    """
    Manages loading, training, and live inference for the HistGradientBoosting
    early-warning nowcaster.
    """

    def __init__(self, data_dir: Optional[str] = None):
        self.model: Optional[HistGradientBoostingClassifier] = None
        self.is_ready = False
        self.error_message: Optional[str] = None
        self.data_dir = data_dir or str(_backend_dir / "data" / "raw")

        # Fallback search paths for data/raw
        if not Path(self.data_dir).exists():
            for candidate in [
                _current_dir / "data" / "raw",
                _backend_dir / "ml" / "data" / "raw",
                Path("data/raw")
            ]:
                if candidate.exists():
                    self.data_dir = str(candidate)
                    break

        self._initialize_model()

    def _initialize_model(self):
        """
        Train the HistGradientBoostingClassifier on the available dataset
        under the Leave-One-Event-Out feature schema.
        """
        if not _ML_AVAILABLE:
            self.error_message = f"ML packages missing: {_INIT_ERROR}"
            self.is_ready = False
            return

        try:
            df, y = build_feature_matrix(self.data_dir)
            self.model = HistGradientBoostingClassifier(random_state=42)
            self.model.fit(df[FEATURE_COLS], y)
            self.is_ready = True
            self.error_message = None
        except Exception as e:
            self.is_ready = False
            self.error_message = f"Model initialization failed: {e}"

    def extract_features_for_step(
        self,
        step: int,
        zone: str = "Malviya Nagar"
    ) -> Dict[str, float]:
        """
        Converts live simulation/sensor state at a given step into the
        7-dimensional feature vector expected by the nowcast model.
        """
        # Historical dry-day baseline speed in Delhi urban corridors
        dry_baseline_speed = 46.5

        if zone.lower().startswith("connaught"):
            # Connaught Place: moderate commercial traffic, light rain
            rain = 12.0 if step >= 1 else 0.5
            rain_1h = 8.0 if step >= 1 else 0.5
            rain_3h = 10.0 if step >= 1 else 1.0
            speed = 32.0 if step >= 2 else 42.0
            cong = 54 if step >= 2 else 35
            civic = 0
            other_inc = 0
        elif zone.lower().startswith("saket"):
            # Saket: smooth flow
            rain = 2.0 if step >= 1 else 0.2
            rain_1h = 1.5 if step >= 1 else 0.2
            rain_3h = 3.0 if step >= 1 else 0.5
            speed = 48.0
            cong = 20
            civic = 0
            other_inc = 0
        elif zone.lower().startswith("nehru"):
            # Nehru Place: commercial transit hub
            rain = 4.5 if step >= 1 else 0.5
            rain_1h = 3.0 if step >= 1 else 0.5
            rain_3h = 5.0 if step >= 1 else 1.0
            speed = 36.0
            cong = 30
            civic = 0
            other_inc = 0
        elif zone.lower().startswith("lajpat"):
            # Lajpat Nagar: market corridor, moderate traffic
            rain = 14.5 if step >= 1 else 0.5
            rain_1h = 9.0 if step >= 1 else 0.5
            rain_3h = 12.0 if step >= 1 else 1.0
            speed = 30.0 if step >= 2 else 40.0
            cong = 58 if step >= 2 else 38
            civic = 1 if step >= 3 else 0
            other_inc = 0
        elif zone.lower().startswith("vasant"):
            # Vasant Kunj: outer arterial, free flow
            rain = 1.5 if step >= 1 else 0.2
            rain_1h = 1.0 if step >= 1 else 0.2
            rain_3h = 2.0 if step >= 1 else 0.5
            speed = 45.0
            cong = 22
            civic = 0
            other_inc = 0
        elif zone.lower().startswith("south"):
            # South Extension: arterial ring road, normal flow
            rain = 1.0 if step >= 1 else 0.2
            rain_1h = 0.8 if step >= 1 else 0.2
            rain_3h = 1.5 if step >= 1 else 0.5
            speed = 42.0
            cong = 25
            civic = 0
            other_inc = 0
        else:
            # Malviya Nagar Hotspot (primary simulation focus)
            if step == 0:
                rain = 1.2
                rain_1h = 1.2
                rain_3h = 2.4
                speed = 46.5
                cong = 38
                civic = 0
                other_inc = 0
            elif step == 1:
                rain = 78.4
                rain_1h = 18.5
                rain_3h = 22.0
                speed = 34.0
                cong = 48
                civic = 0
                other_inc = 0
            elif step == 2:
                rain = 82.5
                rain_1h = 42.0
                rain_3h = 50.0
                speed = 8.5
                cong = 84
                civic = 2
                other_inc = 1
            elif step == 3:
                rain = 82.5
                rain_1h = 65.0
                rain_3h = 75.0
                speed = 4.2
                cong = 88
                civic = 14
                other_inc = 1
            else:
                rain = 82.5
                rain_1h = 82.5
                rain_3h = 96.0
                speed = 4.2
                cong = 88
                civic = 19
                other_inc = 1

        speed_drop_pct = max(0.0, ((dry_baseline_speed - speed) / dry_baseline_speed) * 100.0)
        vehicle_count = int(350 + cong * 6.5)
        waterlogging_count_t = 1 if civic > 0 else 0
        other_incidents_count_t = 1 if other_inc > 0 else 0

        return {
            "rainfall_mm": float(rain),
            "rainfall_sum_1h": float(rain_1h),
            "rainfall_sum_3h": float(rain_3h),
            "speed_drop_pct": float(round(speed_drop_pct, 2)),
            "vehicle_count": float(vehicle_count),
            "waterlogging_count_t": float(waterlogging_count_t),
            "other_incidents_count_t": float(other_incidents_count_t),
        }

    def predict(
        self,
        step: int,
        zone: str = "Malviya Nagar"
    ) -> Dict[str, Any]:
        """
        Run inference using the HistGradientBoostingClassifier on live step features.
        Returns clean structured output matching the predictive API contract.
        """
        if not self.is_ready or self.model is None:
            return {
                "risk_level": "Unavailable",
                "risk_probability": None,
                "prediction_window_minutes": 30,
                "prediction_horizon_minutes": 60,
                "risk_drivers": [
                    "Predictive model unavailable; current incident detection remains active."
                ],
                "model": "HistGradientBoosting",
                "status": "unavailable",
                "message": self.error_message or "Model not loaded",
                "zone": zone,
                "step": step,
                "disclaimer": "Correlation detected; causation is not established."
            }

        features = self.extract_features_for_step(step, zone=zone)
        feature_df = pd.DataFrame([features])[FEATURE_COLS]

        try:
            proba = float(self.model.predict_proba(feature_df)[0, 1])
        except Exception as e:
            return {
                "risk_level": "Unavailable",
                "risk_probability": None,
                "prediction_window_minutes": 30,
                "prediction_horizon_minutes": 60,
                "risk_drivers": [
                    "Predictive inference failed; current incident detection remains active."
                ],
                "model": "HistGradientBoosting",
                "status": "unavailable",
                "message": str(e),
                "zone": zone,
                "step": step,
                "disclaimer": "Correlation detected; causation is not established."
            }

        # Map probability to risk level
        if proba >= 0.70:
            risk_level = "HIGH"
        elif proba >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Determine concrete risk drivers
        risk_drivers = []
        if features["rainfall_mm"] > 5.0 or features["rainfall_sum_1h"] > 10.0:
            risk_drivers.append(
                f"Rainfall accumulation increasing ({features['rainfall_mm']:.1f} mm/h)"
            )
        if features["speed_drop_pct"] > 20.0:
            risk_drivers.append(
                f"Traffic speed deterioration ({int(features['speed_drop_pct'])}% drop)"
            )
        if features["waterlogging_count_t"] > 0:
            risk_drivers.append("Waterlogging complaint surge")
        if features["vehicle_count"] > 700:
            risk_drivers.append("Elevated corridor vehicular volume")

        if not risk_drivers:
            risk_drivers = [
                "Precipitation within dry baseline bounds",
                "Arterial traffic flowing normally",
                "No citizen waterlogging reports"
            ]

        # Plain language non-causal synthesis
        if risk_level == "HIGH":
            synthesis = (
                f"Current elevated rainfall and traffic deterioration are associated with "
                f"elevated predicted disruption risk ({int(proba * 100)}%) over the next 30–60 minutes."
            )
        elif risk_level == "MEDIUM":
            synthesis = (
                f"Emerging cross-domain telemetry indicates moderate disruption risk "
                f"({int(proba * 100)}%) over the next 30–60 minutes."
            )
        else:
            synthesis = (
                f"Nominal telemetry across all monitored streams indicates low predicted disruption risk "
                f"({int(proba * 100)}%) for the next 30–60 minutes."
            )

        return {
            "zone": zone,
            "step": step,
            "risk_level": risk_level,
            "risk_probability": round(proba, 4),
            "prediction_window_minutes": 30,
            "prediction_horizon_minutes": 60,
            "risk_drivers": risk_drivers,
            "model": "HistGradientBoosting",
            "status": "experimental",
            "validation": "Evaluated using leave-one-event-out validation",
            "synthesis": synthesis,
            "features": features,
            "disclaimer": "Correlation detected; causation is not established."
        }

    def predict_whatif(
        self,
        rainfall_mm: float,
        traffic_congestion_pct: float,
        waterlogging_reports: int = 0,
        transit_delay_min: float = 0.0,
        zone: str = "Malviya Nagar"
    ) -> Dict[str, Any]:
        """
        Runs inference on arbitrary what-if parameters for scenario simulation,
        directly utilizing the trained HistGradientBoostingClassifier.
        """
        if not self.is_ready or self.model is None:
            return {
                "risk_level": "Unavailable",
                "risk_probability": None,
                "prediction_window_minutes": 30,
                "prediction_horizon_minutes": 60,
                "risk_drivers": ["Predictive model unavailable"],
                "model": "HistGradientBoosting",
                "status": "unavailable",
                "zone": zone,
                "disclaimer": "Correlation detected; causation is not established."
            }

        dry_baseline_speed = 46.5
        speed_drop_pct = min(95.0, max(0.0, (traffic_congestion_pct - 20.0) * 1.15)) if traffic_congestion_pct > 20 else 0.0

        # Approximate rolling rain from instantaneous rate
        rain_1h = round(rainfall_mm * 0.85, 1)
        rain_3h = round(rainfall_mm * 1.15, 1)

        vehicle_count = float(int(350 + (traffic_congestion_pct) * 6.5))
        waterlogging_count_t = 1.0 if waterlogging_reports > 0 else 0.0
        other_incidents_count_t = 1.0 if (waterlogging_reports >= 8 or transit_delay_min >= 15) else 0.0

        features = {
            "rainfall_mm": float(rainfall_mm),
            "rainfall_sum_1h": float(rain_1h),
            "rainfall_sum_3h": float(rain_3h),
            "speed_drop_pct": float(round(speed_drop_pct, 2)),
            "vehicle_count": float(vehicle_count),
            "waterlogging_count_t": float(waterlogging_count_t),
            "other_incidents_count_t": float(other_incidents_count_t),
        }

        feature_df = pd.DataFrame([features])[FEATURE_COLS]
        try:
            proba = float(self.model.predict_proba(feature_df)[0, 1])
        except Exception as e:
            return {
                "risk_level": "Unavailable",
                "risk_probability": None,
                "prediction_window_minutes": 30,
                "prediction_horizon_minutes": 60,
                "risk_drivers": [f"Inference error: {e}"],
                "model": "HistGradientBoosting",
                "status": "error",
                "zone": zone,
                "disclaimer": "Correlation detected; causation is not established."
            }

        # Risk level categorization
        if proba >= 0.70:
            risk_level = "HIGH"
        elif proba >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Drivers
        risk_drivers = []
        if rainfall_mm >= 25.0:
            risk_drivers.append(f"Heavy rainfall intensity ({rainfall_mm:.1f} mm/h)")
        elif rainfall_mm > 5.0:
            risk_drivers.append(f"Moderate precipitation ({rainfall_mm:.1f} mm/h)")

        if traffic_congestion_pct >= 65:
            risk_drivers.append(f"Severe corridor congestion ({int(traffic_congestion_pct)}%)")
        elif traffic_congestion_pct >= 45:
            risk_drivers.append(f"Elevated traffic density ({int(traffic_congestion_pct)}%)")

        if waterlogging_reports > 0:
            risk_drivers.append(f"{waterlogging_reports} active waterlogging complaint(s)")
        if transit_delay_min >= 10:
            risk_drivers.append(f"Transit route delay (+{int(transit_delay_min)}m)")

        if not risk_drivers:
            risk_drivers = [
                "Precipitation within dry baseline bounds",
                "Arterial traffic flowing normally",
                "Zero waterlogging complaints"
            ]

        # Calculate current detection status using CityPulse severity logic
        traffic_sev = min(1.0, max(0.0, (traffic_congestion_pct - 35) / 55.0))
        weather_sev = min(1.0, max(0.0, rainfall_mm / 80.0))
        incident_sev = min(1.0, max(0.0, waterlogging_reports / 15.0))
        transit_sev = min(1.0, max(0.0, transit_delay_min / 30.0))

        composite_severity = (traffic_sev * 0.25) + (weather_sev * 0.20) + (incident_sev * 0.35) + (transit_sev * 0.20)

        if composite_severity >= 0.65 or (rainfall_mm >= 60 and traffic_congestion_pct >= 70):
            detection_status = "CRITICAL"
        elif composite_severity >= 0.30 or rainfall_mm >= 25 or traffic_congestion_pct >= 55:
            detection_status = "WATCH"
        else:
            detection_status = "NORMAL"

        return {
            "zone": zone,
            "scenario": {
                "rainfall_mm": rainfall_mm,
                "traffic_congestion_pct": traffic_congestion_pct,
                "waterlogging_reports": waterlogging_reports,
                "transit_delay_min": transit_delay_min
            },
            "detection": {
                "status": detection_status,
                "severity_score": round(composite_severity, 2),
                "severity_band": detection_status
            },
            "risk_level": risk_level,
            "risk_probability": round(proba, 4),
            "prediction_window_minutes": 30,
            "prediction_horizon_minutes": 60,
            "risk_drivers": risk_drivers,
            "model": "HistGradientBoosting",
            "status": "experimental",
            "features": features,
            "synthesis": f"Under simulated conditions ({rainfall_mm} mm/h rain, {traffic_congestion_pct}% congestion), the model estimates {risk_level.lower()} disruption risk ({int(proba * 100)}%) for {zone}.",
            "disclaimer": "Correlation detected; causation is not established."
        }


# Global singleton instance
_predictor_instance: Optional[NowcastPredictor] = None


def get_predictor() -> NowcastPredictor:
    """Returns the singleton NowcastPredictor instance, initializing if needed."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = NowcastPredictor()
    return _predictor_instance
