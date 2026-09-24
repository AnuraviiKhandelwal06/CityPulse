from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

import state
import database
from ml.predictor import get_predictor
from analytics.geo import haversine_distance_km

router = APIRouter(prefix="/api/response", tags=["response"])

# In-memory session audit log for response actions
_action_history: List[Dict[str, Any]] = [
    {
        "id": "act-init-001",
        "action_type": "system_baseline",
        "action_name": "Automated Stream Ingestion & Threshold Monitoring",
        "zone": "Citywide",
        "status": "COMPLETED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": "CityPulse continuous anomaly detection and spatiotemporal correlation active."
    }
]

class ActionRequest(BaseModel):
    action_type: str  # broadcast_alert, monitor_nearby, review_evidence, simulate_reroute
    zone: Optional[str] = "Malviya Nagar Underpass"
    notes: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


@router.get("/context")
def get_response_context():
    """
    Returns the real-time response context:
    - Active situation overview
    - Current telemetry and ML risk nowcast
    - Nearby corridor status and distance calculations
    - Traffic reroute simulation preview (-20% congestion)
    - Action audit trail
    """
    step = state.get_current_step()
    analytics = state.compute_step_analytics(step)
    alert = state.get_active_alert(step)
    predictor = get_predictor()

    rain_val = analytics.get("rain_val", 0.0)
    cong_val = int(analytics.get("cong_val", 38))
    civic_val = int(analytics.get("civic_val", 0))
    delay_val = int(analytics.get("delay_val", 0))
    speed_val = analytics.get("raw_t", {}).get("average_speed", 46.5 if step == 0 else 4.2)
    primary_zone = alert.zone if alert else "Malviya Nagar Underpass"

    # Current nowcast
    current_pred = predictor.predict(step=step, zone=primary_zone)
    curr_prob = current_pred.get("risk_probability", 0.1) or 0.1
    curr_level = current_pred.get("risk_level", "LOW")

    # Evaluate simulated reroute (-20% congestion)
    rerouted_cong = max(20, cong_val - 20)
    reroute_whatif = predictor.predict_whatif(
        rainfall_mm=rain_val,
        traffic_congestion_pct=float(rerouted_cong),
        waterlogging_reports=civic_val,
        transit_delay_min=max(0.0, delay_val - 8.0),
        zone=primary_zone
    )
    reroute_prob = reroute_whatif.get("risk_probability", 0.1) or 0.1
    reroute_level = reroute_whatif.get("risk_level", "LOW")
    prob_delta = round((reroute_prob - curr_prob) * 100, 1)

    # Calculate nearby corridors from Malviya Nagar (lat: 28.5355, lon: 77.2065)
    ref_lat = 28.5355
    ref_lon = 77.2065
    raw_corridors = [
        {"name": "Saket Corridor", "lat": 28.5245, "lon": 77.2066, "cong": 20, "speed": 48.0, "status": "Clear Flow", "risk": "LOW"},
        {"name": "South Extension Ring", "lat": 28.5728, "lon": 77.2217, "cong": 25, "speed": 42.0, "status": "Nominal Flow", "risk": "LOW"},
        {"name": "Nehru Place Arterial", "lat": 28.5494, "lon": 77.2519, "cong": 30, "speed": 36.0, "status": "Moderate Flow", "risk": "LOW"},
        {"name": "Lajpat Nagar Ring", "lat": 28.5677, "lon": 77.2433, "cong": 58 if step >= 2 else 38, "speed": 30.0, "status": "Slow Traffic", "risk": "MEDIUM" if step >= 2 else "LOW"},
        {"name": "Connaught Place Radial", "lat": 28.6315, "lon": 77.2167, "cong": 54 if step >= 2 else 35, "speed": 32.0, "status": "Slow Traffic", "risk": "MEDIUM" if step >= 2 else "LOW"},
    ]

    nearby_corridors = []
    for c in raw_corridors:
        dist_km = round(haversine_distance_km(ref_lat, ref_lon, c["lat"], c["lon"]), 1)
        nearby_corridors.append({
            "name": c["name"],
            "distance_km": dist_km,
            "congestion": c["cong"],
            "speed_kmh": c["speed"],
            "status": c["status"],
            "risk_level": c["risk"],
            "recommendation": "Viable diversion route" if c["cong"] < 35 else "Approaching capacity"
        })

    # Sort corridors by distance
    nearby_corridors.sort(key=lambda x: x["distance_km"])

    return {
        "current_step": step,
        "situation": {
            "zone": primary_zone,
            "alert_active": alert is not None and alert.severity in ["CRITICAL", "HIGH", "MEDIUM"],
            "severity": alert.severity if alert else "NORMAL",
            "severity_score": alert.severity_score if alert else analytics.get("severity_score", 0.05),
            "confidence": alert.confidence if alert else 0.95,
            "disclaimer": "Correlation detected; causation is not established.",
            "signals": {
                "rainfall": f"{rain_val:.1f} mm/h",
                "congestion": f"{cong_val}%",
                "average_speed": f"{speed_val} km/h",
                "civic_reports": f"{civic_val} waterlogging reports",
                "transit_delay": f"+{delay_val} min"
            },
            "nowcast": {
                "risk_level": curr_level,
                "risk_probability": round(curr_prob * 100, 1),
                "horizon": "30-60 min",
                "model": "HistGradientBoosting"
            }
        },
        "reroute_simulation": {
            "baseline_congestion": cong_val,
            "rerouted_congestion": rerouted_cong,
            "baseline_probability_pct": round(curr_prob * 100, 1),
            "rerouted_probability_pct": round(reroute_prob * 100, 1),
            "probability_delta_pct": prob_delta,
            "baseline_risk_level": curr_level,
            "rerouted_risk_level": reroute_level,
            "estimated_speed_kmh": 22.0 if cong_val > 70 else 38.0,
            "synthesis": f"Rerouting 20% arterial traffic away from {primary_zone} lowers simulated congestion from {cong_val}% to {rerouted_cong}%, shifting predicted disruption risk from {curr_level} ({round(curr_prob * 100)}%) down to {reroute_level} ({round(reroute_prob * 100)}%)."
        },
        "nearby_corridors": nearby_corridors,
        "action_history": list(reversed(_action_history))
    }


@router.post("/action")
def execute_response_action(req: ActionRequest):
    """
    Executes a simulated civic intelligence response action and records it
    in the audit history trail.
    """
    step = state.get_current_step()
    analytics = state.compute_step_analytics(step)
    alert = state.get_active_alert(step)
    predictor = get_predictor()

    rain_val = analytics.get("rain_val", 0.0)
    cong_val = int(analytics.get("cong_val", 38))
    civic_val = int(analytics.get("civic_val", 0))
    speed_val = analytics.get("raw_t", {}).get("average_speed", 46.5 if step == 0 else 4.2)
    zone_name = req.zone or (alert.zone if alert else "Malviya Nagar Underpass")

    now_iso = datetime.now(timezone.utc).isoformat()
    action_id = f"act-{len(_action_history) + 1:03d}"

    if req.action_type == "broadcast_alert":
        msg = f"Public Civic Advisory: Co-occurring high precipitation ({rain_val:.1f} mm/h), arterial congestion ({cong_val}%), and localized waterlogging reported along {zone_name}. Commuters advised to divert via Saket or South Extension corridors."
        entry = {
            "id": action_id,
            "action_type": "broadcast_alert",
            "action_name": "Broadcast Civic Advisory Alert",
            "zone": zone_name,
            "status": "DISPATCHED",
            "timestamp": now_iso,
            "details": msg,
            "channels": [
                "Delhi Citizen Alert App (Push Notification)",
                "Variable Message Signs (VMS) on Outer Ring Road",
                "Delhi Traffic Police Real-Time Dispatch Desk",
                "Municipal Emergency Operations Center (EOC)"
            ]
        }
        _action_history.append(entry)
        return {
            "status": "success",
            "action": entry,
            "message": "Civic alert broadcast successfully dispatched across all municipal integration channels."
        }

    elif req.action_type == "monitor_nearby":
        corridors = ["Saket Corridor (1.4 km)", "South Extension Ring (4.1 km)", "Nehru Place Arterial (4.7 km)", "Lajpat Nagar (4.9 km)"]
        entry = {
            "id": action_id,
            "action_type": "monitor_nearby",
            "action_name": "Elevate Monitoring on Nearby Corridors",
            "zone": zone_name,
            "status": "MONITORING_ACTIVE",
            "timestamp": now_iso,
            "details": f"Placed 4 adjacent transit corridors within 5 km radius on high-frequency 60-second telemetry polling to track queue propagation.",
            "monitored_corridors": corridors
        }
        _action_history.append(entry)
        return {
            "status": "success",
            "action": entry,
            "message": f"High-frequency surveillance active for 4 adjacent corridors around {zone_name}."
        }

    elif req.action_type == "simulate_reroute":
        # Run what-if model inference with -20% congestion
        rerouted_cong = max(20, cong_val - 20)
        curr_pred = predictor.predict(step=step, zone=zone_name)
        curr_prob = curr_pred.get("risk_probability", 0.1) or 0.1

        reroute_pred = predictor.predict_whatif(
            rainfall_mm=rain_val,
            traffic_congestion_pct=float(rerouted_cong),
            waterlogging_reports=civic_val,
            transit_delay_min=max(0.0, analytics.get("delay_val", 0) - 8.0),
            zone=zone_name
        )
        reroute_prob = reroute_pred.get("risk_probability", 0.1) or 0.1
        delta_pct = round((reroute_prob - curr_prob) * 100, 1)

        entry = {
            "id": action_id,
            "action_type": "simulate_reroute",
            "action_name": "Simulate Arterial Traffic Diversion (-20% Congestion)",
            "zone": zone_name,
            "status": "SIMULATION_EXECUTED",
            "timestamp": now_iso,
            "details": f"Model simulated 20% arterial volume diversion. Congestion reduced from {cong_val}% to {rerouted_cong}%. Predicted disruption probability dropped by {abs(delta_pct)}% (from {round(curr_prob * 100)}% to {round(reroute_prob * 100)}%).",
            "metrics": {
                "before_congestion": f"{cong_val}%",
                "after_congestion": f"{rerouted_cong}%",
                "before_risk_prob": f"{round(curr_prob * 100)}%",
                "after_risk_prob": f"{round(reroute_prob * 100)}%",
                "delta": f"{delta_pct}%",
                "diversion_routes": ["Saket Corridor (1.4 km, 20% load)", "South Extension (4.1 km, 25% load)"]
            }
        }
        _action_history.append(entry)
        return {
            "status": "success",
            "action": entry,
            "message": f"Traffic diversion simulated. Predicted disruption risk reduced by {abs(delta_pct)}%."
        }

    elif req.action_type == "review_evidence":
        entry = {
            "id": action_id,
            "action_type": "review_evidence",
            "action_name": "Multi-Source Evidence Audit Dossier Compiled",
            "zone": zone_name,
            "status": "COMPILED",
            "timestamp": now_iso,
            "details": f"Compiled cross-stream telemetry for {zone_name}: {rain_val:.1f} mm/h precipitation (radar), {cong_val}% congestion at {speed_val} km/h (loops), {civic_val} 311 flood tickets (municipal desk). Spatiotemporal co-location verified.",
            "evidence_count": len(analytics.get("evidence_breakdown", []))
        }
        _action_history.append(entry)
        return {
            "status": "success",
            "action": entry,
            "message": "Evidence audit compiled. Cross-stream corroboration verified."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action type: {req.action_type}")
