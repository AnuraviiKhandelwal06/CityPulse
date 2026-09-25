from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
import state
from ml.predictor import get_predictor

router = APIRouter(prefix="/api/prediction", tags=["prediction"])


@router.get("")
def get_prediction(
    step: Optional[int] = Query(None, ge=0, le=4, description="Simulation step (0-4)"),
    zone: Optional[str] = Query("Malviya Nagar", description="Target zone name")
) -> Dict[str, Any]:
    """
    Returns the 30-60 minute predictive disruption risk computed by the
    HistGradientBoosting early-warning nowcast model from current live signals.
    """
    if step is None:
        step = state.get_current_step()

    print(f"\n--- [PREDICTION REQUEST RECEIVED] ---", flush=True)
    print(f"1. Prediction request received: step={step}, zone={zone}", flush=True)
    try:
        predictor = get_predictor()
        model_name = predictor.model.__class__.__name__ if predictor.model else "None"
        print(f"2. Model loaded: {model_name} (is_ready={predictor.is_ready})", flush=True)
        res = predictor.predict(step=step, zone=zone or "Malviya Nagar")
        print(f"3. Features generated: {res.get('features')}", flush=True)
        print(f"4. Raw model probability: {res.get('risk_probability')}", flush=True)
        print(f"5. Risk level: {res.get('risk_level')}", flush=True)
        print(f"6. API response: status={res.get('status')}, drivers={len(res.get('risk_drivers', []))}", flush=True)
        print(f"--- [PREDICTION COMPLETE] ---\n", flush=True)
        return res
    except Exception as e:
        print(f"[PREDICTION ERROR]: {e}", flush=True)
        return {
            "zone": zone or "Malviya Nagar",
            "step": step,
            "risk_level": "Unavailable",
            "risk_probability": None,
            "prediction_window_minutes": 30,
            "prediction_horizon_minutes": 60,
            "risk_drivers": [
                "Predictive model unavailable; current incident detection remains active."
            ],
            "model": "HistGradientBoosting",
            "status": "unavailable",
            "message": str(e),
            "disclaimer": "Correlation detected; causation is not established."
        }


@router.get("/simulate")
@router.post("/simulate")
def simulate_whatif(
    rainfall_mm: float = Query(25.0, description="Rainfall intensity in mm/h"),
    traffic_congestion: float = Query(50.0, description="Traffic congestion percentage (0-100%)"),
    waterlogging_reports: int = Query(2, description="Citizen waterlogging complaints"),
    transit_delay_min: float = Query(5.0, description="Transit delay minutes"),
    zone: str = Query("Malviya Nagar", description="Target zone name")
) -> Dict[str, Any]:
    """
    Evaluates scenario inputs through the existing HistGradientBoosting model
    and CityPulse severity/detection rules.
    """
    print(f"\n--- [WHAT-IF SIMULATION REQUEST RECEIVED] ---", flush=True)
    print(f"Payload: rainfall_mm={rainfall_mm}, traffic_congestion={traffic_congestion}, waterlogging_reports={waterlogging_reports}, transit_delay_min={transit_delay_min}, zone={zone}", flush=True)
    try:
        predictor = get_predictor()
        res = predictor.predict_whatif(
            rainfall_mm=rainfall_mm,
            traffic_congestion_pct=traffic_congestion,
            waterlogging_reports=waterlogging_reports,
            transit_delay_min=transit_delay_min,
            zone=zone
        )
        print(f"Inference result: prob={res.get('risk_probability')}, risk={res.get('risk_level')}, detection={res.get('detection', {}).get('status')}", flush=True)
        print(f"--- [WHAT-IF SIMULATION COMPLETE] ---\n", flush=True)
        return res
    except Exception as e:
        print(f"[WHAT-IF ERROR]: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
            "disclaimer": "Correlation detected; causation is not established."
        }
